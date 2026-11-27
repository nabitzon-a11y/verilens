'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flag, Flame, Gift, Lightbulb, Loader2, RefreshCw, ScanFace, Timer, X, ZoomIn } from 'lucide-react';
import type { AnswerInput, Choice, PublicBonusQuiz, PublicMission, PublicMissionSet, SetResult, VerifySession } from '@/types';
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
const PROGRESS_KEY = 'verilens_verify_progress';
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface SavedVerifyProgress {
  uid: string;
  mode: string;
  challenge?: string;
  missionSet: PublicMissionSet;
  index: number;
  answers: AnswerInput[];
}

function saveVerifyProgress(p: SavedVerifyProgress) {
  try {
    window.sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* 용량 초과 등 무시 */
  }
}

function loadVerifyProgress(uid: string, mode: string, challenge?: string): SavedVerifyProgress | null {
  try {
    const raw = window.sessionStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SavedVerifyProgress;
    if (p.uid !== uid || p.mode !== mode || p.challenge !== challenge) return null;
    if (!p.missionSet?.setId || !Array.isArray(p.answers)) return null;
    if (p.answers.length >= p.missionSet.missions.length) return null;
    return p;
  } catch {
    return null;
  }
}

function clearVerifyProgress() {
  try {
    window.sessionStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* 무시 */
  }
}

type Phase = 'idle' | 'need-session' | 'loading' | 'playing' | 'bonus' | 'submitting' | 'error';

export default function VerifyPage() {
  return (
    <Suspense fallback={<CenterSpinner label="Loading…" />}>
      <VerifyGame />
    </Suspense>
  );
}

function VerifyGame() {
  const { ready, profile, verifyMode, refresh, lang } = useApp();
  const t = VERIFY_TEXT[lang];
  const router = useRouter();
  const searchParams = useSearchParams();
  const challenge = searchParams.get('challenge') ?? undefined;
  const mode = searchParams.get('mode') === 'daily' ? 'daily' : 'normal';
  const now = useNow(1000);
  const { modal, run } = useScanModal(verifyMode === 'mock');

  const [phase, setPhase] = useState<Phase>('idle');
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null);
  const [session, setSession] = useState<VerifySession | null>(null);
  const [missionSet, setMissionSet] = useState<PublicMissionSet | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [pickedReason, setPickedReason] = useState<string | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** 보너스 문제 선택 (null = 아직 선택 안 함 / -1 = 건너뜀) */
  const [bonusPicked, setBonusPicked] = useState<number | null>(null);

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

  /* ---------------- 세트 발급 (새로고침 복원 포함) ---------------- */
  const loadSet = useCallback(
    async (s: VerifySession) => {
      if (profile) {
        const saved = loadVerifyProgress(profile.uid, mode, challenge);
        if (saved) {
          monitor.current.reset();
          answers.current = saved.answers;
          setMissionSet(saved.missionSet);
          setIndex(Math.min(saved.index, Math.max(0, saved.missionSet.missions.length - 1)));
          setSelected(null);
          setPickedReason(undefined);
          setLocked(false);
          setBonusPicked(null);
          setPhase('playing');
          return;
        }
      }
      setPhase('loading');
      setError(null);
      try {
        const data = await api<PublicMissionSet>('/api/missions/set', {
          body: { verifyToken: s.token, challenge, lang, mode },
        });
        monitor.current.reset();
        answers.current = [];
        setMissionSet(data);
        setIndex(0);
        setSelected(null);
        setPickedReason(undefined);
        setLocked(false);
        setBonusPicked(null);
        setPhase('playing');
        if (profile) {
          saveVerifyProgress({ uid: profile.uid, mode, challenge, missionSet: data, index: 0, answers: [] });
        }
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
    [challenge, lang, mode, profile],
  );

  useEffect(() => {
    const key = profile ? `${profile.uid}:${lang}:${mode}` : null;
    if (!ready || !profile || !key || initializedFor.current === key) return;
    initializedFor.current = key;
    const s = getActiveSession(profile.uid);
    setSession(s);
    if (s) void loadSet(s);
    else setPhase('need-session');
  }, [ready, profile, lang, mode, loadSet]);

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
  async function submit(allowRetry = true, bonusChoice?: number): Promise<void> {
    if (!missionSet) return;
    setPhase('submitting');
    try {
      const s = getActiveSession();
      if (!s) throw new ApiError(401, '인간 판별 세션이 만료되었습니다.', 'VERIFY_REQUIRED');

      let refUid: string | undefined;
      try {
        refUid = window.localStorage.getItem('verilens_ref') || undefined;
      } catch {
        /* 무시 */
      }

      const result = await api<SetResult>('/api/missions/submit', {
        body: {
          setId: missionSet.setId,
          verifyToken: s.token,
          answers: answers.current,
          ...(typeof bonusChoice === 'number' && bonusChoice >= 0 ? { bonusChoice } : {}),
          ...(refUid ? { refUid } : {}),
        },
      });
      try {
        window.localStorage.removeItem('verilens_ref');
      } catch {
        /* 무시 */
      }
      clearVerifyProgress();
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
          return submit(false, bonusChoice);
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
      setPickedReason(undefined);
      setLocked(false);
    } else if (missionSet.bonus) {
      setPhase('bonus');
    } else {
      void submit();
    }
  };

  const chooseBonus = async (choice: number) => {
    if (phase !== 'bonus' || bonusPicked !== null) return;
    setBonusPicked(choice);
    await sleep(SELECT_FEEDBACK_MS);
    void submit(true, choice);
  };

  /* ---------------- 선택 & 2단계 행동 감시 ---------------- */
  const choose = async (choice: Choice) => {
    if (!missionSet || locked || phase !== 'playing') return;
    const mission = missionSet.missions[index];
    const reactionMs = Math.max(0, Math.round(performance.now() - shownAt.current));

    setLocked(true);
    setSelected(choice);
    answers.current.push({
      missionId: mission.id,
      choice,
      reactionMs,
      ...(pickedReason ? { reason: pickedReason } : {}),
    });
    if (profile) {
      saveVerifyProgress({
        uid: profile.uid,
        mode,
        challenge,
        missionSet,
        index: index + 1,
        answers: answers.current,
      });
    }
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
              clearVerifyProgress();
              const s = getActiveSession();
              if (s) void loadSet(s);
              else setPhase('need-session');
            }}
          >
            <RefreshCw className="h-4 w-4" />{t.retryBtn}
          </button>
        </section>
      )}

      {(phase === 'playing' || (phase === 'submitting' && bonusPicked === null)) && missionSet && (
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

          {mode === 'daily' && index === 0 && (
            <p className="chip mx-auto border border-amber-300 bg-amber-50 text-amber-800">
              <Flame className="h-4 w-4 text-orange-500" />
              {lang === 'en' ? "Today's Daily Challenge · Worldwide" : '오늘의 데일리 챌린지 · 전 세계 공통'}
            </p>
          )}
          {challenge && index === 0 && <ChallengeChip label={t.challengeChip} />}

          {/* 질문 & 카드 (단일 감별 vs A/B 비교) */}
          {(() => {
            const raw = missionSet.missions[index];
            const m = localizeMission(raw, lang);
            const isSingle = m.mode === 'single';
            return (
              <>
                {m.difficulty === 3 && (
                  <span className="chip w-fit border border-rose-200 bg-rose-50 text-rose-600">
                    <Flame className="h-3.5 w-3.5" />
                    {lang === 'en' ? 'HARD · Most people get fooled' : '고난도 · 많은 사람이 속는 문제'}
                  </span>
                )}
                {m.minTier === 'gold' && (
                  <span className="chip w-fit border border-brand/25 bg-brand-soft text-brand">
                    🛡️ {lang === 'en' ? 'Gold+ Expert Verification' : 'Gold+ 전문가 정밀 검증 의뢰'}
                  </span>
                )}
                <h1 className="text-xl font-bold leading-snug text-slate-900">{m.prompt}</h1>
                {m.contextNote && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50/75 px-3 py-2 text-xs font-semibold text-amber-900">
                    💬 {lang === 'en' ? 'Requester note: ' : '의뢰자 메모: '}
                    {m.contextNote}
                  </p>
                )}
                {m.origin === 'requester' && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500">
                      {lang === 'en' ? 'Optional reason tag (tap before choosing):' : '판정 근거 태그 (선택 · 고른 뒤 아래 A/B 선택)'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(lang === 'en'
                        ? ['Suspicious link / scam', 'Robotic / ad tone', 'Visual distortion', 'Authentic detail']
                        : ['외부 링크·유도', '광고·기계적 문체', '이미지 왜곡', '실제 경험·디테일']
                      ).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          disabled={locked}
                          onClick={() => setPickedReason((prev) => (prev === tag ? undefined : tag))}
                          className={
                            pickedReason === tag
                              ? 'rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand'
                              : 'rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-brand/40'
                          }
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.a.src} alt={m.a.alt} draggable={false} className="aspect-[4/3] w-full select-none object-cover" />
                          <button
                            type="button"
                            onClick={() => m.a.type === 'image' && setZoomImage({ src: m.a.src, alt: m.a.alt })}
                            aria-label={lang === 'en' ? 'Zoom image' : '이미지 확대 보기'}
                            className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-slate-900/75 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition hover:bg-slate-900"
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                            <span>{lang === 'en' ? 'Zoom' : '확대'}</span>
                          </button>
                        </div>
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
                        onZoom={(src, alt) => setZoomImage({ src, alt })}
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

          {zoomImage && (
            <div
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              onClick={() => setZoomImage(null)}
            >
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                aria-label={lang === 'en' ? 'Close' : '닫기'}
                className="mb-3 self-end rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomImage.src}
                alt={zoomImage.alt}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[78vh] w-full max-w-md rounded-2xl object-contain shadow-2xl"
              />
              <p className="mt-3 text-xs font-medium text-slate-300">
                {lang === 'en' ? 'Tap outside to close · Look closely at hands, text, and edges' : '바깥 영역을 누르면 닫힙니다 · 손가락·글자·경계선을 자세히 보세요'}
              </p>
            </div>
          )}
        </>
      )}

      {(phase === 'bonus' || (phase === 'submitting' && bonusPicked !== null)) && missionSet?.bonus && (
        <BonusCard quiz={missionSet.bonus} lang={lang} picked={bonusPicked} onPick={(c) => void chooseBonus(c)} />
      )}

      {phase === 'submitting' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/75 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-base font-semibold text-slate-800">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            {t.submitting}
          </div>
        </div>
      )}
    </div>
  );
}

function BonusCard({
  quiz,
  lang,
  picked,
  onPick,
}: {
  quiz: PublicBonusQuiz;
  lang: 'ko' | 'en';
  picked: number | null;
  onPick: (choice: number) => void;
}) {
  const en = lang === 'en';
  return (
    <section className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-brand-soft p-5 shadow-[0_8px_30px_rgba(224,168,66,0.25)]">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="flex items-center gap-2">
          <span className="chip bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm">
            <Gift className="h-3.5 w-3.5" />
            BONUS
          </span>
          <span className="text-xs font-bold text-amber-800">{en ? 'Spot the AI Tell' : 'AI 흔적 짚기'}</span>
        </div>
        <p className="mt-2 text-xs text-amber-900/80">
          {en
            ? 'Get it right for extra Trust Score points! No penalty if wrong.'
            : '맞히면 신뢰도 보너스 점수 획득! 틀려도 감점은 없어요.'}
        </p>
        <h1 className="mt-3 text-lg font-bold leading-snug text-slate-900">{en ? quiz.prompt.en : quiz.prompt.ko}</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {quiz.kind === 'image' && quiz.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={quiz.image} alt="bonus" draggable={false} className="aspect-[4/3] w-full select-none object-cover" />
        ) : (
          <p className="whitespace-pre-line p-5 text-base leading-relaxed text-slate-800">{en ? quiz.text?.en : quiz.text?.ko}</p>
        )}
      </div>

      <div className="space-y-2.5">
        {(en ? quiz.options.en : quiz.options.ko).map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={picked !== null}
            onClick={() => onPick(i)}
            className={
              picked === i
                ? 'btn w-full justify-start border-2 border-amber-400 bg-amber-50 py-3.5 text-left text-[15px] text-amber-900'
                : 'btn w-full justify-start border-2 border-slate-200 bg-white py-3.5 text-left text-[15px] text-slate-800 shadow-sm hover:border-amber-300'
            }
          >
            <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
              {i + 1}
            </span>
            {opt}
          </button>
        ))}
        <button
          type="button"
          disabled={picked !== null}
          onClick={() => onPick(-1)}
          className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-600"
        >
          {en ? 'Skip bonus' : '보너스 건너뛰기'}
        </button>
      </div>
    </section>
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
