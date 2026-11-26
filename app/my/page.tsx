'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  Coins,
  Crown,
  Flame,
  Gift,
  Layers,
  Lightbulb,
  Loader2,
  ScanFace,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import type { HomeOverviewResponse } from '@/types';
import { AiHintsModal } from '@/components/AiHintsModal';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { TierChip, TrustProgress } from '@/components/TierBadge';
import { api } from '@/lib/apiClient';
import { GAME, TRUST_TIERS, getTrustTier } from '@/lib/constants';
import { formatPi } from '@/lib/format';
import { HOME_TEXT } from '@/lib/i18n';

export default function MyPage() {
  const { ready, profile, lang } = useApp();
  const [hintsOpen, setHintsOpen] = useState(false);
  const [overview, setOverview] = useState<HomeOverviewResponse | null>(null);
  const t = HOME_TEXT[lang];
  const en = lang === 'en';

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

  return (
    <div className="space-y-4">
      <AiHintsModal open={hintsOpen} onClose={() => setHintsOpen(false)} lang={lang} />

      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label={en ? 'Back to Home' : '홈으로'}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">{en ? 'My Page & Ranking' : '마이페이지 · 랭킹'}</h1>
            <p className="text-xs font-medium text-slate-500">
              {en ? 'Trust score, streak, leaderboard & guide' : '내 신뢰도, 연속 출석, 명예의 전당 및 이용 가이드'}
            </p>
          </div>
        </div>
      </header>

      {!ready ? (
        <div className="card flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      ) : !profile ? (
        <LoginPanel title={t.loginTitle} />
      ) : (
        <>
          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="label">Pioneer</p>
                <p className="text-xl font-extrabold text-slate-900">@{profile.username}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <TierChip score={profile.trustScore} />
                <span className="text-[11px] font-bold text-pi-light">
                  {en
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

            {profile.freeSubmitTickets > 0 && (
              <Link
                href="/submit"
                className="flex items-center justify-between rounded-xl border border-brand/25 bg-brand-soft px-3 py-2.5 text-xs font-bold text-brand"
              >
                <span className="flex items-center gap-1.5">
                  <Gift className="h-4 w-4" />
                  {en
                    ? `Free Submission Tickets: ${profile.freeSubmitTickets}`
                    : `보유 무료 의뢰 체험권: ${profile.freeSubmitTickets}장`}
                </span>
                <span>{en ? 'Use now >' : '사용하기 >'}</span>
              </Link>
            )}

            {overview && <DailyQuestBar quest={overview.quest} lang={lang} />}
          </section>

          {overview && overview.leaderboard.top.length > 0 && (
            <LeaderboardCard board={overview.leaderboard} lang={lang} />
          )}
        </>
      )}

      {/* 작동 방식 (이용 가이드) */}
      <section className="card space-y-3.5">
        <div className="flex items-center justify-between">
          <p className="label">{t.howItWorks}</p>
          <button
            type="button"
            onClick={() => setHintsOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            <Lightbulb className="h-3.5 w-3.5 text-pi-light" />
            {en ? 'AI Hints' : 'AI 감별 힌트'}
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
        'flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-xs',
        quest.dailyDoneToday ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-brand/25 bg-brand-soft/60 text-slate-800',
      )}
    >
      {quest.dailyDoneToday ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-human-dark" />
      ) : (
        <Target className="h-5 w-5 shrink-0 text-brand" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          {quest.dailyDoneToday
            ? en
              ? `Daily Quest Complete! (+${quest.dailyBonusPts} pts)`
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
              {row.streak > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
                  🔥{row.streak}
                </span>
              )}
            </span>
            <TierChip score={row.trustScore} className="px-2 py-0.5 text-[10px]" />
            <span className="w-12 text-right font-mono font-extrabold text-slate-900">{row.trustScore}</span>
          </div>
        ))}
      </div>
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
