'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  FilePlus2,
  Loader2,
  MessageSquareText,
  ScanFace,
  Share2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import type { PublicVerdictResponse } from '@/types';
import { translatePromptToEn, translatePromptToKo } from '@/data/missions.en';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/apiClient';
import { errorMessage, formatDateTime } from '@/lib/format';
import { buildShareUrl, shareLink } from '@/lib/piSdk';

export default function VerdictPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useApp();
  const en = lang === 'en';
  const [data, setData] = useState<PublicVerdictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api<PublicVerdictResponse>(`/api/verdict/${encodeURIComponent(id)}`)
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  if (error) {
    return (
      <section className="card space-y-3 text-center">
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <Link href="/" className="btn-primary w-full">
          {en ? 'Go Home' : '홈으로'}
        </Link>
      </section>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  const isSingle = data.mode === 'single';
  const aPct = data.total > 0 ? Math.round((data.votes.A / data.total) * 100) : 0;
  const bPct = data.total > 0 ? 100 - aPct : 0;
  const topReasons = Object.entries(data.reasonCounts ?? {})
    .sort((x, y) => y[1] - x[1])
    .slice(0, 4);

  const share = async () => {
    const url = buildShareUrl(`/verdict/${encodeURIComponent(data.id)}`);
    const title = en ? 'VeriLens Official Reality Report' : 'VeriLens 공식 판정서';
    const text = en
      ? `Check the ${data.total}-human verification verdict on VeriLens!`
      : `VeriLens 인간 검증단(${data.total}명)의 공식 판정 결과를 확인해 보세요!`;
    const outcome = await shareLink(title, text, url);
    setToast(
      outcome === 'failed'
        ? en
          ? 'Failed to share'
          : '공유에 실패했습니다'
        : en
          ? 'Verdict link copied!'
          : '공식 판정서 링크를 복사했어요!',
    );
  };

  return (
    <div className="space-y-4 pb-4">
      <section className="card space-y-4 border-2 border-brand/20 bg-gradient-to-br from-white via-white to-brand-soft/40 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="chip bg-brand text-white">
            <ShieldCheck className="h-3.5 w-3.5" />
            {en ? 'Official Reality Report' : 'VeriLens 공식 판정서'}
          </span>
          <span
            className={clsx(
              'chip text-xs font-bold',
              data.status === 'closed' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-human-dark',
            )}
          >
            {data.status === 'closed' ? (en ? 'Finalized' : '판정 완료') : `${data.total}/${data.target}${en ? ' votes' : '표'}`}
          </span>
        </div>

        {/* 핵심 판정 배너 */}
        {data.total === 0 ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
            <Clock className="h-5 w-5 shrink-0 text-slate-400" />
            {en ? 'Waiting for KYC-verified Pioneers to vote…' : 'KYC 인증 검증단의 첫 투표를 기다리고 있어요…'}
          </div>
        ) : isSingle ? (
          <div
            className={clsx(
              'rounded-2xl border p-4',
              data.votes.A >= data.votes.B ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50',
            )}
          >
            <div className="flex items-center gap-2">
              {data.votes.A >= data.votes.B ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-human-dark" />
              ) : (
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
              )}
              <p className={clsx('text-base font-black', data.votes.A >= data.votes.B ? 'text-emerald-950' : 'text-rose-950')}>
                {data.votes.A >= data.votes.B
                  ? en
                    ? `${aPct}% judged Authentic Human (${data.total} votes)`
                    : `${aPct}%가 실제 인간 원본으로 판정 (${data.total}명)`
                  : en
                    ? `${bPct}% flagged AI / Synthetic (${data.total} votes)`
                    : `${bPct}%가 AI · 조작 의심으로 판정 (${data.total}명)`}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-brand/25 bg-brand-soft/60 p-4">
            <p className="text-base font-black text-brand">
              {en
                ? `${Math.max(aPct, bPct)}% picked ${data.votes.A >= data.votes.B ? 'A' : 'B'} as Authentic Human (${data.total} votes)`
                : `${Math.max(aPct, bPct)}%가 ${data.votes.A >= data.votes.B ? 'A' : 'B'}를 실제 인간 원본으로 선택 (${data.total}명)`}
            </p>
          </div>
        )}

        {/* 투표 분포 바 */}
        {data.total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>
                {isSingle ? (en ? 'Authentic Human' : '실제 인간 원본') : 'A'} · {data.votes.A} ({aPct}%)
              </span>
              <span>
                {isSingle ? (en ? 'AI-Generated' : 'AI 생성 · 합성') : 'B'} · {data.votes.B} ({bPct}%)
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-human-dark transition-all" style={{ width: `${aPct}%` }} />
              <div className="bg-rose-400 transition-all" style={{ width: `${bPct}%` }} />
            </div>
          </div>
        )}

        {/* 의뢰 질문 & 상황 메모 */}
        <div className="space-y-2 pt-1">
          <p className="text-base font-extrabold text-slate-900">
            {en ? translatePromptToEn(data.prompt) : translatePromptToKo(data.prompt)}
          </p>
          {data.contextNote && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-semibold text-amber-900">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-pi-light" />
              <span>
                {en ? 'Requester note: ' : '의뢰자 메모: '}
                {data.contextNote}
              </span>
            </div>
          )}
        </div>

        {/* 의뢰 콘텐츠 미리보기 */}
        <div className={clsx('grid gap-2.5', data.b ? 'grid-cols-1' : 'grid-cols-1')}>
          {[data.a, ...(data.b ? [data.b] : [])].map((content, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3.5">
              {data.b && (
                <span className="mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                  {idx === 0 ? 'A' : 'B'}
                </span>
              )}
              {content.type === 'text' ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{content.body}</p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.src} alt={content.alt} className="aspect-[4/3] w-full rounded-xl object-cover" />
              )}
            </div>
          ))}
        </div>

        {/* 판별자 근거 태그 요약 */}
        {topReasons.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500">
              {en ? 'Top reasons cited by verifiers' : '검증단이 꼽은 주요 판정 근거'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topReasons.map(([tag, count]) => (
                <span key={tag} className="chip border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                  {tag} · {count}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-right text-[11px] text-slate-400">{formatDateTime(data.createdAt, en ? 'en' : 'ko')}</p>

        <button type="button" onClick={() => void share()} className="btn-primary w-full py-3.5 text-sm font-bold">
          <Share2 className="h-4 w-4" />
          {en ? 'Share Official Verdict Link' : '공식 판정서 링크 복사 · 공유하기'}
        </button>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/submit" className="btn-outline py-3 text-xs font-bold">
          <FilePlus2 className="h-4 w-4" />
          {en ? 'Submit Yours' : '나도 검증 의뢰하기'}
        </Link>
        <Link href="/verify" className="btn-primary py-3 text-xs font-bold">
          <ScanFace className="h-4 w-4" />
          {en ? 'Join Verifiers' : '판별단 참여하기'}
        </Link>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-10 z-50 flex justify-center px-4">
          <p className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</p>
        </div>
      )}
    </div>
  );
}
