import type {
  IncompletePaymentResponse,
  PaymentCompleteResponse,
  PaymentsMode,
  PiAuthResult,
  PiPaymentDTO,
  PiSdk,
  SignInResponse,
} from '@/types';
import { ApiError, api, setAuthToken } from './apiClient';
import { DEMO_MODE_ALLOWED, PI_SANDBOX, WALLET } from './constants';

/**
 * Pi SDK 클라이언트 래퍼 (브라우저 전용)
 *
 * ▸ 환경 감지: Pi Browser / Pi Sandbox(iframe) / 일반 웹
 *   pi-sdk.js 는 일반 Chrome 에서도 window.Pi 를 만들어 두기 때문에
 *   "window.Pi 존재 여부"만으로는 Pi Browser 를 구분할 수 없습니다.
 *   → User-Agent + iframe 여부로 판단하고, 인증 응답이 없으면 타임아웃 처리합니다.
 * ▸ 일반 웹에서는 Demo Sandbox Mode(가상 로그인 + Mock 결제)로 자동 전환합니다.
 */

export const PI_SDK_URL = 'https://sdk.minepi.com/pi-sdk.js';

const SDK_LOAD_TIMEOUT_MS = 8_000;
const AUTH_TIMEOUT_MS = 15_000;
const DEMO_PREF_KEY = 'vl_demo_mode';

export type PiEnvironment = 'pi-browser' | 'pi-sandbox' | 'web';

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------------------------------------------ */
/* 환경 감지 & 데모 모드                                               */
/* ------------------------------------------------------------------ */

export function detectEnvironment(): PiEnvironment {
  if (typeof window === 'undefined') return 'web';
  if (/PiBrowser/i.test(navigator.userAgent)) return 'pi-browser';

  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true; // cross-origin 부모 → iframe 안
  }
  return PI_SANDBOX && inIframe ? 'pi-sandbox' : 'web';
}

export function isDemoModeAllowed(): boolean {
  return DEMO_MODE_ALLOWED;
}

/** 사용자가 토글로 지정한 데모 모드 선호값 (지정 안 했으면 null) */
export function getDemoPreference(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(DEMO_PREF_KEY);
    return v === null ? null : v === 'true';
  } catch {
    return null;
  }
}

export function setDemoPreference(on: boolean | null): void {
  try {
    if (on === null) window.localStorage.removeItem(DEMO_PREF_KEY);
    else window.localStorage.setItem(DEMO_PREF_KEY, String(on));
  } catch {
    /* 무시 */
  }
}

/** 데모 모드로 동작해야 하는지 (토글 우선, 없으면 일반 웹일 때 자동 데모) */
export function shouldUseDemoMode(): boolean {
  if (!DEMO_MODE_ALLOWED) return false;
  const pref = getDemoPreference();
  if (pref !== null) return pref;
  return detectEnvironment() === 'web';
}

/* ------------------------------------------------------------------ */
/* SDK 로드 & 초기화                                                   */
/* ------------------------------------------------------------------ */

let sdkPromise: Promise<PiSdk | null> | null = null;
let initPromise: Promise<void> | null = null;
/** 현재 페이지 로드에서 Pi.authenticate(['username','payments']) 를 통과했는지 */
let piAuthenticated = false;

/** pi-sdk.js 를 (layout 에서 이미 로드되지 않았다면) 동적으로 삽입하고 window.Pi 를 반환 */
export function loadPiSdk(): Promise<PiSdk | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Pi) return Promise.resolve(window.Pi);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<PiSdk | null>((resolve) => {
    const done = () => resolve(window.Pi ?? null);
    const timer = setTimeout(done, SDK_LOAD_TIMEOUT_MS);

    let script = document.querySelector<HTMLScriptElement>(`script[src="${PI_SDK_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = PI_SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => {
      clearTimeout(timer);
      done();
    });
    script.addEventListener('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
  }).then((pi) => {
    if (!pi) sdkPromise = null; // 실패 시 다음 호출에서 재시도
    return pi;
  });

  return sdkPromise;
}

async function getInitializedPi(): Promise<PiSdk> {
  const Pi = await loadPiSdk();
  if (!Pi) throw new Error('Pi SDK 를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.');
  if (!initPromise) {
    initPromise = Promise.resolve(Pi.init({ version: '2.0', sandbox: PI_SANDBOX })).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  return Pi;
}

/* ------------------------------------------------------------------ */
/* 인증                                                                */
/* ------------------------------------------------------------------ */

/**
 * onIncompletePaymentFound 는 Pi.authenticate 도중(=앱 로그인 전)에 호출됩니다.
 * 앱 세션 토큰이 아직 없으므로 대기열에 넣었다가 로그인 직후 서버로 보냅니다.
 */
const pendingIncomplete: PiPaymentDTO[] = [];

function onIncompletePaymentFound(payment: PiPaymentDTO) {
  if (payment?.identifier && !pendingIncomplete.some((p) => p.identifier === payment.identifier)) {
    pendingIncomplete.push(payment);
  }
}

async function flushIncompletePayments(): Promise<IncompletePaymentResponse[]> {
  const results: IncompletePaymentResponse[] = [];
  while (pendingIncomplete.length) {
    const payment = pendingIncomplete.shift()!;
    try {
      results.push(
        await api<IncompletePaymentResponse>('/api/payments/incomplete', {
          body: { paymentId: payment.identifier },
        }),
      );
    } catch (err) {
      console.warn('[piSdk] 미완료 결제 복구 실패', payment.identifier, err);
    }
  }
  return results;
}

async function authenticateWithPi(): Promise<PiAuthResult> {
  const Pi = await getInitializedPi();
  const res = await withTimeout(
    Pi.authenticate(['username', 'payments'], onIncompletePaymentFound),
    AUTH_TIMEOUT_MS,
    'Pi 인증 응답이 없습니다. Pi Browser 에서 앱을 열었는지 확인해 주세요.',
  );
  piAuthenticated = true;
  return res;
}

export interface SignInResult extends SignInResponse {
  mode: 'pi' | 'demo';
  recoveredPayments: IncompletePaymentResponse[];
}

export async function signInDemo(): Promise<SignInResult> {
  const res = await api<SignInResponse>('/api/auth/demo', { body: {} });
  setAuthToken(res.token);
  return { ...res, mode: 'demo', recoveredPayments: [] };
}

/** 환경에 맞춰 Pi 로그인 또는 데모 로그인 */
export async function signIn(opts: { forceDemo?: boolean } = {}): Promise<SignInResult> {
  if (opts.forceDemo || shouldUseDemoMode()) return signInDemo();

  const auth = await authenticateWithPi();
  const res = await api<SignInResponse>('/api/auth/signin', {
    body: { accessToken: auth.accessToken },
    auth: false,
  });
  setAuthToken(res.token);
  const recoveredPayments = await flushIncompletePayments();
  return { ...res, mode: 'pi', recoveredPayments };
}

export function signOut(): void {
  piAuthenticated = false;
  setAuthToken(null);
}

/* ------------------------------------------------------------------ */
/* 결제 (U2A: 의뢰자 문항 등록 수수료)                                 */
/* ------------------------------------------------------------------ */

export interface SubmissionPaymentParams {
  draftId: string;
  memo?: string;
  lang?: 'ko' | 'en';
  /** /api/auth/me 의 paymentsMode */
  paymentsMode: PaymentsMode;
  /** 현재 로그인이 데모 계정인지 */
  isDemoUser: boolean;
  /** 진행 단계 표시용 콜백 (UI) */
  onStage?: (stage: 'creating' | 'approving' | 'signing' | 'completing') => void;
}

export async function paySubmissionFee(params: SubmissionPaymentParams): Promise<PaymentCompleteResponse> {
  const en = params.lang === 'en';
  const memo = params.memo ?? (en ? 'VeriLens Verification Submission' : 'VeriLens 판별 문항 등록');
  const useMock = params.paymentsMode === 'mock' || params.isDemoUser;
  return useMock
    ? payWithMock(params.draftId, memo, params.onStage)
    : payWithPi(params.draftId, memo, params.onStage, en);
}

/** Mock 결제: 실제 Pi 흐름과 동일하게 approve → (지갑 서명 연출) → complete 서버 라우트를 탑니다 */
async function payWithMock(
  draftId: string,
  memo: string,
  onStage?: SubmissionPaymentParams['onStage'],
): Promise<PaymentCompleteResponse> {
  onStage?.('creating');
  const paymentId = `mock_${uuid()}`;

  onStage?.('approving');
  await api('/api/payments/approve', {
    body: { paymentId, mock: { draftId, amount: WALLET.SUBMISSION_FEE_PI, memo } },
  });

  onStage?.('signing');
  await sleep(900);

  onStage?.('completing');
  const txid = `mocktx_${uuid().replace(/-/g, '')}`;
  return api<PaymentCompleteResponse>('/api/payments/complete', { body: { paymentId, txid } });
}

/** 실제 Pi 결제 */
async function payWithPi(
  draftId: string,
  memo: string,
  onStage?: SubmissionPaymentParams['onStage'],
  en = false,
): Promise<PaymentCompleteResponse> {
  const Pi = await getInitializedPi();
  // 페이지를 새로고침해 localStorage 로그인만 복원된 경우에도 SDK 에 payments 권한을 다시 연결
  if (!piAuthenticated) {
    await authenticateWithPi();
    await flushIncompletePayments();
  }
  onStage?.('creating');

  return new Promise<PaymentCompleteResponse>((resolve, reject) => {
    Pi.createPayment(
      {
        amount: WALLET.SUBMISSION_FEE_PI,
        memo,
        metadata: { kind: 'mission_submission', draftId },
      },
      {
        onReadyForServerApproval: (paymentId) => {
          onStage?.('approving');
          api('/api/payments/approve', { body: { paymentId } })
            .then(() => onStage?.('signing'))
            .catch(reject);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          onStage?.('completing');
          api<PaymentCompleteResponse>('/api/payments/complete', { body: { paymentId, txid } })
            .then(resolve)
            .catch(reject);
        },
        onCancel: (paymentId) => {
          api('/api/payments/cancel', { body: { paymentId } }).catch(() => undefined);
          reject(new ApiError(0, en ? 'Payment was cancelled.' : '결제가 취소되었습니다.', 'PAYMENT_CANCELLED'));
        },
        onError: (error, payment) => {
          if (payment?.identifier) {
            api('/api/payments/cancel', { body: { paymentId: payment.identifier } }).catch(() => undefined);
          }
          reject(error instanceof Error ? error : new Error(en ? 'Payment error occurred.' : '결제 중 오류가 발생했습니다.'));
        },
      },
    );
  });
}

/* ------------------------------------------------------------------ */
/* 공유 (PiNet 딥링크)                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_PINET_URL = 'https://verilens1759.pinet.com';

/** 공유 링크 기본 주소: 환경변수 PiNet 주소 > 기본 PiNet 주소 > 앱 URL */
export function buildShareUrl(path = '/'): string {
  const base =
    process.env.NEXT_PUBLIC_PINET_URL ||
    DEFAULT_PINET_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Pi 공유 다이얼로그 → Web Share API → 클립보드 순서로 시도 */
export async function shareLink(title: string, message: string, url: string): Promise<'pi' | 'native' | 'clipboard' | 'failed'> {
  const text = `${message}\n${url}`;

  if (detectEnvironment() !== 'web') {
    try {
      const Pi = await getInitializedPi();
      if (Pi.openShareDialog) {
        Pi.openShareDialog(title, text);
        return 'pi';
      }
    } catch {
      /* 다음 방법으로 */
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: message, url });
      return 'native';
    } catch {
      /* 사용자가 취소했거나 미지원 → 클립보드 */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  } catch {
    return 'failed';
  }
}
