'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flag, Gift, Lightbulb, Loader2, RefreshCw, ScanFace, Timer, X } from 'lucide-react';
import type { AnswerInput, Choice, PublicMission, PublicMissionSet, SetResult, VerifySession } from '@/types';
import { SEED_EN, translatePromptToEn, translatePromptToKo, translateSourceLabel } from '@/data/missions.en';
import { AiHintsModal } from '@/components/AiHintsModal';
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
  const [reportOpen, setReportOpen] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

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
          body: { verifyToken: s.token, challenge, lang },
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
    [challenge, lang],
  );

  useEffect(() => {
    const key = profile ? `${profile.uid}:${lang}` : null;
    if (!ready || !profile || !key || initializedFor.current === key) return;
    initializedFor.current = key;
    const s = getActiveSession(profile.uid);
    setSession(s);
    if (s) void loadSet(s);
    else setPhase('need-session');
  }, [ready, profile, lang, loadSet]);

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

  const submitReport = async (reason: 'copyright' | 'harmful' | 'spam') => {
    if (!missionSet || reporting) return;
    setReporting(true);
    try {
      const res = await api<{ reported: boolean; hidden: boolean }>('/api/missions/report', {
        body: { missionId: missionSet.missions[index].id, reason },
      });
      setReportOpen(false);
      setToast(
        res.hidden
          ? lang === 'en'
            ? 'Report received. Item hidden from pool.'
            : '신고가 누적되어 문항이 비공개 처리되었습니다.'
          : lang === 'en'
            ? 'Report submitted. Thank you.'
            : '신고가 접수되었습니다. 감사합니다.',
      );
    } catch (err) {
      setToast(errorMessage(err));
    } finally {
      setReporting(false);
    }
  };

  /* ---------------- 렌더 ---------------- */
  if (!ready) return <CenterSpinner label={t.loading} />;
  if (!profile) return <LoginPanel title={t.loginTitle} />;

  const remaining = session ? Math.max(0, session.expiresAt - now) : 0;

  return (
    <div className="space-y-4">
      {modal}
      <AiHintsModal open={hintsOpen} onClose={() => setHintsOpen(false)} lang={lang} />
      <WarningModal open={warning !== null} message={warning ?? ''} onRecheck={onRecheck} />

      {(phase === 'idle' || phase === 'loading') && <CenterSpinner label={t.preparing} />}

      {phase === 'need-session' && (
        <section className="card space-y-4 text-center">
          <ScanFace className="mx-auto h-12 w-12 text-brand" strokeWidth={1.5} />
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t.needSessionTitle}</h1>
            <p className="mt-1.5 text-base text-slate-600">{t.needSessionDesc}</p>
          </div>
          {challenge && <ChallengeChip label={t.challengeChip} />}
          <button type="button" className="btn-primary w-full py-4 text-base" onClick={startSession}>
            <ScanFace className="h-5 w-5" />
            {t.startSessionBtn}
          </button>
          <button type="button" className="btn-ghost w-full text-sm" onClick={() => setHintsOpen(true)}>
            <Lightbulb className="h-4 w-4 text-pi-light" />
            {lang === 'en' ? 'View AI Detection Hints First' : '판별 전 AI 감별 힌트 보기'}
          </button>
        </section>
      )}

      {phase === 'error' && (
        <section className="card space-y-3 text-center">
          <p className="text-base text-red-600">{error}</p>
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
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">
                {t.question} <span className="text-brand">{index + 1}</span> / {missionSet.missions.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHintsOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-pi-light hover:bg-amber-100"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {lang === 'en' ? 'Hints' : 'AI 힌트'}
                </button>
                <span className="flex items-center gap-1 font-mono text-slate-500">
                  <Timer className="h-4 w-4" />
                  {t.session} {formatMmSs(remaining)}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {missionSet.missions.map((m, i) => (
                <div key={m.id} className={`h-2 flex-1 rounded-full ${i < index ? 'bg-brand' : i === index ? 'bg-brand/40' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>

          {challenge && index === 0 && <ChallengeChip label={t.challengeChip} />}

          {/* 질문 & 카드 (단일 감별 vs A/B 비교) */}
          {(() => {
            const raw = missionSet.missions[index];
            const m = localizeMission(raw, lang);
            const isSingle = m.mode === 'single';
            return (
              <>
                <h1 className="text-xl font-bold leading-snug text-slate-900">{m.prompt}</h1>
                {isSingle ? (
                  <div className="space-y-3" key={m.id}>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      {m.a.type === 'text' ? (
                        <div className="p-5">
                          {m.a.sourceLabel && (
                            <span className="chip mb-2.5 bg-brand-soft text-brand">{m.a.sourceLabel}</span>
                          )}
                          <p className="whitespace-pre-line text-base leading-relaxed text-slate-800">{m.a.body}</p>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.a.src} alt={m.a.alt} draggable={false} className="aspect-[4/3] w-full select-none object-cover" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { side: 'A' as const, ko: '실제 인간 원본', en: 'Authentic Human' },
                          { side: 'B' as const, ko: 'AI 생성 · 합성', en: 'AI-Generated' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.side}
                          type="button"
                          disabled={locked || phase !== 'playing'}
                          onClick={() => void choose(opt.side)}
                          className={
                            selected === opt.side
                              ? 'btn border-2 border-brand bg-brand-soft py-4 text-base text-brand'
                              : 'btn border-2 border-slate-200 bg-white py-4 text-base text-slate-800 shadow-sm hover:border-brand/50'
                          }
                        >
                          {lang === 'en' ? opt.en : opt.ko}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
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
                )}
              </>
            );
          })()}

          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <p className="flex-1">{t.footerHint}</p>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Flag className="h-3.5 w-3.5" />
              {lang === 'en' ? 'Report' : '신고'}
            </button>
          </div>

          {reportOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-xs space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
                    <Flag className="h-4 w-4 text-red-500" />
                    {lang === 'en' ? 'Report Content' : '문항 신고하기'}
                  </h2>
                  <button type="button" onClick={() => setReportOpen(false)} aria-label="닫기" className="text-slate-400 hover:text-slate-900">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600">
                  {lang === 'en'
                    ? 'Reported user-submitted items are automatically hidden after 2 reports.'
                    : '신고가 2회 이상 접수된 의뢰 문항은 즉시 비공개 처리됩니다.'}
                </p>
                <div className="space-y-2">
                  {(
                    [
                      { id: 'copyright', ko: '저작권 · 초상권 침해', en: 'Copyright / Portrait Infringement' },
                      { id: 'harmful', ko: '유해 · 불법 콘텐츠', en: 'Harmful or Illegal Content' },
                      { id: 'spam', ko: '스팸 · 비교 불가 오류', en: 'Spam / Broken Comparison' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={reporting}
                      onClick={() => void submitReport(item.id)}
                      className="btn-ghost w-full justify-start text-sm"
                    >
                      {lang === 'en' ? item.en : item.ko}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {toast && (
            <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
              <p className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</p>
            </div>
          )}

          {phase === 'submitting' && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/75 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-base font-semibold text-slate-800">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
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
  if (lang === 'ko') {
    return {
      ...m,
      prompt: translatePromptToKo(m.prompt),
      a: m.a.type === 'text' ? { ...m.a, sourceLabel: translateSourceLabel(m.a.sourceLabel, 'ko') } : m.a,
      b: m.b.type === 'text' ? { ...m.b, sourceLabel: translateSourceLabel(m.b.sourceLabel, 'ko') } : m.b,
    };
  }
  const tr = SEED_EN[m.id];
  if (!tr) {
    return {
      ...m,
      prompt: translatePromptToEn(m.prompt),
      a: m.a.type === 'text' ? { ...m.a, sourceLabel: translateSourceLabel(m.a.sourceLabel, 'en') } : m.a,
      b: m.b.type === 'text' ? { ...m.b, sourceLabel: translateSourceLabel(m.b.sourceLabel, 'en') } : m.b,
    };
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
    <p className="chip mx-auto border border-amber-200 bg-amber-50 text-pi-light">
      <Gift className="h-4 w-4" />
      {label}
    </p>
  );
}

function CenterSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-base text-slate-600">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
      {label}
    </div>
  );
}
