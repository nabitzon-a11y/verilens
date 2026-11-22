'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Coins, FilePlus2, Flame, Layers, Lightbulb, Loader2, ScanFace, ShieldCheck, Timer, Users, Wallet } from 'lucide-react';
import clsx from 'clsx';
import type { VerifySession } from '@/types';
import { AiHintsModal } from '@/components/AiHintsModal';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { useScanModal } from '@/components/ScanModal';
import { GAME, TRUST_TIERS } from '@/lib/constants';
import { formatMmSs, formatPi } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { HOME_TEXT, NAV_LABELS, VERIFY_TEXT } from '@/lib/i18n';
import { getActiveSession, startHumanSession } from '@/lib/piVerifyClient';

const TIER_STYLE: Record<string, string> = {
  platinum: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  gold: 'bg-amber-50 text-amber-700 border border-amber-200',
  silver: 'bg-slate-100 text-slate-700 border border-slate-200',
  bronze: 'bg-orange-50 text-orange-700 border border-orange-200',
};

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
      <header className="flex items-center gap-3 pt-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
          <ShieldCheck className="h-7 w-7 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">VeriLens</h1>
          <p className="text-[13px] font-medium text-slate-500">{t.tagline}</p>
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
              <span className={clsx('chip', TIER_STYLE[profile.tier])}>{profile.tierLabel}</span>
            </div>

            <TrustBar label={t.trustLabel} score={profile.trustScore} />

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
                <Link href="/verify" className="btn-primary w-full">
                  <ScanFace className="h-5 w-5" />
                  {t.continueVerify}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-slate-600">
                  {t.sessionDesc1}
                  <b className="text-slate-900">{t.sessionDescHighlight}</b>
                  {t.sessionDesc2}
                </p>
                <button type="button" className="btn-primary w-full py-4 text-base" onClick={startSession} disabled={starting}>
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                  {t.startSession}
                </button>
              </>
            )}
          </section>

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

function TrustBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="font-bold text-human-dark">{score}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-human-dark to-human transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-3">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className={clsx('text-[15px] font-bold', accent ? 'text-pi-light' : 'text-slate-900')}>{value}</p>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
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
