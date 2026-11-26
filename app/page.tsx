'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Coins,
  FilePlus2,
  Flame,
  Loader2,
  ScanFace,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import type { HomeOverviewResponse, VerifySession } from '@/types';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { useScanModal } from '@/components/ScanModal';
import { TierChip } from '@/components/TierBadge';
import { api } from '@/lib/apiClient';
import { getTrustTier } from '@/lib/constants';
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
  const [overview, setOverview] = useState<HomeOverviewResponse | null>(null);

  const t = HOME_TEXT[lang];
  const vt = VERIFY_TEXT[lang];
  const en = lang === 'en';

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
    if (!profile) {
      document.getElementById('login-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
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

  const scrollToLogin = () => {
    document.getElementById('login-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const showYesterdayHook = Boolean(profile && overview?.quest.dailyDoneToday && overview.yesterdayRecap);

  return (
    <div className="space-y-3.5">
      {modal}

      {/* 상단 히어로 + 행동 유발 문구 */}
      <header className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E2D9EE] bg-gradient-to-br from-white to-brand-soft shadow-[0_2px_10px_rgba(112,60,144,0.1)]">
            <ShieldCheck className="h-6 w-6 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-black leading-none tracking-tight text-slate-900">VeriLens</h1>
            <p className="mt-1 text-[13px] font-bold tracking-tight text-brand">
              {en
                ? 'Spot AI fakes & earn Pi in 1 minute!'
                : 'AI 가짜를 잡아내고 Pi 보상을 받으세요!'}
            </p>
          </div>
        </div>

        {/* 초슬림 내 상태 바 (클릭 시 마이페이지 이동) */}
        {ready && profile && (
          <Link
            href="/my"
            className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-brand/40"
          >
            <div className="flex min-w-0 items-center gap-2">
              <TierChip score={profile.trustScore} className="px-2 py-0.5 text-[11px]" />
              <span className="truncate text-xs font-extrabold text-slate-900">@{profile.username}</span>
              <span className="text-[11px] font-bold text-slate-500">{profile.trustScore}pt</span>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand">
              {en ? 'My Page' : '마이페이지'}
              <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        )}
      </header>

      {!ready ? (
        <div className="card flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      ) : (
        <>
          {/* 1. 시선 끄는 콘텐츠 1개 (핵심 메뉴/판별하기 바로 위) */}
          {showYesterdayHook && overview?.yesterdayRecap ? (
            <YesterdayRecapCard
              recap={overview.yesterdayRecap}
              lang={lang}
              onPlayDaily={() => (sessionActive ? router.push('/verify?mode=daily') : void startSession('/verify?mode=daily'))}
            />
          ) : (
            <TeaserQuizCard
              lang={lang}
              onStartFull={() =>
                profile
                  ? sessionActive
                    ? router.push('/verify')
                    : void startSession('/verify')
                  : scrollToLogin()
              }
            />
          )}

          {/* 2. 핵심 액션 허브 (금융 앱 런처 스타일) */}
          <section className="space-y-2.5">
            {/* 데일리 챌린지 메인 배너 */}
            <button
              type="button"
              onClick={() =>
                profile
                  ? sessionActive
                    ? router.push('/verify?mode=daily')
                    : void startSession('/verify?mode=daily')
                  : scrollToLogin()
              }
              disabled={starting}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-4 py-3.5 text-left shadow-sm transition hover:border-amber-400"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white shadow-sm">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[15px] font-black text-slate-900">
                    {en ? "Today's Daily Challenge (5 Qs)" : '오늘의 데일리 챌린지 (공통 5문제)'}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {en ? '1-min daily · Same questions worldwide!' : '하루 1분 컷 · 전 세계 유저 공통 문제!'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-amber-600" />
            </button>

            {/* 2x2 핵심 메뉴 그리드 */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  profile
                    ? sessionActive
                      ? router.push('/verify')
                      : void startSession('/verify')
                    : scrollToLogin()
                }
                disabled={starting}
                className="flex flex-col justify-between rounded-2xl border-2 border-brand/25 bg-brand p-3.5 text-left text-white shadow-sm transition hover:bg-brand/95"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                    {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                  </span>
                  {sessionActive && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold">
                      {formatMmSs(remaining)}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-[15px] font-black">{en ? 'Verify AI' : 'AI 판별하기'}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-white/80">
                    {sessionActive
                      ? en
                        ? 'Continue active set'
                        : '이어서 5문항 풀기'
                      : en
                        ? '5 Qs · Earn Pi'
                        : '5문항 풀고 Pi 적립'}
                  </p>
                </div>
              </button>

              <Link
                href="/submit"
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-brand/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-pi-light">
                    <FilePlus2 className="h-5 w-5" />
                  </span>
                  {profile && profile.freeSubmitTickets > 0 ? (
                    <span className="chip bg-brand text-[10px] font-bold text-white">
                      {en ? `${profile.freeSubmitTickets} Free` : `무료권 ${profile.freeSubmitTickets}`}
                    </span>
                  ) : overview?.live.freeQuizAvailable && overview?.live.freeQuizEligible ? (
                    <span className="chip bg-emerald-50 text-[10px] font-bold text-human-dark">
                      {en ? 'Free 1/d' : '오늘 무료'}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3">
                  <p className="text-[15px] font-black text-slate-900">{en ? 'Submit Check' : '진위 의뢰하기'}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {en ? 'Ask 10 real humans' : '10명의 인간에게 묻기'}
                  </p>
                </div>
              </Link>

              <Link
                href="/wallet"
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-brand/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-pi-light">
                    <Wallet className="h-5 w-5" />
                  </span>
                  {profile && (
                    <span className="flex items-center gap-0.5 text-[11px] font-extrabold text-pi-light">
                      <Coins className="h-3 w-3" />
                      {formatPi(profile.balance)}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-[15px] font-black text-slate-900">{en ? 'My Wallet' : '내 지갑'}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {en ? 'Rewards & Pi claim' : '보상 내역 · Pi 출금'}
                  </p>
                </div>
              </Link>

              <Link
                href="/my"
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-brand/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <UserCircle2 className="h-5 w-5" />
                  </span>
                  {profile && (
                    <span className="text-[11px] font-extrabold text-brand">
                      {getTrustTier(profile.trustScore).rewardMult}x
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-[15px] font-black text-slate-900">{en ? 'My · Ranking' : '마이 · 랭킹'}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {en ? 'Trust score, TOP 5 & guide' : '신뢰도·TOP 5·가이드'}
                  </p>
                </div>
              </Link>
            </div>
          </section>

          {!profile && (
            <div id="login-panel">
              <LoginPanel title={t.loginTitle} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TEASER_QUIZ = {
  ko: {
    badge: '5초 실사 맛보기',
    question: '둘 중 AI가 만들지 않은 실제 카페 사진은 어느 쪽일까요?',
    aImg: '/missions/v09-a.jpg',
    bImg: '/missions/v09-b.jpg',
    human: 'B' as const,
    explain: 'A는 메뉴판 글자("CΦFFΞE", "LATTƎ")가 깨져 있고 스푼 손잡이가 나무 결 속으로 녹아 있습니다. 실제 사진은 B입니다!',
  },
  en: {
    badge: '5-Sec Photo Challenge',
    question: 'Which cafe photo is REAL (not AI-generated)?',
    aImg: '/missions/v09-a.jpg',
    bImg: '/missions/v09-b.jpg',
    human: 'B' as const,
    explain: 'Image A has garbled menu text ("CΦFFΞE", "LATTƎ") and a warped spoon handle melting into the wood. B is real!',
  },
};

function TeaserQuizCard({ lang, onStartFull }: { lang: 'ko' | 'en'; onStartFull: () => void }) {
  const en = lang === 'en';
  const q = TEASER_QUIZ[lang];
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const correct = picked === q.human;

  return (
    <section className="card space-y-2.5 border-2 border-brand/25 bg-gradient-to-br from-white via-white to-brand-soft/45 p-4">
      <div className="flex items-center justify-between">
        <span className="chip bg-brand text-white">
          <Sparkles className="h-3.5 w-3.5" />
          {q.badge}
        </span>
        <span className="text-[11px] font-bold text-slate-400">{en ? 'Tap Photo A or B' : '사진 A 또는 B를 눌러보세요'}</span>
      </div>
      <p className="text-[15px] font-extrabold text-slate-900">{q.question}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {(['A', 'B'] as const).map((side) => {
          const src = side === 'A' ? q.aImg : q.bImg;
          const isPick = picked === side;
          const isHuman = side === q.human;
          return (
            <button
              key={side}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(side)}
              className={clsx(
                'relative overflow-hidden rounded-2xl border-2 bg-white text-left transition',
                picked === null
                  ? 'border-slate-200 hover:border-brand/60'
                  : isHuman
                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                    : isPick
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-100 opacity-60',
              )}
            >
              <span
                className={clsx(
                  'absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow',
                  picked !== null && isHuman
                    ? 'bg-emerald-600 text-white'
                    : isPick
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-900/80 text-white',
                )}
              >
                {side}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Sample ${side}`} draggable={false} className="aspect-[4/3] w-full select-none object-cover" />
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className={clsx('text-xs font-extrabold', correct ? 'text-human-dark' : 'text-rose-600')}>
            {correct
              ? en
                ? 'Spot on! Sharp human eye!'
                : '정답입니다! 날카로운 눈썰미예요!'
              : en
                ? 'Tricky AI! The real photo was B.'
                : '아쉽네요! 실제 사진은 B였어요.'}
          </p>
          <p className="text-xs leading-relaxed text-slate-600">{q.explain}</p>
          <button type="button" onClick={onStartFull} className="btn-primary w-full py-2.5 text-sm font-bold">
            <ScanFace className="h-4 w-4" />
            {en ? 'Play full 5-item set & earn Pi' : '본 게임 5문항 풀고 Pi 보상 받기'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

function YesterdayRecapCard({
  recap,
  lang,
  onPlayDaily,
}: {
  recap: NonNullable<HomeOverviewResponse['yesterdayRecap']>;
  lang: 'ko' | 'en';
  onPlayDaily: () => void;
}) {
  const en = lang === 'en';
  return (
    <section className="card space-y-2.5 border-rose-200 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="chip border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-700">
          {en ? `Yesterday's Top Trap · ${recap.fooledPercent}% fooled` : `어제 오답 1위 · ${recap.fooledPercent}%가 속은 문제`}
        </span>
        {recap.sourceLabel && <span className="text-[11px] font-semibold text-slate-400">{recap.sourceLabel}</span>}
      </div>
      <p className="text-sm font-extrabold text-slate-900">{recap.prompt}</p>
      {recap.previewText && (
        <p className="rounded-xl border border-slate-100 bg-white/90 px-3 py-2 text-xs leading-relaxed text-slate-700">
          “{recap.previewText}”
        </p>
      )}
      {recap.aiTell && (
        <p className="text-xs leading-relaxed text-slate-600">
          <b className="text-brand">{en ? 'AI Tell: ' : '감별 포인트: '}</b>
          {recap.aiTell}
        </p>
      )}
      <button type="button" onClick={onPlayDaily} className="btn-outline w-full py-2 text-xs font-bold">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        {en ? "Try Today's Daily Challenge" : '오늘의 데일리 챌린지로 감각 확인하기'}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
