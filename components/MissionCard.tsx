'use client';

import { useState } from 'react';
import { FileText, ImageOff } from 'lucide-react';
import clsx from 'clsx';
import type { Choice, MissionContent } from '@/types';
import { useApp } from './AppProvider';

interface MissionCardProps {
  side: Choice;
  content: MissionContent;
  selected: boolean;
  disabled: boolean;
  onSelect: (side: Choice) => void;
}

/** A/B 판별 카드 — 화이트 카드 + 보라색 선택 강조 */
export function MissionCard({ side, content, selected, disabled, onSelect }: MissionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(side)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${side} 선택`}
      className={clsx(
        'relative w-full overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition',
        'active:scale-[0.99] disabled:cursor-default',
        selected ? 'border-brand shadow-[0_0_0_4px_rgba(109,40,217,0.14)]' : 'border-slate-200 hover:border-brand/40',
      )}
    >
      <span
        className={clsx(
          'absolute left-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shadow-sm',
          selected ? 'bg-brand text-white' : 'bg-slate-900/75 text-white',
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
    <div className="p-5 pt-14">
      {content.sourceLabel && (
        <span className="chip mb-2.5 bg-slate-100 text-slate-600">
          <FileText className="h-3.5 w-3.5 text-brand" />
          {content.sourceLabel}
        </span>
      )}
      <p className="whitespace-pre-line text-base leading-relaxed text-slate-800">{content.body}</p>
    </div>
  );
}

function ImageBody({ content }: { content: Extract<MissionContent, { type: 'image' }> }) {
  const { lang } = useApp();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500">
        <ImageOff className="h-8 w-8" />
        <span className="text-sm font-medium">{content.placeholderLabel}</span>
        <span className="text-xs text-slate-400">{lang === 'en' ? 'Failed to load image' : '이미지를 불러오지 못했습니다'}</span>
      </div>
    );
  }

  return (
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
