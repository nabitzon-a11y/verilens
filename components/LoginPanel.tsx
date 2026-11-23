'use client';

import { FlaskConical, Loader2, LogIn } from 'lucide-react';
import { LOGIN_TEXT } from '@/lib/i18n';
import { useApp } from './AppProvider';

/** 비로그인 상태에서 보여주는 로그인 패널 (Pi 로그인 / 데모 체험) */
export function LoginPanel({ title }: { title?: string }) {
  const { signIn, signingIn, error, demoAllowed, env, lang } = useApp();
  const t = LOGIN_TEXT[lang];

  return (
    <section className="card space-y-3 text-center">
      <h2 className="text-lg font-bold text-slate-900">{title ?? t.defaultTitle}</h2>
      <p className="text-sm text-slate-500">{env === 'web' ? t.webHint : t.piBrowserHint}</p>

      {env === 'web' && demoAllowed ? (
        <>
          <button type="button" className="btn-primary w-full" onClick={() => void signIn({ forceDemo: true })} disabled={signingIn}>
            {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4 text-pi" />}
            {lang === 'en' ? 'Try Demo Now (No Pi Account Needed)' : '데모 계정으로 바로 체험하기'}
          </button>
          <button type="button" className="btn-ghost w-full text-sm" onClick={() => void signIn()} disabled={signingIn}>
            <LogIn className="h-4 w-4" />
            {t.piLoginBtn} (Pi Browser)
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn-primary w-full" onClick={() => void signIn()} disabled={signingIn}>
            {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {t.piLoginBtn}
          </button>
          {demoAllowed && (
            <button type="button" className="btn-ghost w-full" onClick={() => void signIn({ forceDemo: true })} disabled={signingIn}>
              <FlaskConical className="h-4 w-4 text-pi-light" />
              {t.demoBtn}
            </button>
          )}
        </>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
