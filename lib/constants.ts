/**
 * VeriLens 게임/정산 규칙 상수
 * - 모든 수치는 서버와 클라이언트가 공유하는 단일 기준입니다.
 * - 보상/판정 로직은 반드시 서버에서 이 값을 기준으로 재계산합니다.
 */

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'VeriLens';

/** 판별 게임 규칙 */
export const GAME = {
  /** 1세트 문항 수 */
  QUESTIONS_PER_SET: 5,
  /** 세트당 숨김 기준 문항(Gold Standard) 수 */
  GOLD_PER_SET: 1,
  /** 다수결 합의 패널 인원 (본인 1 + 기존 응답 9 = 10인) */
  CONSENSUS_PANEL_SIZE: 10,
  /** 합의 확정에 필요한 최소 동일 응답 수 (10명 중 6명 이상, 5:5 동률 시 미확정) */
  CONSENSUS_MAJORITY: 6,
  /** 의뢰자 문항 자동 마감 목표 실제 응답 수 */
  REQUESTER_TARGET_VOTES: 10,
  /** 다수결 일치 1문항당 보상 (Pi) */
  REWARD_PER_MATCH_PI: 0.005,
} as const;

/** 신뢰도(Trust Score, 0~100) 규칙 */
export const TRUST = {
  INITIAL: 50,
  MIN: 0,
  MAX: 100,
  /** 다수결 일치 시 */
  MATCH_DELTA: 2,
  /** 다수결 불일치 시 */
  MISMATCH_DELTA: -1,
  /** 기준 문항(Gold) 오답 시 */
  GOLD_FAIL_DELTA: -10,
  /** 매크로 패턴 감지 시 */
  BOT_FLAG_DELTA: -5,
} as const;

/** 신뢰도 등급 (minScore 내림차순) */
export const TRUST_TIERS = [
  { tier: 'platinum', label: 'Platinum', minScore: 90 },
  { tier: 'gold', label: 'Gold', minScore: 70 },
  { tier: 'silver', label: 'Silver', minScore: 40 },
  { tier: 'bronze', label: 'Bronze', minScore: 0 },
] as const;

/** PiVerify 3단계 세션 보안 규칙 */
export const VERIFY = {
  /** 1단계: 세션 토큰 유효시간 (1시간) */
  SESSION_TTL_MS: 60 * 60 * 1000,
  /** 1단계: 세션 진입 스캔 연출 시간 */
  SESSION_SCAN_MS: 1500,
  /** 2단계: 이 값(ms) 미만 반응은 '초고속 클릭'으로 간주 */
  FAST_REACTION_MS: 300,
  /** 2단계: 초고속 클릭이 연속 N회 이상이면 매크로 의심 */
  FAST_STREAK_LIMIT: 2,
  /** 3단계: 출금(Claim) 재검증 스캔 연출 시간 */
  CLAIM_SCAN_MS: 1000,
  /** 3단계: 출금 재검증 토큰 유효시간 (2분, 1회성 용도) */
  CLAIM_TOKEN_TTL_MS: 2 * 60 * 1000,
} as const;

/** Pi Browser 밖에서 Demo Sandbox Mode 허용 여부 (빌드 시 인라인) */
export const DEMO_MODE_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE !== 'false';

/** Pi SDK 샌드박스 모드 (빌드 시 인라인) */
export const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false';

/** 지갑/결제 규칙 */
export const WALLET = {
  /** 최소 출금(Claim) 기준 (데모용) */
  MIN_CLAIM_PI: 0.01,
  /** 의뢰자 문항 등록 수수료 (Test-Pi) */
  SUBMISSION_FEE_PI: 1,
  /** Pi 금액 표시/저장 소수점 자릿수 */
  DECIMALS: 4,
} as const;

/** 부동소수점 오차 방지를 위한 Pi 금액 반올림 */
export function roundPi(value: number): number {
  const f = 10 ** WALLET.DECIMALS;
  return Math.round(value * f) / f;
}

/** 신뢰도 점수 → 등급 */
export function getTrustTier(score: number) {
  return TRUST_TIERS.find((t) => score >= t.minScore) ?? TRUST_TIERS[TRUST_TIERS.length - 1];
}

/** 신뢰도 점수 범위 보정 */
export function clampTrust(score: number): number {
  return Math.max(TRUST.MIN, Math.min(TRUST.MAX, Math.round(score)));
}
