'use client';

import clsx from 'clsx';
import { Crown, Gem, Medal, Shield, Sparkles, Trophy } from 'lucide-react';
import { TRUST, type TrustTierId, getNextTier, getTrustTier } from '@/lib/constants';

/** 등급별 색상 테마 */
export const TIER_THEME: Record<
  TrustTierId,
  { chip: string; gradient: string; bar: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  master: {
    chip: 'border border-fuchsia-300 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white',
    gradient: 'from-fuchsia-600 via-violet-700 to-indigo-800',
    bar: 'from-fuchsia-400 to-violet-500',
    text: 'text-fuchsia-600',
    icon: Crown,
  },
  diamond: {
    chip: 'border border-sky-300 bg-gradient-to-r from-sky-400 to-indigo-500 text-white',
    gradient: 'from-sky-500 via-indigo-600 to-violet-700',
    bar: 'from-sky-400 to-indigo-500',
    text: 'text-indigo-600',
    icon: Gem,
  },
  platinum: {
    chip: 'border border-cyan-200 bg-cyan-50 text-cyan-700',
    gradient: 'from-cyan-500 via-teal-600 to-slate-700',
    bar: 'from-cyan-400 to-teal-500',
    text: 'text-cyan-700',
    icon: Trophy,
  },
  gold: {
    chip: 'border border-amber-200 bg-amber-50 text-amber-700',
    gradient: 'from-amber-400 via-amber-500 to-orange-600',
    bar: 'from-amber-300 to-amber-500',
    text: 'text-amber-700',
    icon: Medal,
  },
  silver: {
    chip: 'border border-slate-200 bg-slate-100 text-slate-700',
    gradient: 'from-slate-400 via-slate-500 to-slate-700',
    bar: 'from-slate-300 to-slate-500',
    text: 'text-slate-600',
    icon: Shield,
  },
  bronze: {
    chip: 'border border-orange-200 bg-orange-50 text-orange-700',
    gradient: 'from-orange-400 via-orange-600 to-amber-800',
    bar: 'from-orange-300 to-orange-500',
    text: 'text-orange-700',
    icon: Sparkles,
  },
};

export function TierChip({ score, className }: { score: number; className?: string }) {
  const tier = getTrustTier(score);
  const theme = TIER_THEME[tier.tier];
  const Icon = theme.icon;
  return (
    <span className={clsx('chip', theme.chip, className)}>
      <Icon className="h-3.5 w-3.5" />
      {tier.label}
    </span>
  );
}

/** 점수 / 1000 + 다음 등급까지 진행 바 */
export function TrustProgress({ score, lang, label }: { score: number; lang: 'ko' | 'en'; label: string }) {
  const tier = getTrustTier(score);
  const next = getNextTier(score);
  const theme = TIER_THEME[tier.tier];
  const pct = Math.min(100, Math.max(0, (score / TRUST.MAX) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="font-black text-slate-900">
          <span className={clsx('text-base', theme.text)}>{score.toLocaleString()}</span>
          <span className="text-slate-400"> / {TRUST.MAX.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={clsx('h-full rounded-full bg-gradient-to-r transition-all', theme.bar)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
        {next
          ? lang === 'en'
            ? `${next.remaining.toLocaleString()} pts to ${next.label} · Higher tiers are harder to climb`
            : `${next.label}까지 ${next.remaining.toLocaleString()}점 · 상위 등급일수록 오르기 어려워요`
          : lang === 'en'
            ? 'Top tier reached — one slip costs more here!'
            : '최고 등급 달성! 이제 실수 한 번의 대가가 큽니다'}
      </p>
    </div>
  );
}
