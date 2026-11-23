'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  FileText,
  Flag,
  Layers,
  Loader2,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import type { AdminOverviewResponse } from '@/types';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { ApiError, api } from '@/lib/apiClient';
import { errorMessage, formatDateTime, formatPi } from '@/lib/format';

interface GeneratedDraft {
  prompt: string;
  sourceLabel: string;
  aBody: string;
  bBody: string;
  humanSide: 'A' | 'B';
  aiTell: string;
}

export default function AdminPage() {
  const { ready, profile } = useApp();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draftSource, setDraftSource] = useState<'gemini' | 'template' | null>(null);
  const [draftReason, setDraftReason] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<GeneratedDraft[]>([]);
  const [publishingIdx, setPublishingIdx] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setData(await api<AdminOverviewResponse>('/api/admin/overview'));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      }
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) void load();
  }, [profile, load]);

  const closeMission = async (missionId: string) => {
    setClosingId(missionId);
    try {
      await api('/api/admin/missions/close', { body: { missionId } });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setClosingId(null);
    }
  };

  const generateDrafts = async () => {
    setGenerating(true);
    setError(null);
    setDraftReason(null);
    try {
      const res = await api<{ source: 'gemini' | 'template'; reason?: string; drafts: GeneratedDraft[] }>('/api/admin/generate', {
        body: { topic: topic.trim() || undefined },
      });
      setDraftSource(res.source);
      setDraftReason(res.reason ?? null);
      setDrafts(res.drafts);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const publishDraft = async (idx: number) => {
    const d = drafts[idx];
    if (!d) return;
    setPublishingIdx(idx);
    try {
      await api('/api/admin/missions/publish', { body: d });
      setDrafts((prev) => prev.filter((_, i) => i !== idx));
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPublishingIdx(null);
    }
  };

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!profile) {
    return <LoginPanel title="관리자 대시보드에 접속하려면 로그인하세요" />;
  }

  if (forbidden) {
    return (
      <section className="card space-y-4 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">관리자 전용 페이지</h1>
          <p className="mt-1.5 text-sm text-slate-600">{error ?? '접근 권한이 없습니다.'}</p>
        </div>
        <Link href="/" className="btn-ghost w-full">
          <ArrowLeft className="h-4 w-4" />홈으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900">관리자 대시보드</h1>
          <p className="text-xs text-slate-500">@{profile.username} · 실시간 DB 현황</p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="btn-ghost px-3 py-2 text-xs"
        >
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
          새로고침
        </button>
      </header>

      {error && !forbidden && <p className="card text-sm text-red-600">{error}</p>}

      {!data ? (
        <div className="card flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <>
          {/* 핵심 지표 */}
          <section className="grid grid-cols-2 gap-3">
            <KpiCard
              icon={<Users className="h-4 w-4 text-brand" />}
              label="총 가입 유저"
              value={`${data.summary.totalUsers}명`}
              sub={`Pi ${data.summary.piUsers} · Demo ${data.summary.demoUsers}`}
            />
            <KpiCard
              icon={<CheckCircle2 className="h-4 w-4 text-human-dark" />}
              label="완료 판별 세트"
              value={`${data.summary.completedSets}회`}
              sub={`전체 생성 ${data.summary.totalSets}회 · 투표 ${data.summary.totalVotes}표`}
            />
            <KpiCard
              icon={<FileText className="h-4 w-4 text-brand" />}
              label="의뢰 문항"
              value={`${data.summary.totalMissions}건`}
              sub={`진행 ${data.summary.activeMissions} · 마감 ${data.summary.closedMissions} · 신고 ${data.summary.reportedMissions}`}
            />
            <KpiCard
              icon={<Coins className="h-4 w-4 text-pi-light" />}
              label="수수료 / 보상"
              value={formatPi(data.summary.u2aRevenuePi)}
              sub={`지급 ${formatPi(data.summary.a2uRewardedPi)} · 청구 ${formatPi(data.summary.a2uClaimedPi)}`}
            />
          </section>

          {/* AI 문항 자동 생성 */}
          <section className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-brand" />
                <h2 className="text-sm font-bold text-slate-900">AI 문항 자동 생성기</h2>
              </div>
              {draftSource && (
                <span className="chip bg-brand-soft text-brand">
                  {draftSource === 'gemini' ? 'Gemini 실시간 생성' : `예비 템플릿 (${draftReason ?? '미설정'})`}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="주제 입력 (예: 부동산, 중고거래, 여행)"
                className="input flex-1 py-2 text-sm"
              />
              <button
                type="button"
                disabled={generating}
                onClick={() => void generateDrafts()}
                className="btn-primary shrink-0 px-3.5 py-2 text-xs"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                초안 3개 생성
              </button>
            </div>
            {drafts.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {drafts.map((d, idx) => (
                  <div key={idx} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="chip bg-white text-slate-700">{d.sourceLabel}</span>
                      <span className="text-xs font-bold text-human-dark">인간 정답: {d.humanSide}</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      <b className="text-brand">A:</b> {d.aBody}
                    </p>
                    <p className="text-xs text-slate-700">
                      <b className="text-brand">B:</b> {d.bBody}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="flex-1 text-[11px] text-slate-500">{d.aiTell}</p>
                      <button
                        type="button"
                        disabled={publishingIdx === idx}
                        onClick={() => void publishDraft(idx)}
                        className="btn-primary shrink-0 px-3 py-1.5 text-xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        {publishingIdx === idx ? '등록 중…' : '출제 승인'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 의뢰 문항 관리 */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <p className="label">의뢰 문항 관리 ({data.requesterMissions.length})</p>
              {data.summary.reportedMissions > 0 && (
                <span className="chip bg-red-50 text-red-600">
                  <Flag className="h-3 w-3" />
                  신고 {data.summary.reportedMissions}건
                </span>
              )}
            </div>

            {data.requesterMissions.length === 0 ? (
              <p className="card text-center text-sm text-slate-500">등록된 의뢰 문항이 없습니다.</p>
            ) : (
              <div className="space-y-2.5">
                {data.requesterMissions.map((m) => (
                  <article key={m.id} className="card space-y-2 py-3.5">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm font-semibold text-slate-900">{m.prompt}</p>
                      {m.reports > 0 && (
                        <span className="chip shrink-0 bg-red-50 text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          신고 {m.reports}
                        </span>
                      )}
                      <span
                        className={clsx(
                          'chip shrink-0',
                          m.status === 'active'
                            ? 'bg-emerald-50 text-human-dark'
                            : m.status === 'draft'
                              ? 'bg-amber-50 text-pi-light'
                              : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {m.status === 'active' ? '진행 중' : m.status === 'draft' ? '대기' : '마감'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {formatDateTime(m.createdAt)} · A {m.votes.A} / B {m.votes.B}
                        {m.consensus && <b className="ml-1 text-brand">→ {m.consensus}</b>}
                      </span>
                      {m.status === 'active' && (
                        <button
                          type="button"
                          disabled={closingId === m.id}
                          onClick={() => void closeMission(m.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {closingId === m.id ? '처리 중…' : '강제 마감'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* 최근 활동 사용자 */}
          <section className="space-y-2.5">
            <p className="label px-1">최근 활동 유저 (상위 {data.recentUsers.length}명)</p>
            {data.recentUsers.length === 0 ? (
              <p className="card text-center text-sm text-slate-500">아직 가입한 유저가 없습니다.</p>
            ) : (
              <ul className="card divide-y divide-slate-100 p-0">
                {data.recentUsers.map((u) => (
                  <li key={u.uid} className="flex items-center gap-3 px-4 py-3">
                    <Layers className="h-4 w-4 shrink-0 text-brand" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-slate-900">@{u.username}</p>
                        {u.isDemo && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">Demo</span>}
                        {u.botFlags > 0 && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            플래그 {u.botFlags}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        신뢰도 {u.trustScore}% · 완료 {u.setsCompleted}세트 · {formatDateTime(u.updatedAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-brand">{formatPi(u.balance)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card space-y-1 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}
