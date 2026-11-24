'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Coins,
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
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import type { LivePoolResponse, VerifySession } from '@/types';
import { translatePromptToEn, translatePromptToKo } from '@/data/missions.en';
import { AiHintsModal } from '@/components/AiHintsModal';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { useScanModal } from '@/components/ScanModal';
import { TierChip, TrustProgress } from '@/components/TierBadge';
import { api } from '@/lib/apiClient';
import { GAME, TRUST_TIERS } from '@/lib/constants';
import { formatMmSs, formatPi } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { HOME_TEXT, NAV_LABELS, VERIFY_TEXT } from '@/lib/i18n';
import { getActiveSession, startHumanSession } from '@/lib/piVerifyClient';


export default function HomePage() {
  const { ready, profile, verifyMode, lang } = useApp();
  const router = useRouter();
  const now = useNow(1000);
  const { modal, run } = useScanModal(verifyMode === 'mock');
  const [session, setSession] = useState<VerifySession | null>(null);
  const [starting, setStarting] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);

  const t = HOME_TEXT[lang];
  const nav = NAV_LABELS[lang];
  const vt = VERIFY_TEXT[lang];

  useEffect(() => {
    setSession(profile ? getActiveSession(profile.uid) : null);
  }, [profile]);

  const remaining = session ? Math.max(0, session.expiresAt - now) : 0;
  const sessionActive = remaining > 0;

  const startSession = async () => {
    setStarting(true);
    try {
      const s = await run(() => startHumanSession(), {
        title: vt.scanTitle,
        subtitle: vt.scanSubtitle,
      });
      setSession(s);
      router.push('/verify');
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
              <TierChip score={profile.trustScore} />
            </div>

            <TrustProgress label={t.trustLabel} score={profile.trustScore} lang={lang} />

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <Stat icon={<Flame className="h-4 w-4 text-orange-500" />} label={t.streakLabel} value={`${profile.streak}${t.streakUnit}`} />
              <Stat icon={<Layers className="h-4 w-4 text-brand" />} label={t.setsLabel} value={`${profile.setsCompleted}`} />
              <Stat icon={<Coins className="h-4 w-4 text-pi-light" />} label={t.balanceLabel} value={formatPi(profile.balance)} accent />
            </div>
          </section>

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
                <button type="button" className="btn-primary w-full py-4 text-[17px] font-bold" onClick={startSession} disabled={starting}>
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                  {t.startSession}
                </button>
              </>
            )}
          </section>

          {/* 의뢰하기 강조: 하루 1회 무료 출제 + 실시간 의뢰 현황 */}
          <SubmitSpotlight lang={lang} />

          {/* 빠른 이동 */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/submit" className="btn-ghost">
              <FilePlus2 className="h-4 w-4 text-brand" />
              {nav.submit}
            </Link>
            <Link href="/wallet" className="btn-ghost">
              <Wallet className="h-4 w-4 text-pi-light" />
              {nav.wallet}
            </Link>
          </div>
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

function SubmitSpotlight({ lang }: { lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  const [live, setLive] = useState<LivePoolResponse | null>(null);

  useEffect(() => {
    let alive = true;
    api<LivePoolResponse>(`/api/missions/live?lang=${lang}`)
      .then((d) => alive && setLive(d))
      .catch(() => alive && setLive(null));
    return () => {
      alive = false;
    };
  }, [lang]);

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
