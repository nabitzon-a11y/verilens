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
import { HOME_HUB_TEXT, HOME_TEXT, VERIFY_TEXT } from '@/lib/i18n';
import { getActiveSession, startHumanSession } from '@/lib/piVerifyClient';

export default function HomePage() {
  const { ready, profile, verifyMode, lang, locale } = useApp();
  const router = useRouter();
  const now = useNow(1000);
  const { modal, run } = useScanModal(verifyMode === 'mock');
  const [session, setSession] = useState<VerifySession | null>(null);
  const [starting, setStarting] = useState(false);
  const [overview, setOverview] = useState<HomeOverviewResponse | null>(null);

  const t = HOME_TEXT[lang];
  const vt = VERIFY_TEXT[lang];
  const hub = HOME_HUB_TEXT[locale];
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

      {/* 상단 히어로 배너 (로고 중복 제거 + 행동 문구 & 상태 요약 집중) */}
      <header className="relative overflow-hidden rounded-3xl border border-brand/15 bg-gradient-to-br from-white via-brand-soft/45 to-amber-50/60 p-3.5 shadow-[0_6px_22px_rgba(112,60,144,0.08)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand/10 blur-2xl" />

        <div className="relative flex items-center justify-between gap-2">
          <p className="text-[15px] font-black leading-snug tracking-tight text-slate-900">
            {hub.heroCta}
          </p>
          <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-extrabold text-brand">
            Pi Web3
          </span>
        </div>

        {ready && profile && (
          <Link
            href="/my"
            className="relative mt-2.5 flex items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-sm transition hover:border-brand/30"
          >
            <div className="flex min-w-0 items-center gap-2">
              <TierChip score={profile.trustScore} className="px-2 py-0.5 text-[11px]" />
              <span className="truncate text-xs font-extrabold text-slate-900">@{profile.username}</span>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-brand">
              {hub.myPage} · {profile.trustScore}pt
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
          {/* 1. 4개 핵심 메뉴 (시원한 타이포그래피 & 콤팩트 비율) */}
          <section className="grid grid-cols-2 gap-2.5">
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
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[#58228B] p-3.5 text-left text-white shadow-[0_8px_22px_rgba(112,60,144,0.28)] transition active:scale-[0.98]"
            >
              <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10 blur-xl" />
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                </span>
                {sessionActive ? (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[11px] font-bold">
                    {formatMmSs(remaining)}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/75 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-2.5">
                <p className="text-[17px] font-black leading-tight tracking-tight">{hub.verifyTitle}</p>
                <p className="mt-1 text-[13px] font-semibold text-white/90">
                  {sessionActive ? hub.verifyResumeSub : hub.verifySub}
                </p>
              </div>
            </button>

            <Link
              href="/submit"
              className="group flex flex-col justify-between rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/55 via-white to-white p-3.5 text-left shadow-[0_6px_18px_rgba(224,168,66,0.12)] transition hover:border-amber-300 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-pi-light">
                  <FilePlus2 className="h-5 w-5" />
                </span>
                {profile && profile.freeSubmitTickets > 0 ? (
                  <span className="chip bg-brand text-[11px] font-bold text-white">
                    {en ? `${profile.freeSubmitTickets} Free` : `무료권 ${profile.freeSubmitTickets}`}
                  </span>
                ) : overview?.live.freeQuizAvailable && overview?.live.freeQuizEligible ? (
                  <span className="chip bg-emerald-50 text-[11px] font-bold text-human-dark">
                    {en ? 'Free 1/d' : '오늘 무료'}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-2.5">
                <p className="text-[17px] font-black leading-tight tracking-tight text-slate-900">
                  {hub.submitTitle}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-600">
                  {hub.submitSub}
                </p>
              </div>
            </Link>

            <Link
              href="/wallet"
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-3.5 text-left shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:border-brand/40 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-pi-light">
                  <Wallet className="h-5 w-5" />
                </span>
                {profile ? (
                  <span className="flex items-center gap-0.5 text-xs font-extrabold text-pi-light">
                    <Coins className="h-3.5 w-3.5" />
                    {formatPi(profile.balance)}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-2.5">
                <p className="text-[17px] font-black leading-tight tracking-tight text-slate-900">
                  {hub.walletTitle}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-600">
                  {hub.walletSub}
                </p>
              </div>
            </Link>

            <Link
              href="/my"
              className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-3.5 text-left shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:border-brand/40 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <UserCircle2 className="h-5 w-5" />
                </span>
                {profile ? (
                  <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-extrabold text-brand">
                    {getTrustTier(profile.trustScore).rewardMult}x
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5" />
                )}
              </div>
              <div className="mt-2.5">
                <p className="text-[17px] font-black leading-tight tracking-tight text-slate-900">
                  {hub.myTitle}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-600">
                  {hub.mySub}
                </p>
              </div>
            </Link>
          </section>

          {/* 2. 실사 맛보기 (항상 노출 · 로테이션 지원) */}
          <TeaserQuizCard
            lang={lang}
            hub={hub}
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
            <YesterdayRecapCard recap={overview.yesterdayRecap} hub={hub} />
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
            className="flex w-full items-center justify-between rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/85 via-white to-orange-50/50 p-4 text-left shadow-[0_6px_20px_rgba(224,168,66,0.12)] transition hover:border-amber-300 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-black text-slate-900">
                  {hub.dailyTitle}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {hub.dailySub}
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

function TeaserQuizCard({
  lang,
  hub,
  onStartFull,
}: {
  lang: 'ko' | 'en';
  hub: (typeof HOME_HUB_TEXT)['ko'];
  onStartFull: () => void;
}) {
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
    <section className="card space-y-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <span className="chip bg-brand text-white">
          <Sparkles className="h-3.5 w-3.5" />
          {hub.photoBadge}
        </span>
        <button
          type="button"
          onClick={nextTeaser}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <RotateCw className="h-3 w-3" />
          {hub.nextPhoto}
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
              {hub.tryAnother}
            </button>
            <button type="button" onClick={onStartFull} className="btn-primary py-2.5 text-xs font-bold">
              <ScanFace className="h-3.5 w-3.5" />
              {hub.fullGame}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function YesterdayRecapCard({
  recap,
  hub,
}: {
  recap: NonNullable<HomeOverviewResponse['yesterdayRecap']>;
  hub: (typeof HOME_HUB_TEXT)['ko'];
}) {
  return (
    <section className="card space-y-2.5 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <span className="chip shrink-0 whitespace-nowrap border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700">
          {hub.yesterdayTrap(recap.fooledPercent)}
        </span>
        {recap.sourceLabel && (
          <span className="truncate whitespace-nowrap text-xs font-semibold text-slate-500">{recap.sourceLabel}</span>
        )}
      </div>
      <p className="text-sm font-extrabold text-slate-900">{recap.prompt}</p>
      {recap.previewText && (
        <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
          <span className="inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
            {hub.aiSampleTag}
          </span>
          <p className="text-[13px] leading-relaxed text-slate-700">“{recap.previewText}”</p>
        </div>
      )}
      {recap.aiTell && (
        <p className="text-[13px] leading-relaxed text-slate-700">
          <b className="text-brand">{hub.aiTellLabel}</b>
          {recap.aiTell}
        </p>
      )}
    </section>
  );
}
