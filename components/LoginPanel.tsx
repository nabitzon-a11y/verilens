'use client';

import { FlaskConical, Loader2, LogIn } from 'lucide-react';
import { useApp } from './AppProvider';

/** 비로그인 상태에서 보여주는 로그인 패널 (Pi 로그인 / 데모 체험) */
export function LoginPanel({ title = '로그인이 필요합니다' }: { title?: string }) {
  const { signIn, signingIn, error, demoAllowed, env } = useApp();

  return (
    <section className="card space-y-3 text-center">
      <h2 className="text-base font-bold text-white">{title}</h2>
      <p className="text-xs text-slate-400">
        {env === 'web'
          ? 'Pi Browser 에서 열면 Pi 계정으로 로그인할 수 있습니다.'
          : 'Pi 계정으로 로그인하고 인간 판별을 시작하세요.'}
      </p>

      <button type="button" className="btn-primary w-full" onClick={() => void signIn()} disabled={signingIn}>
        {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Pi 계정으로 로그인
      </button>

      {demoAllowed && (
        <button type="button" className="btn-ghost w-full" onClick={() => void signIn({ forceDemo: true })} disabled={signingIn}>
          <FlaskConical className="h-4 w-4 text-pi" />
          데모 계정으로 체험하기
        </button>
      )}

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  );
}
