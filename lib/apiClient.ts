import type { ApiResponse } from '@/types';

/**
 * 클라이언트 → 서버 API 호출 래퍼
 * - 로그인 토큰을 Authorization: Bearer 헤더로 자동 첨부
 * - { ok, data | error } 응답 형식을 풀어서 data 만 반환, 실패 시 ApiError throw
 */

const TOKEN_KEY = 'vl_auth_token';

/** 로그인 세션이 서버에서 거부되었을 때 발생하는 브라우저 이벤트 (AppProvider 가 수신) */
export const UNAUTHORIZED_EVENT = 'vl:unauthorized';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* 저장소 접근 불가(사생활 보호 모드 등) 시 무시 */
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** false 면 토큰을 첨부하지 않음 */
  auth?: boolean;
  signal?: AbortSignal;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = opts.body === undefined ? 'GET' : 'POST', body, auth = true, signal } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getAuthToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal,
    });
  } catch {
    throw new ApiError(0, '네트워크 연결을 확인해 주세요.', 'NETWORK');
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    /* 비 JSON 응답 */
  }

  if (!json) throw new ApiError(res.status, `서버 응답을 해석할 수 없습니다. (${res.status})`, 'BAD_RESPONSE');
  if (!json.ok) {
    // 로그인 세션 자체가 무효일 때만 토큰 정리 (VERIFY_REQUIRED 등 PiVerify 401 은 로그인 유지)
    if (res.status === 401 && json.code === 'UNAUTHORIZED' && token) {
      setAuthToken(null);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, json.error, json.code);
  }
  return json.data;
}
