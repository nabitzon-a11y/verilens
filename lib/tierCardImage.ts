'use client';

import type { SetResult } from '@/types';
import { TRUST, type TrustTierId, getNextTier, getTrustTier } from './constants';

const TIER_PALETTE: Record<TrustTierId, { c1: string; c2: string; c3: string; accent: string }> = {
  master: { c1: '#C026D3', c2: '#6D28D9', c3: '#312E81', accent: '#FDE047' },
  diamond: { c1: '#0EA5E9', c2: '#4F46E5', c3: '#4C1D95', accent: '#BAE6FD' },
  platinum: { c1: '#06B6D4', c2: '#0F766E', c3: '#334155', accent: '#A7F3D0' },
  gold: { c1: '#FBBF24', c2: '#F59E0B', c3: '#B45309', accent: '#FEF3C7' },
  silver: { c1: '#94A3B8', c2: '#64748B', c3: '#334155', accent: '#E2E8F0' },
  bronze: { c1: '#FB923C', c2: '#EA580C', c3: '#92400E', accent: '#FED7AA' },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * 결과 화면의 인간 직관 등급 카드를 900x1125(4:5) 고해상도 PNG 로 렌더링합니다.
 */
export async function renderTierCardPng(params: {
  result: SetResult;
  lang: 'ko' | 'en';
  username?: string;
}): Promise<{ dataUrl: string; blob: Blob }> {
  const { result, lang, username } = params;
  const en = lang === 'en';
  const tier = getTrustTier(result.trustScore);
  const next = getNextTier(result.trustScore);
  const pal = TIER_PALETTE[tier.tier];

  const W = 900;
  const H = 1125;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  // Outer card background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, pal.c1);
  grad.addColorStop(0.55, pal.c2);
  grad.addColorStop(1, pal.c3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative glow blobs
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(W - 90, 120, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.arc(110, H - 150, 260, 0, Math.PI * 2);
  ctx.fill();

  // Inner subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 4;
  roundRect(ctx, 28, 28, W - 56, H - 56, 44);
  ctx.stroke();

  const fontStack = '"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

  // Header brand + tag
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = `700 22px ${fontStack}`;
  ctx.fillText('VERILENS · HUMAN INTUITION CARD', 72, 102);

  if (result.perfect) {
    roundRect(ctx, W - 246, 68, 174, 48, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.fillStyle = '#D97706';
    ctx.font = `800 22px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.fillText('★ PERFECT', W - 159, 100);
    ctx.textAlign = 'left';
  }

  // Username
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 36px ${fontStack}`;
  ctx.fillText(username ? `@${username}` : '@Pioneer', 72, 166);

  // Center emblem badge
  roundRect(ctx, 72, 232, 148, 148, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
  ctx.fillStyle = pal.accent;
  ctx.font = `900 72px ${fontStack}`;
  ctx.textAlign = 'center';
  const symbolMap: Record<TrustTierId, string> = {
    master: '👑',
    diamond: '💎',
    platinum: '🏆',
    gold: '🥇',
    silver: '🛡️',
    bronze: '✨',
  };
  ctx.fillText(symbolMap[tier.tier], 146, 330);
  ctx.textAlign = 'left';

  // Tier name & score
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 84px ${fontStack}`;
  ctx.fillText(tier.label, 252, 306);

  const deltaStr = `${result.trustDelta >= 0 ? '+' : ''}${result.trustDelta}`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `800 38px ${fontStack}`;
  ctx.fillText(`${result.trustScore.toLocaleString()} / ${TRUST.MAX.toLocaleString()}  (${deltaStr})`, 252, 366);

  // Progress bar
  const barX = 72;
  const barY = 448;
  const barW = W - 144;
  const barH = 26;
  roundRect(ctx, barX, barY, barW, barH, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();

  const pct = next ? Math.max(0.08, next.progress) : 1;
  roundRect(ctx, barX, barY, Math.round(barW * pct), barH, 13);
  ctx.fillStyle = pal.accent;
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `700 24px ${fontStack}`;
  const subProgress = next
    ? en
      ? `${next.remaining.toLocaleString()} pts to ${next.label}`
      : `${next.label} 승급까지 ${next.remaining.toLocaleString()}점`
    : en
      ? 'Top Tier Achieved — Master Intuition'
      : '최고 등급 달성 — Master 직관 보유자';
  ctx.fillText(subProgress, 72, 514);

  // 3 Stat boxes
  const stats = [
    { label: en ? 'ACCURACY' : '적중', value: `${result.matchedCount}/${result.total}` },
    { label: en ? 'RANK' : '순위', value: en ? `Top ${result.topPercent}%` : `상위 ${result.topPercent}%` },
    { label: en ? 'STREAK' : '연속 참여', value: en ? `${result.streak}d` : `${result.streak}일` },
  ];
  const gap = 22;
  const boxW = (W - 144 - gap * 2) / 3;
  const boxY = 580;
  const boxH = 190;
  stats.forEach((s, idx) => {
    const bx = 72 + idx * (boxW + gap);
    roundRect(ctx, bx, boxY, boxW, boxH, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = `700 22px ${fontStack}`;
    ctx.fillText(s.label, bx + boxW / 2, boxY + 62);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 46px ${fontStack}`;
    ctx.fillText(s.value, bx + boxW / 2, boxY + 134);
  });
  ctx.textAlign = 'left';

  // Challenge tagline box
  roundRect(ctx, 72, 822, W - 144, 134, 28);
  ctx.fillStyle = 'rgba(15, 10, 30, 0.28)';
  ctx.fill();
  ctx.fillStyle = pal.accent;
  ctx.font = `800 28px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.fillText(
    en ? 'Can you spot AI fakes better than me?' : 'AI 가짜, 나보다 잘 가려낼 수 있어?',
    W / 2,
    880,
  );
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `600 23px ${fontStack}`;
  ctx.fillText(
    en ? '5-Second Human-in-the-Loop AI Verification on Pi' : 'Pi Network 기반 5초 인간 직관 검증 플랫폼',
    W / 2,
    926,
  );

  // Footer URL
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `800 26px ${fontStack}`;
  ctx.fillText('https://verilens-main.vercel.app', W / 2, 1038);
  ctx.textAlign = 'left';

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });

  return { dataUrl, blob };
}
