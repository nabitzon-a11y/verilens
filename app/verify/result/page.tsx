'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  FilePlus2,
  Flame,
  Gift,
  Home,
  Image as ImageIcon,
  PartyPopper,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import type { BonusResult, MissionResult, SetResult } from '@/types';
import { SEED_EN } from '@/data/missions.en';
import { useApp } from '@/components/AppProvider';
import { TIER_THEME, TrustProgress } from '@/components/TierBadge';
import { getTrustTier } from '@/lib/constants';
import { formatSignedPi } from '@/lib/format';
import { RESULT_TEXT } from '@/lib/i18n';
import { buildShareUrl, shareLink } from '@/lib/piSdk';
import { loadLastResult } from '@/lib/resultStore';
import { renderTierCardPng } from '@/lib/tierCardImage';

export default function ResultPage() {
  const { lang, profile } = useApp();
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
            {result.trustDelta} → {result.trustScore.toLocaleString()}
            {lang === 'en' ? ' pts' : '점'}
          </span>
          <span className="chip border border-orange-200 bg-orange-50 text-orange-700">
            <Flame className="h-3.5 w-3.5" />
            {result.streak}
            {t.streakSuffix}
          </span>
        </div>
      </section>

      <StatusBanner result={result} t={t} />

      {(result.dailyQuestBonus || result.streakMilestone) && (
        <section className="space-y-2">
          {result.dailyQuestBonus && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-bold text-emerald-900">
              <Sparkles className="h-5 w-5 shrink-0 text-human-dark" />
              {lang === 'en'
                ? `Daily Quest Complete! +${result.dailyQuestBonus} Trust pts`
                : `오늘의 미션 달성! 신뢰도 +${result.dailyQuestBonus}점 추가`}
            </div>
          )}
          {result.streakMilestone && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-sm font-bold text-amber-900">
              <Flame className="h-5 w-5 shrink-0 text-orange-500" />
              {lang === 'en'
                ? `${result.streakMilestone}-Day Streak Milestone! +35 Bonus Trust pts`
                : `${result.streakMilestone}일 연속 참여 달성! 보너스 신뢰도 +35점`}
            </div>
          )}
        </section>
      )}

      <TierCard result={result} lang={lang} username={profile?.username} onToast={setToast} />

      {result.bonus && <BonusResultCard bonus={result.bonus} lang={lang} />}

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
          href="/submit?tier=free"
          className="relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-brand/30 bg-gradient-to-r from-brand-soft via-white to-amber-50 p-4 shadow-sm transition hover:border-brand/50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow">
            <FilePlus2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
              {lang === 'en' ? 'Now you be the quiz master!' : '이번엔 내가 출제자!'}
              <span className="chip bg-amber-400 px-2 py-0.5 text-[10px] text-white">{lang === 'en' ? '1 FREE / day' : '하루 1회 무료'}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {lang === 'en'
                ? 'Post a suspicious review, text or photo and let 10 verified humans judge it.'
                : '헷갈리는 후기·카톡·사진을 올리면 인증된 10명이 진짜인지 판별해 드려요.'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-brand" />
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

function TierCard({
  result,
  lang,
  username,
  onToast,
}: {
  result: SetResult;
  lang: 'ko' | 'en';
  username?: string;
  onToast: (msg: string) => void;
}) {
  const en = lang === 'en';
  const tier = getTrustTier(result.trustScore);
  const theme = TIER_THEME[tier.tier];
  const Icon = theme.icon;
  const prevTier = result.trustBefore !== undefined ? getTrustTier(result.trustBefore) : undefined;
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [savingImg, setSavingImg] = useState(false);

  const saveCardImage = async () => {
    if (savingImg) return;
    setSavingImg(true);
    try {
      const { dataUrl, blob } = await renderTierCardPng({ result, lang, username });
      const file = new File([blob], `verilens-${tier.tier}.png`, { type: 'image/png' });

      // 1) 모바일 네이티브 파일 공유(카톡 등) 지원 시 우선 호출
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: en ? 'VeriLens Tier Card' : 'VeriLens 직관 등급 카드',
            text: en
              ? `My Human Intuition tier: ${tier.label} (${result.trustScore}/1000)`
              : `나의 인간 직관 등급: ${tier.label} (${result.trustScore}/1,000점)`,
          });
          onToast(en ? 'Tier card image shared' : '등급 카드 이미지를 공유했어요');
          return;
        } catch {
          /* 취소 또는 미지원 시 아래 다운로드/미리보기로 진행 */
        }
      }

      // 2) 일반 브라우저 파일 다운로드 트리거 + Pi Browser 웹뷰 대비 미리보기 모달 표시
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verilens-${tier.tier}-${result.trustScore}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      setCardPreview(dataUrl);
      onToast(en ? 'Tier card PNG ready!' : '등급 카드 이미지가 준비되었습니다!');
    } catch {
      onToast(en ? 'Could not generate card image' : '이미지 생성에 실패했습니다');
    } finally {
      setSavingImg(false);
    }
  };

  const shareCard = async () => {
    const text = en
      ? `My Human Intuition tier: ${tier.label} (${result.trustScore}/1000) · Top ${result.topPercent}%. Can you spot AI fakes better than me?`
      : `나의 인간 직관 등급은 ${tier.label} (${result.trustScore}/1000점) · 상위 ${result.topPercent}%! AI 가짜, 나보다 잘 가려낼 수 있어?`;
    const outcome = await shareLink(en ? 'VeriLens Tier Card' : 'VeriLens 직관 등급 카드', text, buildShareUrl('/'));
    onToast(
      outcome === 'clipboard'
        ? en
          ? 'Tier card copied'
          : '등급 카드를 복사했어요'
        : outcome === 'failed'
          ? en
            ? 'Failed to share'
            : '공유에 실패했습니다'
          : en
            ? 'Tier card shared'
            : '등급 카드를 공유했어요',
    );
  };

  return (
    <section className="space-y-3">
      {result.tierChange === 'up' && prevTier && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-white p-3.5 text-sm font-bold text-amber-800">
          <PartyPopper className="h-5 w-5 shrink-0" />
          {en ? `Tier up! ${prevTier.label} → ${tier.label}` : `등급 승급! ${prevTier.label} → ${tier.label}`}
        </div>
      )}
      {result.tierChange === 'down' && prevTier && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-bold text-red-700">
          <TrendingDown className="h-5 w-5 shrink-0" />
          {en ? `Tier down: ${prevTier.label} → ${tier.label}` : `등급 하락: ${prevTier.label} → ${tier.label}`}
        </div>
      )}

      <div className={clsx('relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg', theme.gradient)}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/75">
              {en ? 'Human Intuition Card' : '인간 직관 등급 카드'}
            </p>
            {username && <p className="mt-0.5 text-sm font-semibold text-white/90">@{username}</p>}
          </div>
          {result.perfect && (
            <span className="chip bg-white/95 text-[11px] font-black text-amber-600">
              <Sparkles className="h-3.5 w-3.5" />
              PERFECT
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-3xl font-black leading-none">{tier.label}</p>
            <p className="mt-1 text-sm font-bold text-white/85">
              {result.trustScore.toLocaleString()} / 1,000
              <span className="ml-1.5 text-white/70">
                ({result.trustDelta >= 0 ? '+' : ''}
                {result.trustDelta})
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <CardStat label={en ? 'Accuracy' : '적중'} value={`${result.matchedCount}/${result.total}`} />
          <CardStat label={en ? 'Rank' : '순위'} value={en ? `Top ${result.topPercent}%` : `상위 ${result.topPercent}%`} />
          <CardStat label={en ? 'Streak' : '연속'} value={en ? `${result.streak}d` : `${result.streak}일`} />
        </div>
      </div>

      <div className="card">
        <TrustProgress score={result.trustScore} lang={lang} label={en ? 'Trust Score' : '신뢰도 (Trust Score)'} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void saveCardImage()} disabled={savingImg} className="btn-amber text-sm">
            <Download className="h-4 w-4" />
            {savingImg ? (en ? 'Saving…' : '생성 중…') : en ? 'Save Card PNG' : '이미지 저장'}
          </button>
          <button type="button" onClick={shareCard} className="btn-ghost text-sm">
            <Share2 className="h-4 w-4" />
            {en ? 'Share Link' : '텍스트 공유'}
          </button>
        </div>
      </div>

      {cardPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xs space-y-3 rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-900">{en ? 'Your Tier Card PNG' : '등급 카드 이미지'}</p>
              <button
                type="button"
                onClick={() => setCardPreview(null)}
                aria-label="닫기"
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardPreview} alt="VeriLens Tier Card" className="w-full rounded-2xl border border-slate-200 shadow-sm" />
            <p className="text-center text-xs text-slate-500">
              {en
                ? 'Saved! In Pi Browser, long-press the image to save it to Photos.'
                : '다운로드되지 않은 환경에서는 이미지를 길게 눌러 저장하세요.'}
            </p>
            <a
              href={cardPreview}
              download={`verilens-${tier.tier}-${result.trustScore}.png`}
              className="btn-primary w-full py-2.5 text-sm"
            >
              <Download className="h-4 w-4" />
              {en ? 'Download PNG' : 'PNG 다시 저장'}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 py-2 backdrop-blur">
      <p className="text-[10px] font-semibold text-white/75">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function BonusResultCard({ bonus, lang }: { bonus: BonusResult; lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  const skipped = bonus.choice < 0;
  const tone = bonus.correct
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : skipped
      ? 'border-slate-200 bg-slate-50 text-slate-700'
      : 'border-amber-200 bg-amber-50 text-amber-900';
  return (
    <section className={clsx('space-y-1.5 rounded-2xl border p-4', tone)}>
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <Gift className="h-4 w-4" />
        {bonus.correct
          ? en
            ? `Bonus correct! +${bonus.trustGain} Trust pts`
            : `보너스 정답! 신뢰도 +${bonus.trustGain}점`
          : skipped
            ? en
              ? 'Bonus skipped'
              : '보너스를 건너뛰었어요'
            : en
              ? `So close! The answer was option ${bonus.answer + 1}`
              : `아쉬워요! 정답은 ${bonus.answer + 1}번이었어요`}
      </p>
      {bonus.correct && bonus.trustGain === 0 && (
        <p className="text-xs opacity-80">
          {en ? 'Bonus points are not granted for disqualified sets.' : '실격 처리된 세트에는 보너스 점수가 지급되지 않아요.'}
        </p>
      )}
      <p className="text-xs leading-relaxed opacity-85">{en ? bonus.explain.en : bonus.explain.ko}</p>
    </section>
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
        {r.difficulty === 3 && (
          <span className="chip border border-rose-200 bg-rose-50 text-rose-600">
            <Flame className="h-3.5 w-3.5" />
            {lang === 'en' ? 'HARD' : '고난도'}
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

      {r.fooledCount !== undefined && !r.ownMission && (
        <p
          className={clsx(
            'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold',
            r.fooledCount >= 4
              ? 'bg-rose-50 text-rose-700'
              : r.fooledCount === 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-50 text-slate-600',
          )}
        >
          {r.fooledCount >= 4 ? <AlertTriangle className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
          {r.fooledCount === 0
            ? lang === 'en'
              ? `All ${total} verifiers saw through it`
              : `${total}명 모두 간파한 문제예요`
            : lang === 'en'
              ? `${r.fooledCount} of ${total} people were fooled by the AI${r.fooledCount >= 4 ? '!' : ''}`
              : `${total}명 중 ${r.fooledCount}명이 AI에 속았어요${r.fooledCount >= 4 ? '!' : ''}`}
          {r.matched && r.fooledCount >= 4 && (
            <span className="ml-auto text-[11px] text-rose-500">{lang === 'en' ? 'You nailed it 👏' : '당신은 간파 👏'}</span>
          )}
        </p>
      )}

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
