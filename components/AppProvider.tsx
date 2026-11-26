'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { MeResponse, PaymentsMode, PioneerProfile } from '@/types';
import { UNAUTHORIZED_EVENT, api } from '@/lib/apiClient';
import { DEMO_MODE_ALLOWED } from '@/lib/constants';
import { errorMessage } from '@/lib/format';
import { LANG_STORAGE_KEY, LOCALE_OPTIONS, detectBrowserLocale, type Lang, type Locale } from '@/lib/i18n';
import {
  type PiEnvironment,
  detectEnvironment,
  loadPiSdk,
  setDemoPreference,
  shouldUseDemoMode,
  signIn as sdkSignIn,
  signInDemo,
  signOut as sdkSignOut,
} from '@/lib/piSdk';
import { clearVerifySession, clearVerifySessionIfNotOwner } from '@/lib/piVerifyClient';

interface AppState {
  ready: boolean;
  profile: PioneerProfile | null;
  paymentsMode: PaymentsMode;
  verifyMode: 'live' | 'mock';
  demoAllowed: boolean;
  env: PiEnvironment;
  /** 현재 데모 모드로 동작 중인지 */
  demoActive: boolean;
  signingIn: boolean;
  error: string | null;
  lang: Lang;
  locale: Locale;
  setLang: (lang: Lang) => void;
  setLocale: (locale: Locale) => void;
  signIn: (opts?: { forceDemo?: boolean }) => Promise<void>;
  signOut: () => void;
  setDemoMode: (on: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<PioneerProfile | null>(null);
  const [paymentsMode, setPaymentsMode] = useState<PaymentsMode>('mock');
  const [verifyMode, setVerifyMode] = useState<'live' | 'mock'>('mock');
  const [demoAllowed, setDemoAllowed] = useState(true);
  const [env, setEnv] = useState<PiEnvironment>('web');
  const [demoActive, setDemoActive] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocaleState] = useState<Locale>('ko');
  const lang: Lang = locale === 'ko' ? 'ko' : 'en';

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && LOCALE_OPTIONS.some((o) => o.id === saved)) {
        setLocaleState(saved as Locale);
      } else {
        const browserLang = window.navigator.languages?.[0] ?? window.navigator.language ?? '';
        if (browserLang) {
          setLocaleState(detectBrowserLocale(browserLang));
        }
      }
      const ref = new URLSearchParams(window.location.search).get('ref')?.trim();
      if (ref && ref.length <= 120) {
        window.localStorage.setItem('verilens_ref', ref);
      }
    } catch {
      /* 무시 */
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* 무시 */
    }
  }, []);

  const setLang = useCallback(
    (next: Lang) => {
      setLocale(next);
    },
    [setLocale],
  );

  const applyMe = useCallback((me: MeResponse) => {
    setPaymentsMode(me.paymentsMode);
    setVerifyMode(me.verifyMode);
    setDemoAllowed(me.demoAllowed);
    setProfile(me.profile);
    if (me.profile) setDemoActive(me.profile.isDemo);
  }, []);

  const refresh = useCallback(async () => {
    try {
      applyMe(await api<MeResponse>('/api/auth/me'));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [applyMe]);

  const signIn = useCallback(async (opts: { forceDemo?: boolean } = {}) => {
    setSigningIn(true);
    setError(null);
    try {
      const res = await sdkSignIn(opts);
      setProfile(res.profile);
      setPaymentsMode(res.paymentsMode);
      setDemoActive(res.mode === 'demo');
    } catch (err) {
      setError(errorMessage(err, '로그인에 실패했습니다.'));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    sdkSignOut();
    clearVerifySession();
    setProfile(null);
  }, []);

  /** Demo Sandbox Mode 토글 */
  const setDemoMode = useCallback(
    async (on: boolean) => {
      setDemoPreference(on);
      signOut();
      setDemoActive(on);
      if (on) await signIn({ forceDemo: true });
    },
    [signIn, signOut],
  );

  // 최초 진입: 환경 감지 → 기존 세션 복원 → (일반 웹이면) 데모 자동 로그인
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const detected = detectEnvironment();
      setEnv(detected);
      if (detected !== 'web') void loadPiSdk();

      try {
        const me = await api<MeResponse>('/api/auth/me');
        if (cancelled) return;
        applyMe(me);

        if (!me.profile && me.demoAllowed && shouldUseDemoMode()) {
          const res = await signInDemo();
          if (cancelled) return;
          setProfile(res.profile);
          setDemoActive(true);
        } else if (!me.profile) {
          setDemoActive(false);
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMe]);

  // 다른 계정의 PiVerify 세션이 남아 있으면 제거 (계정 전환·서버 초기화 대비)
  useEffect(() => {
    if (profile) clearVerifySessionIfNotOwner(profile.uid);
  }, [profile]);

  // 로그인 세션이 서버에서 거부되면(만료·서버 데이터 초기화 등) 로그아웃 처리 후 데모 모드면 자동 재로그인
  useEffect(() => {
    const onUnauthorized = () => {
      clearVerifySession();
      setProfile(null);
      if (DEMO_MODE_ALLOWED && shouldUseDemoMode()) {
        signInDemo()
          .then((res) => {
            setProfile(res.profile);
            setDemoActive(true);
          })
          .catch((err) => setError(errorMessage(err)));
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      profile,
      paymentsMode,
      verifyMode,
      demoAllowed,
      env,
      demoActive,
      signingIn,
      error,
      lang,
      locale,
      setLang,
      setLocale,
      signIn,
      signOut,
      setDemoMode,
      refresh,
    }),
    [ready, profile, paymentsMode, verifyMode, demoAllowed, env, demoActive, signingIn, error, lang, locale, setLang, setLocale, signIn, signOut, setDemoMode, refresh],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp 은 AppProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
