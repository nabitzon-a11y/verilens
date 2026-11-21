'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Coins, FilePlus2, Flame, Layers, Loader2, ScanFace, ShieldCheck, Timer, Users, Wallet } from 'lucide-react';
import clsx from 'clsx';
import type { VerifySession } from '@/types';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { useScanModal } from '@/components/ScanModal';
import { GAME, TRUST_TIERS, VERIFY } from '@/lib/constants';
import { formatMmSs, formatPi } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { getActiveSession, startHumanSession } from '@/lib/piVerifyClient';

const TIER_STYLE: Record<string, string> = {
  platinum: 'bg-cyan-400/15 text-cyan-300',
  gold: 'bg-pi/15 text-pi-light',
  silver: 'bg-slate-300/15 text-slate-200',
  bronze: 'bg-orange-700/20 text-orange-300',
};

export default function HomePage() {
  const { ready, profile, verifyMode } = useApp();
  const router = useRouter();
  const now = useNow(1000);
  const { modal, run } = useScanModal(verifyMode === 'mock');
  const [session, setSession] = useState<VerifySession | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setSession(profile ? getActiveSession(profile.uid) : null);
  }, [profile]);

  const remaining = session ? Math.max(0, session.expiresAt - now) : 0;
  const sessionActive = remaining > 0;

  const startSession = async () => {
    setStarting(true);
    try {
      const s = await run(() => startHumanSession(), {
        title: 'PiVerify 인간 검증',
        subtitle: '얼굴 생존성·고유성을 확인하는 중…',
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

      {/* Hero */}
      <header className="flex items-center gap-3 pt-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-human/15">
          <ShieldCheck className="h-6 w-6 text-human" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">VeriLens</h1>
          <p className="text-xs text-slate-400">Human Intuition vs. Synthetic Illusion</p>
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
              AI가 만든 가짜가 넘쳐나는 시대, <b className="text-human">KYC 인증된 진짜 인간</b>의 직관으로 AI 합성물과 딥페이크를 가려내고{' '}
              <b className="text-pi">Pi 보상</b>을 받으세요.
            </p>
          </section>
          <LoginPanel title="인간 판별단에 합류하기" />
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

            <TrustBar score={profile.trustScore} />

            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat icon={<Flame className="h-4 w-4 text-orange-400" />} label="연속 참여" value={`${profile.streak}일`} />
              <Stat icon={<Layers className="h-4 w-4 text-sky-400" />} label="완료 세트" value={`${profile.setsCompleted}`} />
              <Stat icon={<Coins className="h-4 w-4 text-pi" />} label="잔액" value={formatPi(profile.balance)} accent />
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
                  Human Verified 세션 활성
                  <span className="ml-auto flex items-center gap-1 font-mono text-xs text-slate-300">
                    <Timer className="h-3.5 w-3.5" />
                    {formatMmSs(remaining)}
                  </span>
                </div>
                <Link href="/verify" className="btn-primary w-full">
                  <ScanFace className="h-4 w-4" />
                  판별 계속하기
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">
                  판별을 시작하려면 <b className="text-white">1회 인간 검증</b>이 필요합니다. 검증 후{' '}
                  {VERIFY.SESSION_TTL_MS / 60000}분 동안 자유롭게 판별할 수 있어요.
                </p>
                <button type="button" className="btn-primary w-full py-4 text-base" onClick={startSession} disabled={starting}>
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />}
                  인간 판별 세션 시작 (1시간 유효)
                </button>
              </>
            )}
          </section>

          {/* 빠른 이동 (일부 모바일 WebView 하단 시스템 바 가림 대비) */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/submit" className="btn-ghost">
              <FilePlus2 className="h-4 w-4 text-human" />
              의뢰하기
            </Link>
            <Link href="/wallet" className="btn-ghost">
              <Wallet className="h-4 w-4 text-pi" />
              내 지갑
            </Link>
          </div>
        </>
      )}

      {/* 작동 방식 */}
      <section className="card space-y-3">
        <p className="label">How it works</p>
        <Step n={1} icon={<ScanFace className="h-4 w-4" />} title="PiVerify 인간 증명">
          세션 시작 시 1회 생체·고유성 검증으로 봇을 원천 차단합니다.
        </Step>
        <Step n={2} icon={<Layers className="h-4 w-4" />} title={`${GAME.QUESTIONS_PER_SET}문항 A/B 판별`}>
          문항마다 5초 안에 진짜 원본을 고르세요. 정답이 정해진 숨김 기준 문항이 섞여 있습니다.
        </Step>
        <Step n={3} icon={<Users className="h-4 w-4" />} title="5인 다수결 합의 → Pi 보상">
          다른 인증된 판별자들과 다수결이 일치하면 문항당 {GAME.REWARD_PER_MATCH_PI} π 를 받습니다.
        </Step>
      </section>

      <p className="pb-2 text-center text-[10px] text-slate-600">
        신뢰도 등급: {TRUST_TIERS.map((t) => `${t.label} ${t.minScore}+`).join(' · ')}
      </p>
    </div>
  );
}

function TrustBar({ score }: { score: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">신뢰도 (Trust Score)</span>
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
