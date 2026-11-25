'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  Coins,
  Crown,
  FilePlus2,
  Flame,
  Gift,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Loader2,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import type { HomeOverviewResponse, LivePoolResponse, VerifySession } from '@/types';
import { translatePromptToEn, translatePromptToKo } from '@/data/missions.en';
import { AiHintsModal } from '@/components/AiHintsModal';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { useScanModal } from '@/components/ScanModal';
import { TierChip, TrustProgress } from '@/components/TierBadge';
import { api } from '@/lib/apiClient';
import { GAME, TRUST_TIERS, getTrustTier } from '@/lib/constants';
import { formatMmSs, formatPi } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { HOME_TEXT, VERIFY_TEXT } from '@/lib/i18n';
import { getActiveSession, startHumanSession } from '@/lib/piVerifyClient';


export default function HomePage() {
  const { ready, profile, verifyMode, lang } = useApp();
  const router = useRouter();
  const now = useNow(1000);
  const { modal, run } = useScanModal(verifyMode === 'mock');
  const [session, setSession] = useState<VerifySession | null>(null);
  const [starting, setStarting] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [overview, setOverview] = useState<HomeOverviewResponse | null>(null);

  const t = HOME_TEXT[lang];
  const vt = VERIFY_TEXT[lang];

  useEffect(() => {
    setSession(profile ? getActiveSession(profile.uid) : null);
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      setOverview(null);
      return;
    }
    let alive = true;
    api<HomeOverviewResponse>(`/api/home/overview?lang=${lang}`)
      .then((d) => alive && setOverview(d))
      .catch(() => alive && setOverview(null));
    return () => {
      alive = false;
    };
  }, [profile, lang]);

  const remaining = session ? Math.max(0, session.expiresAt - now) : 0;
  const sessionActive = remaining > 0;

  const startSession = async (nextHref = '/verify') => {
    setStarting(true);
    try {
      const s = await run(() => startHumanSession(), {
        title: vt.scanTitle,
        subtitle: vt.scanSubtitle,
      });
      setSession(s);
      router.push(nextHref);
    } catch {
      /* 모달에서 오류 표시 */
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4">
      {modal}
      <AiHintsModal open={hintsOpen} onClose={() => setHintsOpen(false)} lang={lang} />

      {/* Hero */}
      <header className="flex items-center gap-2.5 pt-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E2D9EE] bg-gradient-to-br from-white to-brand-soft shadow-[0_2px_10px_rgba(112,60,144,0.1)]">
          <ShieldCheck className="h-7 w-7 text-brand" />
        </div>
        <div>
          <h1 className="text-[28px] font-black leading-none tracking-tight text-slate-900">VeriLens</h1>
          <p className="mt-1 text-[13px] font-semibold tracking-tight text-pi-light">{t.tagline}</p>
        </div>
      </header>

      {!ready ? (
        <div className="card flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      ) : !profile ? (
        <>
          <section className="card">
            <p className="text-[15px] leading-relaxed text-slate-700">
              {t.introPrefix}
              <b className="text-human-dark">{t.introHighlight}</b>
              {t.introMid}
              <b className="text-pi-light">{t.introReward}</b>
              {t.introSuffix}
            </p>
          </section>
          <TeaserQuizCard lang={lang} onStartFull={() => void startSession()} />
          <LoginPanel title={t.loginTitle} />
        </>
      ) : (
        <>
          {/* 프로필 */}
          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="label">Pioneer</p>
                <p className="text-xl font-extrabold text-slate-900">@{profile.username}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <TierChip score={profile.trustScore} />
                <span className="text-[11px] font-bold text-pi-light">
                  {lang === 'en'
                    ? `Reward ${getTrustTier(profile.trustScore).rewardMult}x (Max 2x)`
                    : `보상 ${getTrustTier(profile.trustScore).rewardMult}x (최대 2배)`}
                </span>
              </div>
            </div>

            <TrustProgress label={t.trustLabel} score={profile.trustScore} lang={lang} />

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <Stat icon={<Flame className="h-4 w-4 text-orange-500" />} label={t.streakLabel} value={`${profile.streak}${t.streakUnit}`} />
              <Stat icon={<Layers className="h-4 w-4 text-brand" />} label={t.setsLabel} value={`${profile.setsCompleted}`} />
              <Stat icon={<Coins className="h-4 w-4 text-pi-light" />} label={t.balanceLabel} value={formatPi(profile.balance)} accent />
            </div>

            {overview && <DailyQuestBar quest={overview.quest} lang={lang} />}
          </section>

          {/* 오늘 아직 1세트도 안 풀었으면 5초 맛보기 퀴즈로 즉시 몰입 유도 */}
          {overview && !overview.quest.dailyDoneToday && (
            <TeaserQuizCard
              lang={lang}
              onStartFull={() => (sessionActive ? router.push('/verify') : void startSession())}
            />
          )}

          {/* 세션 */}
          <section className="card space-y-3.5">
            {sessionActive ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-human-dark">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-human opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-human" />
                  </span>
                  {t.sessionActive}
                  <span className="ml-auto flex items-center gap-1 font-mono text-xs text-slate-600">
                    <Timer className="h-3.5 w-3.5" />
                    {formatMmSs(remaining)}
                  </span>
                </div>
                <Link href="/verify" className="btn-primary w-full py-4 text-[17px] font-bold">
                  <ScanFace className="h-5 w-5" />
                  {t.continueVerify}
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-slate-600">
                  {t.sessionDesc1}
                  <b className="text-slate-900">{t.sessionDescHighlight}</b>
                  {t.sessionDesc2}
                </p>
                <button
                  type="button"
                  className="btn-primary w-full py-4 text-[17px] font-bold"
                  onClick={() => void startSession()}
                  disabled={starting}
                >
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                  {t.startSession}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => (sessionActive ? router.push('/verify?mode=daily') : void startSession('/verify?mode=daily'))}
              disabled={starting}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-4 py-3 text-left transition hover:border-amber-400"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {lang === 'en' ? "Today's Daily Challenge (5 Qs)" : '오늘의 데일리 챌린지 (공통 5문제)'}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {lang === 'en' ? '1-min daily · Same questions worldwide!' : '하루 1분 컷 · 전 세계 유저 공통 문제!'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-amber-600" />
            </button>
          </section>

          {/* 의뢰하기 강조: 하루 1회 무료 출제 + 실시간 의뢰 현황 (중복 빠른이동 버튼은 UX 다이어트로 제거) */}
          <SubmitSpotlight lang={lang} live={overview?.live ?? null} />

          {/* 실시간 명예의 전당 Top 5 리더보드 */}
          {overview && overview.leaderboard.top.length > 0 && (
            <LeaderboardCard board={overview.leaderboard} lang={lang} />
          )}
        </>
      )}

      {/* 작동 방식 */}
      <section className="card space-y-3.5">
        <div className="flex items-center justify-between">
          <p className="label">{t.howItWorks}</p>
          <button
            type="button"
            onClick={() => setHintsOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            <Lightbulb className="h-3.5 w-3.5 text-pi-light" />
            {lang === 'en' ? 'AI Hints' : 'AI 감별 힌트'}
          </button>
        </div>
        <Step n={1} icon={<ScanFace className="h-4 w-4" />} title={t.step1Title}>
          {t.step1Body}
        </Step>
        <Step n={2} icon={<Layers className="h-4 w-4" />} title={t.step2Title}>
          {t.step2Body(GAME.QUESTIONS_PER_SET)}
        </Step>
        <Step n={3} icon={<Users className="h-4 w-4" />} title={t.step3Title}>
          {t.step3Body(GAME.REWARD_PER_MATCH_PI)}
        </Step>
      </section>

      <footer className="space-y-1.5 pb-2 text-center text-xs text-slate-400">
        <p>
          {t.tiersLabel}: {TRUST_TIERS.map((tier) => `${tier.label} ${tier.minScore}+`).join(' · ')}
        </p>
        <p className="flex items-center justify-center gap-3 text-slate-500">
          <Link href="/terms" className="hover:text-brand hover:underline">
            {t.termsLink}
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-brand hover:underline">
            {t.privacyLink}
          </Link>
        </p>
      </footer>
    </div>
  );
}

function DailyQuestBar({ quest, lang }: { quest: HomeOverviewResponse['quest']; lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs',
        quest.dailyDoneToday
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-brand/20 bg-brand-soft/70 text-slate-800',
      )}
    >
      {quest.dailyDoneToday ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-human-dark" />
      ) : (
        <Target className="h-4 w-4 shrink-0 text-brand" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          {quest.dailyDoneToday
            ? en
              ? `Today's Quest Complete! (+${quest.dailyBonusPts} pts earned)`
              : `오늘의 미션 완료! (+${quest.dailyBonusPts}점 획득)`
            : en
              ? `Today's Quest: Finish 1 set (+${quest.dailyBonusPts} Trust pts)`
              : `오늘의 미션: 1세트 완료 시 신뢰도 +${quest.dailyBonusPts}점`}
        </p>
        {quest.nextMilestone && (
          <p className="mt-0.5 text-[11px] opacity-80">
            {en
              ? `${quest.nextMilestone}-day streak bonus (+${quest.milestoneBonusPts} pts) · ${quest.streak}/${quest.nextMilestone}d`
              : `${quest.nextMilestone}일 연속 달성 시 +${quest.milestoneBonusPts}점 보너스 (${quest.streak}/${quest.nextMilestone}일)`}
          </p>
        )}
      </div>
    </div>
  );
}

const TEASER_QUIZ = {
  ko: {
    badge: '5초 맛보기 퀴즈',
    question: '어느 쪽이 실제 중고거래 판매자가 쓴 글일까요?',
    a: '[급처] 아이패드 프로 미개봉 35만원! 해외 출장 중이라 직거래 불가하고 안전결제 링크로만 거래합니다.',
    b: '아이패드 프로 쓰던 거 팔아요. 액정 오른쪽 아래 생활기스 하나 있고 배터리 89%예요. 강남역 직거래만.',
    human: 'B' as const,
    explain: '시세보다 터무니없이 싸고 "해외 출장·외부 링크"를 유도하는 A는 전형적인 AI/사기 템플릿입니다!',
  },
  en: {
    badge: '5-Sec Quick Try',
    question: 'Which marketplace listing was written by a real human seller?',
    a: '[URGENT] Sealed iPad Pro $250! Overseas on business so no meetups—pay only via my secure link today!',
    b: 'Selling my used iPad Pro. Light scratch on bottom-right screen, 89% battery health. Meetup only at Central Station.',
    human: 'B' as const,
    explain: 'Unreal price + "overseas, external link only" (A) is a classic AI/scam template. Real sellers disclose flaws!',
  },
};

function TeaserQuizCard({ lang, onStartFull }: { lang: 'ko' | 'en'; onStartFull: () => void }) {
  const en = lang === 'en';
  const q = TEASER_QUIZ[lang];
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const correct = picked === q.human;

  return (
    <section className="card space-y-3 border-2 border-brand/25 bg-gradient-to-br from-white via-white to-brand-soft/45">
      <div className="flex items-center justify-between">
        <span className="chip bg-brand text-white">
          <Sparkles className="h-3.5 w-3.5" />
          {q.badge}
        </span>
        <span className="text-[11px] font-bold text-slate-400">{en ? 'Tap A or B' : 'A 또는 B를 눌러보세요'}</span>
      </div>
      <p className="text-[15px] font-extrabold text-slate-900">{q.question}</p>
      <div className="grid gap-2">
        {(['A', 'B'] as const).map((side) => {
          const body = side === 'A' ? q.a : q.b;
          const isPick = picked === side;
          const isHuman = side === q.human;
          return (
            <button
              key={side}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(side)}
              className={clsx(
                'flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left text-[13px] leading-relaxed transition',
                picked === null
                  ? 'border-slate-200 bg-white hover:border-brand/50'
                  : isHuman
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                    : isPick
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : 'border-slate-100 bg-slate-50 text-slate-400',
              )}
            >
              <span
                className={clsx(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black',
                  picked !== null && isHuman
                    ? 'bg-emerald-600 text-white'
                    : isPick
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-900 text-white',
                )}
              >
                {side}
              </span>
              <span>{body}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <p className={clsx('text-xs font-extrabold', correct ? 'text-human-dark' : 'text-rose-600')}>
            {correct
              ? en
                ? 'Spot on! Sharp human intuition!'
                : '정답입니다! 날카로운 인간 직관이에요!'
              : en
                ? 'Ooh, caught by the trap! Answer was B.'
                : '아쉽네요! 진짜 판매자는 B였어요.'}
          </p>
          <p className="text-xs leading-relaxed text-slate-600">{q.explain}</p>
          <button type="button" onClick={onStartFull} className="btn-primary w-full py-3 text-sm font-bold">
            <ScanFace className="h-4 w-4" />
            {en ? 'Play full 5-item set & earn Pi' : '본 게임 5문항 풀고 Pi 보상 받기'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

function LeaderboardCard({ board, lang }: { board: HomeOverviewResponse['leaderboard']; lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
          <Trophy className="h-4 w-4 text-amber-500" />
          {en ? 'Top 5 Human Intuition' : '명예의 전당 · 인간 직관 TOP 5'}
        </p>
        <span className="chip bg-slate-100 text-[11px] text-slate-600">
          {en ? `My Rank #${board.myRank}/${board.totalUsers}` : `내 순위 #${board.myRank}/${board.totalUsers}`}
        </span>
      </div>
      <div className="space-y-1.5">
        {board.top.map((row) => (
          <div
            key={`${row.rank}-${row.username}`}
            className={clsx(
              'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs',
              row.isMe ? 'border-brand/40 bg-brand-soft/70 font-bold' : 'border-slate-100 bg-slate-50',
            )}
          >
            <span
              className={clsx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black',
                row.rank === 1
                  ? 'bg-amber-400 text-white'
                  : row.rank === 2
                    ? 'bg-slate-400 text-white'
                    : row.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-200 text-slate-600',
              )}
            >
              {row.rank === 1 ? <Crown className="h-3.5 w-3.5" /> : row.rank}
            </span>
            <span className="min-w-0 flex-1 truncate text-slate-800">
              @{row.username}
              {row.isMe && <span className="ml-1 text-[10px] text-brand">{en ? '(You)' : '(나)'}</span>}
            </span>
            <TierChip score={row.trustScore} className="px-2 py-0.5 text-[10px]" />
            <span className="w-12 text-right font-mono font-extrabold text-slate-900">{row.trustScore}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubmitSpotlight({ lang, live }: { lang: 'ko' | 'en'; live: LivePoolResponse | null }) {
  const en = lang === 'en';

  const free = live ? live.freeQuizAvailable : true;
  const eligible = live ? live.freeQuizEligible : true;
  const href = free && eligible ? '/submit?tier=free' : '/submit';

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-brand-soft p-4 shadow-[0_6px_24px_rgba(224,168,66,0.18)]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-300/25 blur-2xl" />
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow">
          <HelpCircle className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold leading-snug text-slate-900">
            {en ? 'Not sure if it’s AI? Ask 10 real humans.' : '이 글·사진, AI인지 헷갈리나요?'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            {en
              ? 'Suspicious reviews, chat replies, listings or photos — verified Pioneers judge it for you.'
              : '수상한 후기·카톡 답장·중고 매물·사진을 올리면 인증된 10명이 판별해 드려요.'}
          </p>
        </div>
      </div>

      <Link href={href} className="btn-primary mt-3.5 w-full py-3.5 text-[15px] font-bold">
        <Gift className="h-5 w-5" />
        {free && eligible
          ? en
            ? 'Ask 10 humans — 1 FREE today'
            : '오늘 1회 무료로 10명에게 물어보기'
          : !eligible
            ? en
              ? 'Finish 1 set to unlock a free quiz'
              : '판별 1세트 완료 시 무료 출제 오픈'
            : en
              ? 'Submit for verification (1 Test-Pi)'
              : '검증 의뢰하기 (1 Test-Pi)'}
        <ChevronRight className="h-5 w-5" />
      </Link>

      {live && live.items.length > 0 && (
        <div className="mt-3.5 space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            {en ? `Live now · ${live.activeCount} in verification` : `실시간 검증 중 · ${live.activeCount}건`}
          </p>
          {live.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2.5">
              <div className="flex items-center gap-2">
                {item.kind === 'image' ? (
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
                ) : (
                  <FilePlus2 className="h-3.5 w-3.5 shrink-0 text-brand" />
                )}
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">
                  {en ? translatePromptToEn(item.prompt) : translatePromptToKo(item.prompt)}
                </p>
                <span className="shrink-0 text-[11px] font-bold text-brand">
                  {item.votes}/{item.target}
                  {en ? ' votes' : '표'}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-amber-400"
                  style={{ width: `${(item.votes / item.target) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-3.5">
      <div className="mb-1.5 flex justify-center">{icon}</div>
      <p className={clsx('text-lg font-extrabold leading-tight', accent ? 'text-pi-light' : 'text-slate-900')}>{value}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-900">
          <span className="mr-1 text-brand">{n}.</span>
          {title}
        </p>
        <p className="text-[13px] leading-relaxed text-slate-600">{children}</p>
      </div>
    </div>
  );
}
