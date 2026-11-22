'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Coins, FilePlus2, Fingerprint, Loader2, ScanFace, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import type { ClaimResponse, LedgerEntry, WalletResponse } from '@/types';
import { useApp } from '@/components/AppProvider';
import { LoginPanel } from '@/components/LoginPanel';
import { useScanModal } from '@/components/ScanModal';
import { ApiError, api } from '@/lib/apiClient';
import { errorMessage, formatDateTime, formatPi, formatSignedPi } from '@/lib/format';
import { WALLET_TEXT } from '@/lib/i18n';
import { reverifyForClaim } from '@/lib/piVerifyClient';

export default function WalletPage() {
  const { ready, profile, verifyMode, refresh, lang } = useApp();
  const t = WALLET_TEXT[lang];
  const { modal, run } = useScanModal(verifyMode === 'mock');

  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState<{ tone: 'ok' | 'err'; msg: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setWallet(await api<WalletResponse>('/api/wallet'));
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    if (profile) void load();
  }, [profile, load]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!ready) return <Spinner />;
  if (!profile) return <LoginPanel title={t.loginTitle} />;
  if (loadError) return <p className="card text-center text-sm text-red-300">{loadError}</p>;
  if (!wallet) return <Spinner />;

  const { profile: p, minClaim, canClaim, payoutMode, ledger } = wallet;
  const progress = Math.min(100, (p.balance / minClaim) * 100);

  /** PiVerify 3단계: 출금 직전 1초 생체 재검증 → 1회성 토큰으로 Claim */
  const claim = async () => {
    setClaiming(true);
    try {
      const session = await run(() => reverifyForClaim(), {
        title: t.reverifyTitle,
        subtitle: t.reverifySubtitle,
      });
      const res = await api<ClaimResponse>('/api/wallet/claim', { body: { claimToken: session.token } });
      setToast({ tone: 'ok', msg: `${formatPi(res.amount)} ${lang === 'en' ? 'claimed' : '청구 완료'}${res.mock ? ' (Mock)' : ''}` });
      await Promise.all([load(), refresh()]);
    } catch (err) {
      // 스캔 단계 실패는 모달에서 이미 표시됨
      if (err instanceof ApiError) setToast({ tone: 'err', msg: err.message });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-4">
      {modal}

      <header className="pt-2">
        <h1 className="text-xl font-black text-white">{t.title}</h1>
        <p className="mt-1 text-xs text-slate-400">
          @{p.username} · {t.trustLabel} {p.trustScore}% ({p.tierLabel})
        </p>
      </header>

      {/* 잔액 & 청구 */}
      <section className="card relative space-y-4 overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-pi/20 blur-3xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="label">{t.balanceLabel}</p>
            <p className="mt-1 text-4xl font-black text-pi">{formatPi(p.balance)}</p>
          </div>
          <span className="chip bg-white/10 text-slate-300">{payoutMode === 'mock' ? 'Mock A2U' : 'A2U'}</span>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[11px] text-slate-500">
            <span>{t.minClaimLabel}</span>
            <span>
              {formatPi(Math.min(p.balance, minClaim))} / {formatPi(minClaim)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-pi-dark to-pi-light transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button type="button" className="btn-amber w-full py-4 text-base" disabled={!canClaim || claiming} onClick={claim}>
          {claiming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
          {t.claimBtn}
        </button>
        <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-human" />
          {canClaim ? t.claimReadyHint : t.claimMinHint(minClaim)}
        </p>
      </section>

      {/* 누적 통계 */}
      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat label={t.earnedLabel} value={formatPi(p.totalEarned)} tone="text-human" />
        <Stat label={t.claimedLabel} value={formatPi(p.totalClaimed)} tone="text-pi" />
        <Stat label={t.setsLabel} value={`${p.setsCompleted}`} tone="text-white" />
      </section>

      {/* 정산 내역 */}
      <section className="space-y-2">
        <p className="label px-1">{t.ledgerTitle}</p>
        {ledger.length === 0 ? (
          <div className="card space-y-3 text-center">
            <p className="text-xs text-slate-500">{t.emptyLedger}</p>
            <Link href="/verify" className="btn-primary w-full">
              <ScanFace className="h-4 w-4" />
              {t.goVerifyBtn}
            </Link>
          </div>
        ) : (
          <ul className="card divide-y divide-white/5 p-0">
            {ledger.map((e) => (
              <LedgerRow key={e.id} e={e} />
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <p
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold shadow-lg',
              toast.tone === 'ok' ? 'bg-human text-navy' : 'bg-red-500 text-white',
            )}
          >
            {toast.msg}
          </p>
        </div>
      )}
    </div>
  );
}

const LEDGER_META: Record<LedgerEntry['type'], { label: string; icon: React.ReactNode; bg: string }> = {
  reward: { label: '판별 보상', icon: <ArrowDownLeft className="h-4 w-4 text-human" />, bg: 'bg-human/10' },
  claim: { label: '보상 청구', icon: <ArrowUpRight className="h-4 w-4 text-pi" />, bg: 'bg-pi/10' },
  submission_payment: { label: '의뢰 결제', icon: <FilePlus2 className="h-4 w-4 text-slate-300" />, bg: 'bg-white/5' },
};

const STATUS_LABEL: Record<LedgerEntry['status'], string> = {
  pending: '합의 대기',
  settled: '정산 완료',
  failed: '실패',
};

function LedgerRow({ e }: { e: LedgerEntry }) {
  const meta = LEDGER_META[e.type];
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', meta.bg)}>{meta.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-200">{e.memo || meta.label}</p>
        <p className="text-[11px] text-slate-500">
          {formatDateTime(e.createdAt)} · {STATUS_LABEL[e.status]}
          {e.mock && <span className="ml-1 rounded bg-white/10 px-1 text-[10px]">Mock</span>}
        </p>
      </div>
      <p className={clsx('shrink-0 text-sm font-bold', e.amount >= 0 ? 'text-human' : 'text-slate-300')}>
        {formatSignedPi(e.amount)}
      </p>
    </li>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card px-2 py-3">
      <Coins className="mx-auto mb-1 h-4 w-4 text-slate-500" />
      <p className={clsx('text-sm font-bold', tone)}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-human" />
    </div>
  );
}
