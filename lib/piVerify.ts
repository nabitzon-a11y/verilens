import 'server-only';
import type { VerifyResult, VerifySession, VerifyStage } from '@/types';
import { VERIFY } from './constants';
import { randomToken, signPayload, verifyPayload } from './crypto';

/**
 * PiVerify 어댑터 (서버 전용)
 *
 * 3단계 세션 기반 인간 증명
 *  1단계 session_entry     : 판별 세션 진입 시 생체·고유성 검증 → 1시간 세션 토큰
 *  2단계 behavior_recheck  : 매크로 패턴 감지 시 재검증 → 세션 토큰 재발급
 *  3단계 claim_reverify    : 보상 출금 직전 재검증 → 2분짜리 1회성 출금 토큰
 *
 * ⚠️ 실제 PiVerify API 사양은 아직 공개 문서로 확인하지 못했습니다.
 *    LivePiVerifyAdapter 를 구현할 때 `proof`(클라이언트 검증 결과 ID 등)를
 *    PiVerify 서버에 조회해 검증하도록 교체하면 나머지 코드는 그대로 동작합니다.
 */

export interface PiVerifyAdapter {
  readonly name: string;
  readonly mock: boolean;

  /** 1단계: 세션 진입 */
  startSession(uid: string, proof?: string): Promise<VerifyResult>;
  /** 2단계: 행동 이상 감지 후 재검증 (기존 토큰 소유자 확인 필요) */
  recheck(uid: string, previousToken: string, proof?: string): Promise<VerifyResult>;
  /** 3단계: 출금 직전 재검증 */
  reverifyForClaim(uid: string, proof?: string): Promise<VerifyResult>;
  /** 토큰 검증 (서명·만료·소유자·단계) */
  validate(token: string, uid: string, allowedStages?: VerifyStage[]): VerifySession | null;
}

interface VerifyTokenPayload {
  typ: 'verify';
  uid: string;
  stage: VerifyStage;
  iat: number;
  exp: number;
  nonce: string;
  lv: number;
  uq: number;
  mock: boolean;
}

/** 해커톤 시연용 Mock 어댑터 — 항상 통과하되, 토큰은 실제로 서명·검증합니다. */
export class MockPiVerifyAdapter implements PiVerifyAdapter {
  readonly name = 'mock-piverify';
  readonly mock = true;

  private issue(uid: string, stage: VerifyStage, ttlMs: number): VerifySession {
    const iat = Date.now();
    const payload: VerifyTokenPayload = {
      typ: 'verify',
      uid,
      stage,
      iat,
      exp: iat + ttlMs,
      nonce: randomToken(8),
      // 시연용 점수 (실제 연동 시 PiVerify 응답값 사용)
      lv: Math.round((0.95 + Math.random() * 0.049) * 1000) / 1000,
      uq: Math.round((0.96 + Math.random() * 0.039) * 1000) / 1000,
      mock: true,
    };
    return this.toSession(signPayload(payload), payload);
  }

  private toSession(token: string, p: VerifyTokenPayload): VerifySession {
    return {
      token,
      uid: p.uid,
      stage: p.stage,
      issuedAt: p.iat,
      expiresAt: p.exp,
      livenessScore: p.lv,
      uniquenessScore: p.uq,
      mock: p.mock,
    };
  }

  private decode(token: string): VerifyTokenPayload | null {
    const p = verifyPayload<VerifyTokenPayload>(token);
    return p && p.typ === 'verify' ? p : null;
  }

  async startSession(uid: string): Promise<VerifyResult> {
    return { ok: true, session: this.issue(uid, 'session_entry', VERIFY.SESSION_TTL_MS) };
  }

  async recheck(uid: string, previousToken: string): Promise<VerifyResult> {
    const prev = this.decode(previousToken);
    // 만료는 허용하되(세션 도중 만료 가능), 타인의 토큰이나 위조 토큰은 거부
    if (!prev || prev.uid !== uid) return { ok: false, reason: '유효하지 않은 세션 토큰입니다.' };
    return { ok: true, session: this.issue(uid, 'behavior_recheck', VERIFY.SESSION_TTL_MS) };
  }

  async reverifyForClaim(uid: string): Promise<VerifyResult> {
    return { ok: true, session: this.issue(uid, 'claim_reverify', VERIFY.CLAIM_TOKEN_TTL_MS) };
  }

  validate(token: string, uid: string, allowedStages?: VerifyStage[]): VerifySession | null {
    const p = this.decode(token);
    if (!p || p.uid !== uid || p.exp < Date.now()) return null;
    if (allowedStages && !allowedStages.includes(p.stage)) return null;
    return this.toSession(token, p);
  }
}

/** 판별 세션으로 인정되는 단계 (1단계 진입 또는 2단계 재검증) */
export const SESSION_STAGES: VerifyStage[] = ['session_entry', 'behavior_recheck'];

type G = typeof globalThis & { __verilensPiVerify?: PiVerifyAdapter };

export function getPiVerifyAdapter(): PiVerifyAdapter {
  const g = globalThis as G;
  // TODO: PiVerify 공식 API 공개 후 환경변수(예: PIVERIFY_API_KEY) 존재 시 LivePiVerifyAdapter 반환
  if (!g.__verilensPiVerify) g.__verilensPiVerify = new MockPiVerifyAdapter();
  return g.__verilensPiVerify;
}
