'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  CheckCircle2,
  FilePlus2,
  Flame,
  Home,
  Image as ImageIcon,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import type { MissionResult, SetResult } from '@/types';
import { SEED_EN } from '@/data/missions.en';
import { useApp } from '@/components/AppProvider';
import { formatSignedPi } from '@/lib/format';
import { RESULT_TEXT } from '@/lib/i18n';
import { buildShareUrl, shareLink } from '@/lib/piSdk';
import { loadLastResult } from '@/lib/resultStore';

export default function ResultPage() {
  const { lang } = useApp();
  const t = RESULT_TEXT[lang];
  const [result, setResult] = useState<SetResult | null | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setResult(loadLastResult());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  if (result === undefined) return null;

  if (!result) {
    return (
      <section className="card space-y-3 text-center">
        <p className="text-sm text-slate-600">{t.empty}</p>
        <Link href="/verify" className="btn-primary w-full">
          {t.goVerify}
        </Link>
      </section>
    );
  }

  const share = async () => {
    if (!result.challengeMissionId) return;
    const url = buildShareUrl(`/verify?challenge=${encodeURIComponent(result.challengeMissionId)}`);
    const outcome = await shareLink(
      lang === 'en' ? 'VeriLens Challenge' : 'VeriLens 도전장',
      lang === 'en'
        ? `Human or AI? I scored ${result.matchedCount}/${result.total}. Can you beat my intuition?`
        : `AI 가짜일까, 진짜 사람일까? 나는 ${result.matchedCount}/${result.total} 맞혔어. 너의 인간 직관을 증명해 봐!`,
      url,
    );
    setToast(
      outcome === 'clipboard'
        ? lang === 'en'
          ? 'Challenge link copied'
          : '도전장 링크를 복사했어요'
        : outcome === 'failed'
          ? lang === 'en'
            ? 'Failed to share'
            : '공유에 실패했습니다'
          : lang === 'en'
            ? 'Challenge sent'
            : '도전장을 보냈어요',
    );
  };

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <section className="card relative overflow-hidden text-center">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
        <p className="label">{t.accuracyTitle}</p>
        <p className="mt-2 text-5xl font-black text-slate-900">
          {result.matchedCount}
          <span className="text-2xl text-slate-400"> / {result.total}{lang === 'en' ? ' Qs' : '문항'}</span>
        </p>
        <p className="mt-1 text-sm font-bold text-brand">
          {t.topPrefix}
          {result.topPercent}
          {t.topSuffix}
        </p>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 py-3.5">
          <p className="text-xs font-medium text-amber-800">{t.rewardTitle}</p>
          <p className={clsx('text-2xl font-black', result.reward > 0 ? 'text-pi-light' : 'text-slate-400')}>
            {formatSignedPi(result.reward)}
          </p>
          {result.reward > 0 && (
            <p className="text-xs text-amber-700">
              {result.rewardedCount}
              {t.matchedSuffix}
            </p>
          )}
        </div>

        <div className="mt-3 flex justify-center gap-2">
          <span
            className={clsx(
              'chip',
              result.trustDelta >= 0 ? 'border border-emerald-200 bg-emerald-50 text-human-dark' : 'border border-red-200 bg-red-50 text-red-600',
            )}
          >
            {result.trustDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {t.trustLabel} {result.trustDelta >= 0 ? '+' : ''}
            {result.trustDelta} → {result.trustScore}%
          </span>
          <span className="chip border border-orange-200 bg-orange-50 text-orange-700">
            <Flame className="h-3.5 w-3.5" />
            {result.streak}
            {t.streakSuffix}
          </span>
        </div>
      </section>

      <StatusBanner result={result} t={t} />

      {/* 문항별 리포트 */}
      <section className="space-y-3">
        <p className="label px-1">{t.reportTitle}</p>
        {result.results.map((r, i) => (
          <ResultItem key={r.missionId} n={i + 1} r={r} t={t} lang={lang} />
        ))}
      </section>

      {/* 액션 */}
      <section className="space-y-2.5">
        {result.challengeMissionId && (
          <button type="button" className="btn-amber w-full" onClick={share}>
            <Share2 className="h-4 w-4" />
            {t.shareBtn}
          </button>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/verify" className="btn-primary">
            <RotateCcw className="h-4 w-4" />
            {t.nextSetBtn}
          </Link>
          <Link href="/" className="btn-ghost">
            <Home className="h-4 w-4" />
            {t.homeBtn}
          </Link>
        </div>

        <Link
          href="/submit"
          className="flex items-center gap-3 rounded-2xl border border-brand/25 bg-brand-soft/60 p-4 transition hover:bg-brand-soft"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <FilePlus2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              {lang === 'en' ? 'Have content you want verified?' : '내가 헷갈리는 글·사진도 검증해 볼까요?'}
            </p>
            <p className="text-xs text-slate-600">
              {lang === 'en'
                ? 'Submit reviews, posts, or images for 10-human consensus.'
                : '수상한 후기·이미지·AI 글을 올리면 10인이 판별해 드립니다.'}
            </p>
          </div>
        </Link>
      </section>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <p className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</p>
        </div>
      )}
    </div>
  );
}

function StatusBanner({ result, t }: { result: SetResult; t: (typeof RESULT_TEXT)['ko'] }) {
  if (result.flagged) {
    return (
      <Banner tone="red" icon={<ShieldAlert className="h-5 w-5" />} title={t.flaggedTitle}>
        {result.flagReason ? `${result.flagReason} ` : ''}
        {t.flaggedBody}
      </Banner>
    );
  }
  if (!result.goldPassed) {
    return (
      <Banner tone="amber" icon={<AlertOctagon className="h-5 w-5" />} title={t.goldFailTitle}>
        {t.goldFailBody}
      </Banner>
    );
  }
  return (
    <Banner tone="green" icon={<ShieldCheck className="h-5 w-5" />} title={t.goldPassTitle}>
      {result.rechecked ? t.goldPassRecheck : t.goldPassBody}
    </Banner>
  );
}

function Banner({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'red' | 'amber' | 'green';
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const style = {
    red: 'border-red-200 bg-red-50 text-red-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[tone];
  return (
    <section className={clsx('flex gap-3 rounded-2xl border p-4', style)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-85">{children}</p>
      </div>
    </section>
  );
}

function ResultItem({ n, r, t, lang }: { n: number; r: MissionResult; t: (typeof RESULT_TEXT)['ko']; lang: 'ko' | 'en' }) {
  const total = r.tally.A + r.tally.B;
  const isSingle = r.mode === 'single';
  const labelOf = (c: 'A' | 'B' | null) => {
    if (!c) return t.undecided;
    if (!isSingle) return c;
    return c === 'A' ? (lang === 'en' ? 'Human' : '인간') : 'AI';
  };
  const aLabel = isSingle ? (lang === 'en' ? 'Human' : '인간') : 'A';
  const bLabel = isSingle ? 'AI' : 'B';
  const aiTell =
    lang === 'en'
      ? SEED_EN[r.missionId]?.aiTell ??
        (r.ownMission
          ? 'This is your submitted item. Your own vote is excluded from rewards and real consensus.'
          : 'Requester-submitted item. Ground truth is determined by verified 10-human consensus.')
      : r.aiTell;
  return (
    <article className="card space-y-3">
      <header className="flex items-center gap-2">
        <span className="chip bg-slate-100 text-slate-700">
          {r.kind === 'image' ? <ImageIcon className="h-3.5 w-3.5 text-brand" /> : <Sparkles className="h-3.5 w-3.5 text-brand" />}Q{n} ·{' '}
          {r.kind === 'image' ? t.imageLabel : t.textLabel}
        </span>
        {r.excludedFast && (
          <span className="chip bg-amber-50 text-amber-700">
            <Zap className="h-3.5 w-3.5" />
            {t.fastExcluded}
          </span>
        )}
        <span className="ml-auto">
          {r.matched ? <CheckCircle2 className="h-5 w-5 text-human-dark" /> : <XCircle className="h-5 w-5 text-red-500" />}
        </span>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Cell label={t.myChoice} value={labelOf(r.choice)} highlight={r.matched} />
        <Cell label={t.consensusLabel} value={labelOf(r.consensus)} />
        <Cell label={t.actualOrigin} value={r.humanSide ? labelOf(r.humanSide) : '—'} />
      </div>

      {/* 투표 분포 */}
      <div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="bg-brand" style={{ width: `${(r.tally.A / total) * 100}%` }} />
          <div className="bg-amber-400" style={{ width: `${(r.tally.B / total) * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-slate-500">
          <span>
            {aLabel} {r.tally.A}
            {t.votesUnit}
          </span>
          <span>
            {t.reactionLabel}
            {(r.reactionMs / 1000).toFixed(1)}
            {t.secUnit}
          </span>
          <span>
            {bLabel} {r.tally.B}
            {t.votesUnit}
          </span>
        </div>
      </div>

      <p className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-[13px] leading-relaxed text-slate-700">
        <span className="mb-1 flex items-center gap-1 font-bold text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          {t.aiTellLabel}
        </span>
        {aiTell}
      </p>
    </article>
  );
}

function Cell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={clsx('text-base font-black', highlight ? 'text-human-dark' : 'text-slate-900')}>{value}</p>
    </div>
  );
}
