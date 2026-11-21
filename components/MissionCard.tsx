'use client';

import { useState } from 'react';
import { FileText, ImageOff } from 'lucide-react';
import clsx from 'clsx';
import type { Choice, MissionContent } from '@/types';

interface MissionCardProps {
  side: Choice;
  content: MissionContent;
  selected: boolean;
  disabled: boolean;
  onSelect: (side: Choice) => void;
}

/** A/B 판별 카드 — 텍스트 또는 이미지(로드 실패 시 플레이스홀더) */
export function MissionCard({ side, content, selected, disabled, onSelect }: MissionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(side)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${side} 선택`}
      className={clsx(
        'relative w-full overflow-hidden rounded-2xl border-2 bg-navy-800 text-left transition',
        'active:scale-[0.99] disabled:cursor-default',
        selected ? 'border-human shadow-[0_0_0_4px_rgba(16,185,129,0.15)]' : 'border-white/5 hover:border-white/20',
      )}
    >
      <span
        className={clsx(
          'absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-black',
          selected ? 'bg-human text-navy' : 'bg-black/60 text-white',
        )}
      >
        {side}
      </span>

      {content.type === 'text' ? <TextBody content={content} /> : <ImageBody content={content} />}
    </button>
  );
}

function TextBody({ content }: { content: Extract<MissionContent, { type: 'text' }> }) {
  return (
    <div className="p-4 pt-12">
      {content.sourceLabel && (
        <span className="chip mb-2 bg-white/5 text-slate-400">
          <FileText className="h-3 w-3" />
          {content.sourceLabel}
        </span>
      )}
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-100">{content.body}</p>
    </div>
  );
}

function ImageBody({ content }: { content: Extract<MissionContent, { type: 'image' }> }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy-700 to-navy-600 text-slate-400">
        <ImageOff className="h-8 w-8" />
        <span className="text-sm font-medium">{content.placeholderLabel}</span>
        <span className="text-[11px] text-slate-500">이미지를 불러오지 못했습니다</span>
      </div>
    );
  }

  return (
    // 로컬 SVG / data URL 을 그대로 표시 (next/image 최적화 불필요)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={content.src}
      alt={content.alt}
      onError={() => setFailed(true)}
      draggable={false}
      className="aspect-[4/3] w-full select-none object-cover"
    />
  );
}
