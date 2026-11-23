'use client';

import { AlertTriangle } from 'lucide-react';
import { useApp } from './AppProvider';

interface WarningModalProps {
  open: boolean;
  message: string;
  onRecheck: () => void;
  busy?: boolean;
}

/** PiVerify 2단계 — 비정상 매크로 패턴 감지 경고 */
export function WarningModal({ open, message, onRecheck, busy }: WarningModalProps) {
  const { lang } = useApp();
  const en = lang === 'en';
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-6 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-xs rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-7 w-7 text-pi-light" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {en ? 'Unusual Bot-Like Pattern Detected' : '비정상 매크로 패턴 감지'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        <p className="mt-2 text-xs text-slate-500">
          {en
            ? 'Ultra-fast clicks are excluded from rewards. Please re-verify you are human to continue.'
            : '너무 빠른 응답은 보상에서 제외됩니다. 사람임을 다시 확인한 뒤 이어서 진행하세요.'}
        </p>
        <button type="button" className="btn-amber mt-5 w-full" onClick={onRecheck} disabled={busy}>
          {en ? 'Re-verify Human' : '인간 재검증 시작'}
        </button>
      </div>
    </div>
  );
}
