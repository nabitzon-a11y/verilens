import 'server-only';
import type { AuthMode, AuthSessionPayload, PioneerUser } from '@/types';
import { signPayload, verifyPayload } from './crypto';
import { HttpError } from './http';
import { getRepository } from './repository';

/**
 * 로그인 세션 (Bearer 토큰 방식)
 *
 * 쿠키 대신 Authorization 헤더를 쓰는 이유:
 *  Pi Sandbox 는 앱을 sandbox.minepi.com 의 iframe 안에서 띄우므로,
 *  브라우저의 서드파티 쿠키 차단 정책에 걸려 세션 쿠키가 전달되지 않을 수 있습니다.
 */

const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthTokenPayload extends AuthSessionPayload {
  typ: 'auth';
}

export function issueAuthToken(uid: string, username: string, mode: AuthMode): string {
  const payload: AuthTokenPayload = { typ: 'auth', uid, username, mode, exp: Date.now() + AUTH_TTL_MS };
  return signPayload(payload);
}

/** 요청 헤더에서 세션 읽기 (없거나 위조/만료 시 null) */
export function readAuth(req: Request): AuthSessionPayload | null {
  const header = req.headers.get('authorization');
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;

  const payload = verifyPayload<AuthTokenPayload>(match[1]);
  if (!payload || payload.typ !== 'auth' || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    return null;
  }
  return { uid: payload.uid, username: payload.username, mode: payload.mode, exp: payload.exp };
}

/** 로그인 필수 라우트용 */
export async function requireUser(req: Request): Promise<{ auth: AuthSessionPayload; user: PioneerUser }> {
  const auth = readAuth(req);
  if (!auth) throw new HttpError(401, '로그인이 필요합니다.', 'UNAUTHORIZED');

  const user = await getRepository().getUser(auth.uid);
  if (!user) throw new HttpError(401, '사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', 'UNAUTHORIZED');

  return { auth, user };
}
