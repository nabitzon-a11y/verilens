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
  RotateCw,
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

  const scrollToLogin = () => {
    document.getElementById('login-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const startSession = async (nextHref = '/verify') => {
    if (!profile) {
      scrollToLogin();
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

  return (
    <div className="space-y-4 pb-2">
      {modal}

      {/* 상단 히어로 배너 (첫인상) */}
      <header className="relative overflow-hidden rounded-3xl border border-brand/15 bg-gradient-to-br from-white via-brand-soft/45 to-amber-50/60 p-4 shadow-[0_8px_28px_rgba(112,60,144,0.08)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand/15 bg-white shadow-sm">
            <ShieldCheck className="h-7 w-7 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[22px] font-black leading-none tracking-tight text-slate-900">VeriLens</h1>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-extrabold text-brand">
                Pi Web3
              </span>
            </div>
            <p className="mt-1 text-[13px] font-bold leading-snug text-slate-700">
              {en ? 'Spot AI fakes & earn Pi in 1 minute!' : 'AI 가짜를 잡아내고 Pi 보상을 받으세요!'}
            </p>
          </div>
        </div>

        {ready && profile && (
          <Link
            href="/my"
            className="relative mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/90 px-3.5 py-2 shadow-sm backdrop-blur transition hover:border-brand/30"
          >
            <div className="flex min-w-0 items-center gap-2">
              <TierChip score={profile.trustScore} className="px-2 py-0.5 text-[10px]" />
              <span className="truncate text-xs font-extrabold text-slate-900">@{profile.username}</span>
              <span className="text-[11px] font-bold text-slate-500">{profile.trustScore}pt</span>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand">
              {en ? 'My Page' : '마이페이지'}
              <ChevronRight className="h-3.5 w-3.5" />
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
          {/* 1. 4개 핵심 메뉴 (최상단) */}
          <section className="grid grid-cols-2 gap-3">
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
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[#58228B] p-4 text-left text-white shadow-[0_8px_22px_rgba(112,60,144,0.28)] transition active:scale-[0.98]"
            >
              <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10 blur-xl" />
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                </span>
                {sessionActive ? (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold">
                    {formatMmSs(remaining)}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/70 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-3.5">
                <p className="text-[15px] font-black tracking-tight">{en ? 'Verify AI' : 'AI 판별하기'}</p>
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
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:border-brand/40 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-pi-light">
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
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-3.5">
                <p className="text-[15px] font-black tracking-tight text-slate-900">
                  {en ? 'Submit Check' : '진위 의뢰하기'}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  {en ? 'Ask 10 real humans' : '10명의 인간에게 묻기'}
                </p>
              </div>
            </Link>

            <Link
              href="/wallet"
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:border-brand/40 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-pi-light">
                  <Wallet className="h-5 w-5" />
                </span>
                {profile ? (
                  <span className="flex items-center gap-0.5 text-[11px] font-extrabold text-pi-light">
                    <Coins className="h-3 w-3" />
                    {formatPi(profile.balance)}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-3.5">
                <p className="text-[15px] font-black tracking-tight text-slate-900">{en ? 'My Wallet' : '내 지갑'}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  {en ? 'Rewards & Pi claim' : '보상 내역 · Pi 출금'}
                </p>
              </div>
            </Link>

            <Link
              href="/my"
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:border-brand/40 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <UserCircle2 className="h-5 w-5" />
                </span>
                {profile ? (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-extrabold text-brand">
                    {getTrustTier(profile.trustScore).rewardMult}x
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-3.5">
                <p className="text-[15px] font-black tracking-tight text-slate-900">
                  {en ? 'My · Ranking' : '마이 · 랭킹'}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  {en ? 'Trust score, TOP 5 & guide' : '신뢰도·TOP 5·가이드'}
                </p>
              </div>
            </Link>
          </section>

          {/* 2. 실사 맛보기 (항상 노출 · 로테이션 지원) */}
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

          {/* 3. 어제 오답 1위 */}
          {overview?.yesterdayRecap && (
            <YesterdayRecapCard
              recap={overview.yesterdayRecap}
              lang={lang}
              onPlayDaily={() =>
                profile
                  ? sessionActive
                    ? router.push('/verify?mode=daily')
                    : void startSession('/verify?mode=daily')
                  : scrollToLogin()
              }
            />
          )}

          {/* 4. 오늘의 데일리 챌린지 */}
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
            className="flex w-full items-center justify-between rounded-3xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-4 text-left shadow-[0_6px_20px_rgba(245,158,11,0.12)] transition hover:border-amber-400 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-black text-slate-900">
                  {en ? "Today's Daily Challenge (5 Qs)" : '오늘의 데일리 챌린지 (공통 5문제)'}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {en ? 'Same 5 questions worldwide · Play daily!' : '전 세계 유저 공통 5문제 · 매일 도전!'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-amber-600" />
          </button>

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

const PHOTO_TEASERS = [
  {
    aImg: '/missions/v09-a.jpg',
    bImg: '/missions/v09-b.jpg',
    human: 'B' as const,
    ko: {
      question: '둘 중 실제 카페 사진은 어느 쪽일까요?',
      explain: 'A는 메뉴판 글자("CΦFFΞE", "LATTƎ")가 깨져 있고 스푼 손잡이가 나무 결 속으로 녹아 있습니다. 실제 사진은 B입니다!',
    },
    en: {
      question: 'Which cafe photo is REAL (not AI)?',
      explain: 'Image A has garbled menu text ("CΦFFΞE", "LATTƎ") and a warped spoon handle melting into wood. B is real!',
    },
  },
  {
    aImg: '/missions/v11-a.jpg',
    bImg: '/missions/v11-b.jpg',
    human: 'A' as const,
    ko: {
      question: '둘 중 실제 카페 브런치 사진은 어느 쪽일까요?',
      explain: 'B는 포크 날이 5개로 뭉쳐 있고 오른쪽 아래 영수증 글자가 깨져 있습니다. 실제 사진은 A입니다!',
    },
    en: {
      question: 'Which cafe brunch photo is REAL?',
      explain: 'In B, the fork has 5 merged prongs and the receipt text is garbled. A is the real photo!',
    },
  },
  {
    aImg: '/missions/v14-a.jpg',
    bImg: '/missions/v14-b.jpg',
    human: 'A' as const,
    ko: {
      question: '둘 중 실제 사람 손 인증샷은 어느 쪽일까요?',
      explain: 'B는 손가락 마디가 부자연스럽게 벌어지고 엄지가 비정상적으로 길어 컵을 감싸는 형태가 어색합니다. 실제 사진은 A입니다!',
    },
    en: {
      question: 'Which iced coffee hand photo is REAL?',
      explain: 'In B, the finger joints splay unnaturally and the thumb is overly elongated around the cup. A is real!',
    },
  },
  {
    aImg: '/missions/v13-a.jpg',
    bImg: '/missions/v13-b.jpg',
    human: 'A' as const,
    ko: {
      question: '둘 중 실제 중고거래 노트북 사진은 어느 쪽일까요?',
      explain: 'B는 키보드 배열이 물결처럼 휘고 글자가 뭉개져 있으며 측면 USB 포트가 녹아 있습니다. 실제 사진은 A입니다!',
    },
    en: {
      question: 'Which secondhand laptop photo is REAL?',
      explain: 'In B, keyboard rows wave with garbled key labels and side ports look melted. A is real!',
    },
  },
] as const;

function TeaserQuizCard({ lang, onStartFull }: { lang: 'ko' | 'en'; onStartFull: () => void }) {
  const en = lang === 'en';
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const item = PHOTO_TEASERS[idx % PHOTO_TEASERS.length];
  const copy = item[lang];
  const correct = picked === item.human;

  const nextTeaser = () => {
    setPicked(null);
    setIdx((prev) => (prev + 1) % PHOTO_TEASERS.length);
  };

  return (
    <section className="card space-y-3 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <span className="chip bg-brand text-white">
          <Sparkles className="h-3.5 w-3.5" />
          {en ? 'Photo Challenge' : '실사 맛보기'}
        </span>
        <button
          type="button"
          onClick={nextTeaser}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <RotateCw className="h-3 w-3" />
          {en ? 'Next photo' : '다른 사진'}
        </button>
      </div>

      <p className="text-[15px] font-extrabold text-slate-900">{copy.question}</p>

      <div className="relative grid grid-cols-2 gap-2.5">
        {(['A', 'B'] as const).map((side) => {
          const src = side === 'A' ? item.aImg : item.bImg;
          const isPick = picked === side;
          const isHuman = side === item.human;
          return (
            <button
              key={`${idx}-${side}`}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(side)}
              className={clsx(
                'relative overflow-hidden rounded-2xl border-2 bg-slate-100 text-left transition',
                picked === null
                  ? 'border-slate-200 hover:border-brand/60 active:scale-[0.98]'
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

        <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-black text-white shadow">
          VS
        </span>
      </div>

      {picked !== null && (
        <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <p className={clsx('text-xs font-extrabold', correct ? 'text-human-dark' : 'text-rose-600')}>
            {correct
              ? en
                ? 'Spot on! Sharp human eye!'
                : '정답입니다! 날카로운 눈썰미예요!'
              : en
                ? `Tricky AI! The real photo was ${item.human}.`
                : `아쉽네요! 실제 사진은 ${item.human}였어요.`}
          </p>
          <p className="text-xs leading-relaxed text-slate-600">{copy.explain}</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={nextTeaser} className="btn-outline py-2.5 text-xs font-bold">
              <RotateCw className="h-3.5 w-3.5" />
              {en ? 'Try another' : '한 문제 더'}
            </button>
            <button type="button" onClick={onStartFull} className="btn-primary py-2.5 text-xs font-bold">
              <ScanFace className="h-3.5 w-3.5" />
              {en ? 'Full Game' : '본 게임 하기'}
            </button>
          </div>
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
    <section className="card space-y-2.5 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 p-4 shadow-[0_4px_16px_rgba(244,63,94,0.06)]">
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
