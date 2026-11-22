'use client';

import { Lightbulb, Sparkles, X } from 'lucide-react';
import type { Lang } from '@/lib/i18n';

const HINTS: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    items: { tag: string; title: string; desc: string }[];
    close: string;
  }
> = {
  ko: {
    title: 'AI 감별 핵심 힌트',
    subtitle: 'AI가 발전함에 따라 최신 오답 사례가 주기적으로 업데이트됩니다.',
    close: '확인하고 판별하기',
    items: [
      {
        tag: '텍스트',
        title: '1. 생활 디테일 & 날짜·수치 유무',
        desc: 'AI는 "잊을 수 없는 경험", "안전의 중요성" 같은 추상적 총평을 쓰며 웨이팅·주차·구체적 시간 같은 경험이 빠집니다.',
      },
      {
        tag: '텍스트',
        title: '2. 나열식 템플릿과 기계적 양비론',
        desc: '"첫째·둘째·셋째" 또는 "~지만 그럼에도 불구하고"처럼 장단점을 억지로 균형 있게 포장하면 AI일 확률이 높습니다.',
      },
      {
        tag: '이미지',
        title: '3. 간판·메뉴판·시계·달력 속 문자',
        desc: '글자가 뭉개지거나 엉뚱한 기호가 섞이고, 시계 바늘 굵기·숫자 배열(13시 등) 같은 규칙 구조가 자주 틀립니다.',
      },
      {
        tag: '이미지',
        title: '4. 그림자·반영·이음새의 물리 모순',
        desc: '해가 하나인데 그림자 방향이 제각각이거나, 호수 반영이 어긋나고 나무 상자·손가락 경계가 녹아 붙습니다.',
      },
    ],
  },
  en: {
    title: 'Quick AI Detection Hints',
    subtitle: 'Updated regularly as AI models evolve and leave new tells.',
    close: 'Got it, let’s verify',
    items: [
      {
        tag: 'Text',
        title: '1. Missing Lived Details & Numbers',
        desc: 'AI leans on generic praise ("unforgettable experience") and lacks specific times, wait lines, parking tips, or personal mishaps.',
      },
      {
        tag: 'Text',
        title: '2. Formulaic Structure & Hedging',
        desc: '"First, Second, Third" lists or overly balanced "While X, nevertheless Y" templates are strong AI tells.',
      },
      {
        tag: 'Image',
        title: '3. Garbled Text & Broken Sequences',
        desc: 'Check signs, menus, keyboards, clocks, and calendars—AI often mangles letters or repeats/skips numbers.',
      },
      {
        tag: 'Image',
        title: '4. Lighting, Reflection & Seam Physics',
        desc: 'Look for conflicting shadow directions, missing water reflections, extra fingers, or edges melting into each other.',
      },
    ],
  },
};

export function AiHintsModal({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: Lang }) {
  if (!open) return null;
  const t = HINTS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <header className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
              <Lightbulb className="h-5 w-5 text-pi-light" />
              {t.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{t.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <ul className="mt-3 space-y-2.5">
          {t.items.map((item) => (
            <li key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2">
                <span className="chip bg-brand-soft text-brand">{item.tag}</span>
                <p className="text-[13px] font-bold text-slate-900">{item.title}</p>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{item.desc}</p>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onClose} className="btn-primary mt-4 w-full">
          <Sparkles className="h-4 w-4" />
          {t.close}
        </button>
      </div>
    </div>
  );
}
