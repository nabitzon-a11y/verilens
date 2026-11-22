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
  platinum: 'bg-cyan-400/15 text-cyan-300',
  gold: 'bg-pi/15 text-pi-light',
  silver: 'bg-slate-300/15 text-slate-200',
  bronze: 'bg-orange-700/20 text-orange-300',
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
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-human/15">
          <ShieldCheck className="h-6 w-6 text-human" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">VeriLens</h1>
          <p className="text-xs text-slate-400">{t.tagline}</p>
        </div>
      </header>

      {!ready ? (
        <div className="card flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !profile ? (
        <>
          <section className="card">
            <p className="text-sm leading-relaxed text-slate-300">
              {t.introPrefix}
              <b className="text-human">{t.introHighlight}</b>
              {t.introMid}
              <b className="text-pi">{t.introReward}</b>
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
                <p className="text-lg font-bold text-white">@{profile.username}</p>
              </div>
              <span className={clsx('chip', TIER_STYLE[profile.tier])}>{profile.tierLabel}</span>
            </div>

            <TrustBar label={t.trustLabel} score={profile.trustScore} />

            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat icon={<Flame className="h-4 w-4 text-orange-400" />} label={t.streakLabel} value={`${profile.streak}${t.streakUnit}`} />
              <Stat icon={<Layers className="h-4 w-4 text-sky-400" />} label={t.setsLabel} value={`${profile.setsCompleted}`} />
              <Stat icon={<Coins className="h-4 w-4 text-pi" />} label={t.balanceLabel} value={formatPi(profile.balance)} accent />
            </div>
          </section>

          {/* 세션 */}
          <section className="card space-y-3">
            {sessionActive ? (
              <>
                <div className="flex items-center gap-2 text-sm text-human">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-human opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-human" />
                  </span>
                  {t.sessionActive}
                  <span className="ml-auto flex items-center gap-1 font-mono text-xs text-slate-300">
                    <Timer className="h-3.5 w-3.5" />
                    {formatMmSs(remaining)}
                  </span>
                </div>
                <Link href="/verify" className="btn-primary w-full">
                  <ScanFace className="h-4 w-4" />
                  {t.continueVerify}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">
                  {t.sessionDesc1}
                  <b className="text-white">{t.sessionDescHighlight}</b>
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
          <div className="grid grid-cols-2 gap-2">
            <Link href="/submit" className="btn-ghost">
              <FilePlus2 className="h-4 w-4 text-human" />
              {nav.submit}
            </Link>
            <Link href="/wallet" className="btn-ghost">
              <Wallet className="h-4 w-4 text-pi" />
              {nav.wallet}
            </Link>
          </div>
        </>
      )}

      {/* 작동 방식 */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="label">{t.howItWorks}</p>
          <button
            type="button"
            onClick={() => setHintsOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-pi/30 bg-pi/10 px-2.5 py-1 text-[11px] font-semibold text-pi-light hover:bg-pi/20"
          >
            <Lightbulb className="h-3 w-3" />
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

      <footer className="space-y-1.5 pb-2 text-center text-[10px] text-slate-500">
        <p>
          {t.tiersLabel}: {TRUST_TIERS.map((tier) => `${tier.label} ${tier.minScore}+`).join(' · ')}
        </p>
        <p className="flex items-center justify-center gap-3 text-slate-400">
          <Link href="/terms" className="hover:text-white hover:underline">
            {t.termsLink}
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-white hover:underline">
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
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-human">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-human-dark to-human-light transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-2 py-3">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className={clsx('text-sm font-bold', accent ? 'text-pi' : 'text-white')}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-human/10 text-human">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-white">
          <span className="mr-1 text-human">{n}.</span>
          {title}
        </p>
        <p className="text-xs leading-relaxed text-slate-400">{children}</p>
      </div>
    </div>
  );
}
