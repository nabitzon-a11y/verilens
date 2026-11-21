import 'server-only';
import type { PiPaymentDTO } from '@/types';

/**
 * Pi Platform API 서버 전용 클라이언트
 * 문서: https://github.com/pi-apps/pi-platform-docs (platform_API.md)
 *
 * 🔒 PI_API_KEY 는 이 파일에서만 읽습니다. 'server-only' import 로 클라이언트 번들 포함을 차단합니다.
 */

export class PiApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'PiApiError';
  }
}

const REQUEST_TIMEOUT_MS = 10_000;
const PAYMENT_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const TXID_RE = /^[A-Za-z0-9_-]{1,200}$/;

function baseUrl(): string {
  return (process.env.PI_API_BASE_URL || 'https://api.minepi.com').replace(/\/+$/, '');
}

/** PI_API_KEY 설정 여부 (미설정 시 Mock Approval 모드) */
export function isPiApiConfigured(): boolean {
  return Boolean(process.env.PI_API_KEY?.trim());
}

export function isValidPaymentId(id: unknown): id is string {
  return typeof id === 'string' && PAYMENT_ID_RE.test(id);
}

export function isValidTxid(txid: unknown): txid is string {
  return typeof txid === 'string' && TXID_RE.test(txid);
}

type AuthMode = { type: 'key' } | { type: 'bearer'; token: string };

async function request<T>(
  path: string,
  { method = 'GET', body, auth }: { method?: 'GET' | 'POST'; body?: unknown; auth: AuthMode },
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth.type === 'key') {
    const key = process.env.PI_API_KEY?.trim();
    if (!key) throw new PiApiError(500, 'PI_API_KEY 가 설정되지 않았습니다.');
    headers.Authorization = `Key ${key}`;
  } else {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new PiApiError(502, `Pi Platform API 연결 실패: ${(err as Error).message}`);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) throw new PiApiError(res.status, `Pi Platform API 오류 (${res.status} ${path})`, data);
  return data as T;
}

const paymentPath = (paymentId: string, action = '') => {
  if (!isValidPaymentId(paymentId)) throw new PiApiError(400, '잘못된 결제 ID 형식입니다.');
  return `/v2/payments/${encodeURIComponent(paymentId)}${action}`;
};

/* ------------------------------------------------------------------ */

export interface PiMeResponse {
  uid: string;
  username?: string;
}

/** 클라이언트가 보낸 accessToken 을 Pi 서버에서 검증하고 사용자 정보를 가져옴 */
export function fetchPiUser(accessToken: string) {
  return request<PiMeResponse>('/v2/me', { auth: { type: 'bearer', token: accessToken } });
}

export function fetchPayment(paymentId: string) {
  return request<PiPaymentDTO>(paymentPath(paymentId), { auth: { type: 'key' } });
}

export function approvePayment(paymentId: string) {
  return request<PiPaymentDTO>(paymentPath(paymentId, '/approve'), { method: 'POST', auth: { type: 'key' } });
}

export function completePayment(paymentId: string, txid: string) {
  if (!isValidTxid(txid)) throw new PiApiError(400, '잘못된 txid 형식입니다.');
  return request<PiPaymentDTO>(paymentPath(paymentId, '/complete'), {
    method: 'POST',
    body: { txid },
    auth: { type: 'key' },
  });
}

export function cancelPayment(paymentId: string) {
  return request<PiPaymentDTO>(paymentPath(paymentId, '/cancel'), { method: 'POST', auth: { type: 'key' } });
}
