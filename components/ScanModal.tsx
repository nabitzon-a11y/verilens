'use client';

import { useCallback, useState } from 'react';
import { CheckCircle2, ScanFace, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { errorMessage } from '@/lib/format';

type ScanStatus = 'scanning' | 'success' | 'error';

interface ScanModalProps {
  open: boolean;
  status: ScanStatus;
  title: string;
  subtitle?: string;
  error?: string;
  mock?: boolean;
}

/** PiVerify 생체·고유성 스캔 연출 모달 */
export function ScanModal({ open, status, title, subtitle, error, mock = true }: ScanModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-live="polite">
      <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-navy-800 p-6 text-center shadow-2xl">
        <div
          className={clsx(
            'relative mx-auto mb-5 flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border-2',
            status === 'error' ? 'border-red-400/60' : 'border-human/60',
          )}
        >
          {status === 'scanning' && (
            <>
              <ScanFace className="h-20 w-20 text-human/80" strokeWidth={1.2} />
              <div className="pointer-events-none absolute inset-0 animate-scan">
                <div className="h-1/2 bg-gradient-to-b from-transparent via-human/25 to-human/60" />
                <div className="h-0.5 bg-human shadow-[0_0_12px_2px_rgba(16,185,129,0.8)]" />
              </div>
            </>
          )}
          {status === 'success' && <CheckCircle2 className="h-20 w-20 text-human" strokeWidth={1.4} />}
          {status === 'error' && <XCircle className="h-20 w-20 text-red-400" strokeWidth={1.4} />}
        </div>

        <h2 className="text-base font-bold text-white">
          {status === 'success' ? '인간 검증 완료' : status === 'error' ? '검증 실패' : title}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {status === 'error' ? error : status === 'success' ? 'Human Verified ✓' : subtitle}
        </p>
        {mock && <p className="mt-4 text-[10px] text-slate-500">PiVerify Mock Adapter · 해커톤 시연용</p>}
      </div>
    </div>
  );
}

interface ScanOptions {
  title: string;
  subtitle?: string;
}

/** 스캔 모달 상태 관리 훅: run(fn) 동안 스캔 → 성공/실패 표시 후 자동 닫힘 */
export function useScanModal(mock = true) {
  const [state, setState] = useState<ScanModalProps>({ open: false, status: 'scanning', title: '' });

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, opts: ScanOptions): Promise<T> => {
      setState({ open: true, status: 'scanning', title: opts.title, subtitle: opts.subtitle, mock });
      try {
        const result = await fn();
        setState((s) => ({ ...s, status: 'success' }));
        await new Promise((r) => setTimeout(r, 600));
        setState((s) => ({ ...s, open: false }));
        return result;
      } catch (err) {
        setState((s) => ({ ...s, status: 'error', error: errorMessage(err, '검증 중 오류가 발생했습니다.') }));
        await new Promise((r) => setTimeout(r, 1600));
        setState((s) => ({ ...s, open: false }));
        throw err;
      }
    },
    [mock],
  );

  return { modal: <ScanModal {...state} />, run };
}
