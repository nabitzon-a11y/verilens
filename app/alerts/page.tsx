'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, FilePlus2, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AlertFeedItem } from '@/app/api/alerts/route';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/apiClient';

export default function AlertsPage() {
  const { lang } = useApp();
  const en = lang === 'en';
  const [items, setItems] = useState<AlertFeedItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ items: AlertFeedItem[] }>('/api/alerts')
      .then((d) => alive && setItems(d.items))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4 pb-6">
      <header className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label={en ? 'Back to Home' : '홈으로'}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {en ? 'Scam & AI Alert Feed' : '사기 · AI 주의 경보'}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              {en
                ? 'Cases flagged as AI or scam by verified Pioneers'
                : '검증단이 AI · 사기 의심으로 판정한 실생활 주의 사례'}
            </p>
          </div>
        </div>
      </header>

      <Link href="/submit?tpl=smishing" className="btn-primary w-full py-3.5 text-sm font-bold">
        <FilePlus2 className="h-4 w-4" />
        {en ? 'Check a Suspicious Message or Photo' : '내가 받은 의심 문자 · 매물 검증받기'}
      </Link>

      {!items ? (
        <div className="flex justify-center py-14 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="card space-y-2.5 border border-slate-200/90 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="chip border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {en ? item.categoryLabel.en : item.categoryLabel.ko} · {item.aiPercent}% AI/Scam
                </span>
                {item.isLiveSubmission ? (
                  <span className="chip bg-brand-soft text-[11px] font-bold text-brand">
                    {en ? 'Live' : '실시간 제보'}
                  </span>
                ) : (
                  <span className="chip bg-slate-100 text-[11px] font-bold text-slate-600">
                    {en ? 'Guide Case' : '대표 유형'}
                  </span>
                )}
              </div>

              <h2 className="text-[15px] font-extrabold text-slate-900">{en ? item.title.en : item.title.ko}</h2>

              <p className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-700">
                “{en ? item.sample.en : item.sample.ko}”
              </p>

              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{en ? item.tip.en : item.tip.ko}</span>
              </p>

              {item.reasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.reasons.map((r) => (
                    <span key={r} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      #{r}
                    </span>
                  ))}
                </div>
              )}

              {item.isLiveSubmission && (
                <Link
                  href={`/verdict/${encodeURIComponent(item.id)}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                >
                  {en ? 'View Official Verdict >' : '공식 판정서 보기 >'}
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
