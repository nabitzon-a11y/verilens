import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * HMAC-SHA256 서명 토큰 유틸 (JWT 경량 대체)
 * 형식: base64url(JSON payload) + "." + base64url(HMAC)
 * 토큰 용도 혼용을 막기 위해 payload 에 반드시 `typ` 필드를 넣어 사용합니다.
 */

const DEV_FALLBACK_SECRET = 'verilens-dev-only-insecure-secret-DO-NOT-USE-IN-PROD';
let warned = false;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 32 && !secret.startsWith('change-me')) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET 환경변수를 32자 이상 무작위 문자열로 설정하세요.');
  }
  if (!warned) {
    console.warn('[crypto] SESSION_SECRET 미설정 — 개발용 임시 키를 사용합니다. (운영 배포 금지)');
    warned = true;
  }
  return DEV_FALLBACK_SECRET;
}

function hmac(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function signPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${hmac(body)}`;
}

/** 서명 검증 후 payload 반환. 위조/형식 오류 시 null (만료 검사는 호출 측 책임) */
export function verifyPayload<T>(token: string): T | null {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expected = Buffer.from(hmac(body));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 12): string {
  return randomBytes(bytes).toString('hex');
}
