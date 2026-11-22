'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gift, Loader2, RefreshCw, ScanFace, Timer } from 'lucide-react';
import type { AnswerInput, Choice, PublicMission, PublicMissionSet, SetResult, VerifySession } from '@/types';
import { SEED_EN, translatePromptToEn } from '@/data/missions.en';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { MissionCard } from '@/components/MissionCard';
import { useScanModal } from '@/components/ScanModal';
import { WarningModal } from '@/components/WarningModal';
import { ApiError, api } from '@/lib/apiClient';
import { BehaviorMonitor } from '@/lib/behavior';
import { errorMessage, formatMmSs } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { VERIFY_TEXT } from '@/lib/i18n';
import { clearVerifySession, getActiveSession, recheckHuman, startHumanSession } from '@/lib/piVerifyClient';
import { saveLastResult } from '@/lib/resultStore';

const SELECT_FEEDBACK_MS = 260;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = 'idle' | 'need-session' | 'loading' | 'playing' | 'submitting' | 'error';

export default function VerifyPage() {
  return (
    <Suspense fallback={<CenterSpinner label="불러오는 중…" />}>
      <VerifyGame />
    </Suspense>
  );
}

function VerifyGame() {
  const { ready, profile, verifyMode, refresh, lang } = useApp();
  const t = VERIFY_TEXT[lang];
  const router = useRouter();
  const challenge = useSearchParams().get('challenge') ?? undefined;
  const now = useNow(1000);
  const { modal, run } = useScanModal(verifyMode === 'mock');

  const [phase, setPhase] = useState<Phase>('idle');
  const [session, setSession] = useState<VerifySession | null>(null);
  const [missionSet, setMissionSet] = useState<PublicMissionSet | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [locked, setLocked] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monitor = useRef(new BehaviorMonitor());
  const answers = useRef<AnswerInput[]>([]);
  const shownAt = useRef(0);
  /** 세트를 준비한 계정 uid (재로그인 등으로 계정이 바뀌면 다시 초기화) */
  const initializedFor = useRef<string | null>(null);

  /* ---------------- 세트 발급 ---------------- */
  const loadSet = useCallback(
    async (s: VerifySession) => {
      setPhase('loading');
      setError(null);
      try {
        const data = await api<PublicMissionSet>('/api/missions/set', {
          body: { verifyToken: s.token, challenge },
        });
        monitor.current.reset();
        answers.current = [];
        setMissionSet(data);
        setIndex(0);
        setSelected(null);
        setLocked(false);
        setPhase('playing');
      } catch (err) {
        if (err instanceof ApiError && err.code === 'VERIFY_REQUIRED') {
          clearVerifySession();
          setSession(null);
          setPhase('need-session');
          return;
        }
        setError(errorMessage(err));
        setPhase('error');
      }
    },
    [challenge],
  );

  useEffect(() => {
    if (!ready || !profile || initializedFor.current === profile.uid) return;
    initializedFor.current = profile.uid;
    const s = getActiveSession(profile.uid);
    setSession(s);
    if (s) void loadSet(s);
    else setPhase('need-session');
  }, [ready, profile, loadSet]);

  // 문항이 화면에 표시된 시점부터 반응시간 측정
  useEffect(() => {
    if (phase === 'playing') shownAt.current = performance.now();
  }, [phase, index]);

  /* ---------------- 1단계: 세션 시작 ---------------- */
  const startSession = async () => {
    try {
      const s = await run(() => startHumanSession(), {
        title: t.scanTitle,
        subtitle: t.scanSubtitle,
      });
      setSession(s);
      await loadSet(s);
    } catch {
      /* 모달에서 오류 표시 */
    }
  };

  /* ---------------- 제출 ---------------- */
  async function submit(allowRetry = true): Promise<void> {
    if (!missionSet) return;
    setPhase('submitting');
    try {
      const s = getActiveSession();
      if (!s) throw new ApiError(401, '인간 판별 세션이 만료되었습니다.', 'VERIFY_REQUIRED');

      const result = await api<SetResult>('/api/missions/submit', {
        body: { setId: missionSet.setId, verifyToken: s.token, answers: answers.current },
      });
      saveLastResult(result);
      void refresh();
      router.push('/verify/result');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VERIFY_REQUIRED' && allowRetry) {
        try {
          const s = await run(() => startHumanSession(), {
            title: t.expiredTitle,
            subtitle: t.expiredSubtitle,
          });
          setSession(s);
          return submit(false);
        } catch {
          /* 아래에서 오류 표시 */
        }
      }
      setError(errorMessage(err));
      setPhase('error');
    }
  }

  const advance = () => {
    if (!missionSet) return;
    if (index + 1 < missionSet.missions.length) {
      setIndex(index + 1);
      setSelected(null);
      setLocked(false);
    } else {
      void submit();
    }
  };

  /* ---------------- 선택 & 2단계 행동 감시 ---------------- */
  const choose = async (choice: Choice) => {
    if (!missionSet || locked || phase !== 'playing') return;
    const mission = missionSet.missions[index];
    const reactionMs = Math.max(0, Math.round(performance.now() - shownAt.current));

    setLocked(true);
    setSelected(choice);
    answers.current.push({ missionId: mission.id, choice, reactionMs });
    const verdict = monitor.current.record({ missionId: mission.id, reactionMs, at: Date.now() });

    await sleep(SELECT_FEEDBACK_MS);
    if (verdict.suspicious) {
      setWarning(verdict.reason ?? '비정상 매크로 패턴이 감지되었습니다.');
      return;
    }
    advance();
  };

  const onRecheck = async () => {
    setWarning(null);
    try {
      const s = await run(() => recheckHuman(), {
        title: t.recheckTitle,
        subtitle: t.recheckSubtitle,
      });
      setSession(s);
      monitor.current.clearStreak();
      advance();
    } catch {
      setWarning(t.recheckFailed);
    }
  };

  /* ---------------- 렌더 ---------------- */
  if (!ready) return <CenterSpinner label={t.loading} />;
  if (!profile) return <LoginPanel title={t.loginTitle} />;

  const remaining = session ? Math.max(0, session.expiresAt - now) : 0;

  return (
    <div className="space-y-4">
      {modal}
      <WarningModal open={warning !== null} message={warning ?? ''} onRecheck={onRecheck} />

      {(phase === 'idle' || phase === 'loading') && <CenterSpinner label={t.preparing} />}

      {phase === 'need-session' && (
        <section className="card space-y-4 text-center">
          <ScanFace className="mx-auto h-12 w-12 text-human" strokeWidth={1.4} />
          <div>
            <h1 className="text-lg font-bold text-white">{t.needSessionTitle}</h1>
            <p className="mt-1 text-sm text-slate-400">{t.needSessionDesc}</p>
          </div>
          {challenge && <ChallengeChip label={t.challengeChip} />}
          <button type="button" className="btn-primary w-full py-4" onClick={startSession}>
            <ScanFace className="h-5 w-5" />
            {t.startSessionBtn}
          </button>
        </section>
      )}

      {phase === 'error' && (
        <section className="card space-y-3 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => {
              const s = getActiveSession();
              if (s) void loadSet(s);
              else setPhase('need-session');
            }}
          >
            <RefreshCw className="h-4 w-4" />{t.retryBtn}
          </button>
        </section>
      )}

      {(phase === 'playing' || phase === 'submitting') && missionSet && (
        <>
          {/* 진행 상태 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                {t.question} <span className="text-human">{index + 1}</span> / {missionSet.missions.length}
              </span>
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <Timer className="h-3.5 w-3.5" />
                {t.session} {formatMmSs(remaining)}
              </span>
            </div>
            <div className="flex gap-1">
              {missionSet.missions.map((m, i) => (
                <div key={m.id} className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-human' : i === index ? 'bg-human/50' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          {challenge && index === 0 && <ChallengeChip label={t.challengeChip} />}

          {/* 질문 & A/B 카드 (영문 모드 시 시드 문항 번역 적용) */}
          {(() => {
            const raw = missionSet.missions[index];
            const m = localizeMission(raw, lang);
            return (
              <>
                <h1 className="text-lg font-bold leading-snug text-white">{m.prompt}</h1>
                <div className="space-y-3" key={m.id}>
                  {(['A', 'B'] as const).map((side) => (
                    <MissionCard
                      key={side}
                      side={side}
                      content={side === 'A' ? m.a : m.b}
                      selected={selected === side}
                      disabled={locked || phase !== 'playing'}
                      onSelect={(c) => void choose(c)}
                    />
                  ))}
                </div>
              </>
            );
          })()}

          <p className="text-center text-[11px] text-slate-500">{t.footerHint}</p>

          {phase === 'submitting' && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-sm text-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-human" />
                {t.submitting}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function localizeMission(m: PublicMission, lang: 'ko' | 'en'): PublicMission {
  if (lang !== 'en') return m;
  const tr = SEED_EN[m.id];
  if (!tr) {
    return { ...m, prompt: translatePromptToEn(m.prompt) };
  }
  return {
    ...m,
    prompt: tr.prompt,
    a:
      m.a.type === 'text'
        ? { ...m.a, sourceLabel: tr.sourceLabel ?? m.a.sourceLabel, body: tr.aBody ?? m.a.body }
        : { ...m.a, placeholderLabel: tr.aPlaceholder ?? m.a.placeholderLabel },
    b:
      m.b.type === 'text'
        ? { ...m.b, sourceLabel: tr.sourceLabel ?? m.b.sourceLabel, body: tr.bBody ?? m.b.body }
        : { ...m.b, placeholderLabel: tr.bPlaceholder ?? m.b.placeholderLabel },
  };
}

function ChallengeChip({ label }: { label: string }) {
  return (
    <p className="chip mx-auto bg-pi/15 text-pi-light">
      <Gift className="h-3.5 w-3.5" />
      {label}
    </p>
  );
}

function CenterSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-human" />
      {label}
    </div>
  );
}
