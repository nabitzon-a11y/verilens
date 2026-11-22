'use client';

import { FlaskConical } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from './AppProvider';

/** Pi Browser 밖(일반 웹) 또는 데모 계정일 때 상단에 표시되는 Demo Sandbox Mode 배너 + 토글 */
export function DemoBanner() {
  const { ready, env, demoActive, demoAllowed, setDemoMode, signingIn } = useApp();

  if (!ready || !demoAllowed) return null;
  if (env !== 'web' && !demoActive) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2 text-xs text-amber-900">
        <FlaskConical className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="flex-1 leading-tight">
          <b>Demo Sandbox Mode</b>
          <span className="block text-[11px] text-amber-700">
            {demoActive ? '가상 계정 · Mock 결제/검증으로 체험 중' : 'Pi Browser 로그인 시도 모드'}
          </span>
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={demoActive}
          aria-label="Demo Sandbox Mode 전환"
          disabled={signingIn}
          onClick={() => void setDemoMode(!demoActive)}
          className={clsx(
            'relative h-6 w-11 rounded-full transition disabled:opacity-50',
            demoActive ? 'bg-pi' : 'bg-slate-300',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
              demoActive ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </button>
      </div>
    </div>
  );
}
