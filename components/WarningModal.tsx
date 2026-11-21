'use client';

import { AlertTriangle } from 'lucide-react';

interface WarningModalProps {
  open: boolean;
  message: string;
  onRecheck: () => void;
  busy?: boolean;
}

/** PiVerify 2단계 — 비정상 매크로 패턴 감지 경고 */
export function WarningModal({ open, message, onRecheck, busy }: WarningModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-xs rounded-3xl border border-pi/30 bg-navy-800 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pi/15">
          <AlertTriangle className="h-7 w-7 text-pi" />
        </div>
        <h2 className="text-base font-bold text-white">비정상 매크로 패턴 감지</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>
        <p className="mt-2 text-xs text-slate-500">
          너무 빠른 응답은 보상에서 제외됩니다. 사람임을 다시 확인한 뒤 이어서 진행하세요.
        </p>
        <button type="button" className="btn-amber mt-5 w-full" onClick={onRecheck} disabled={busy}>
          인간 재검증 시작
        </button>
      </div>
    </div>
  );
}
