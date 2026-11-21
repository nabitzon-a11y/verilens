import type { VerifySession } from '@/types';
import { api } from './apiClient';
import { VERIFY } from './constants';

/**
 * PiVerify 클라이언트 헬퍼 (브라우저 전용)
 * - 서버 검증 호출과 스캔 연출 시간을 병렬로 기다려, UI 는 await 한 번으로 처리 가능
 * - 판별 세션 토큰은 탭 단위(sessionStorage)로 보관 — 탭을 닫으면 다시 인간 검증
 */

const SESSION_KEY = 'vl_verify_session';
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function store(session: VerifySession | null) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* 무시 */
  }
}

/** 저장된 판별 세션 (만료되었거나 uid 가 다른 계정의 세션이면 null) */
export function getActiveSession(uid?: string): VerifySession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as VerifySession;
    if (session.stage === 'claim_reverify' || session.expiresAt <= Date.now() || (uid && session.uid !== uid)) {
      store(null);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/** 세션 남은 시간 (ms) */
export function getRemainingMs(session: VerifySession | null): number {
  return session ? Math.max(0, session.expiresAt - Date.now()) : 0;
}

export function clearVerifySession(): void {
  store(null);
}

/** 다른 계정의 판별 세션이 남아 있으면 제거 (계정 전환·재로그인 시) */
export function clearVerifySessionIfNotOwner(uid: string): void {
  const session = getActiveSession();
  if (session && session.uid !== uid) store(null);
}

/** 1단계: 판별 세션 시작 (1.5초 스캔 연출) */
export async function startHumanSession(proof?: string): Promise<VerifySession> {
  const [session] = await Promise.all([
    api<VerifySession>('/api/verify/session', { body: { proof } }),
    sleep(VERIFY.SESSION_SCAN_MS),
  ]);
  store(session);
  return session;
}

/** 2단계: 매크로 패턴 감지 후 재검증 */
export async function recheckHuman(proof?: string): Promise<VerifySession> {
  const current = getActiveSession();
  if (!current) return startHumanSession(proof);

  const [session] = await Promise.all([
    api<VerifySession>('/api/verify/recheck', { body: { token: current.token, proof } }),
    sleep(VERIFY.SESSION_SCAN_MS),
  ]);
  store(session);
  return session;
}

/** 3단계: 출금 직전 재검증 (1초 스캔 연출). 반환 토큰은 저장하지 않고 즉시 Claim 에 사용 */
export async function reverifyForClaim(proof?: string): Promise<VerifySession> {
  const [session] = await Promise.all([
    api<VerifySession>('/api/verify/claim', { body: { proof } }),
    sleep(VERIFY.CLAIM_SCAN_MS),
  ]);
  return session;
}
