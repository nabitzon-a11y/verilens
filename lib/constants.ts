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

/**
 * 신뢰도(Trust Score, 0~1000) 규칙 — 개인 '인간 직관 능력치'
 *  - 아래 값은 '기본(raw) 변동폭'이며, 실제 반영 시 현재 등급의 gainRate / lossRate 가 곱해집니다.
 *  - 등급이 높을수록 오르기는 어렵고(gainRate↓) 실수의 대가는 커집니다(lossRate↑).
 */
export const TRUST = {
  SCALE: 1000,
  INITIAL: 300,
  MIN: 0,
  MAX: 1000,
  /** 하루 최대 신뢰도 상승 상한 (과도한 속도·노가다 방지, 감점은 상한 없음) */
  DAILY_GAIN_CAP: 25,
  /** 다수결 일치 1문항 */
  MATCH_DELTA: 8,
  /** 고난도(difficulty 3) 문항 일치 추가 점수 */
  HARD_MATCH_BONUS: 4,
  /** 세트 완벽 적중(기준 문항 통과 + 일반 문항 전부 일치) 추가 점수 */
  PERFECT_SET_BONUS: 8,
  /** 보너스 문제 정답 */
  BONUS_CORRECT_DELTA: 18,
  /** 보너스 문제 정답 최소 보장 점수 (최상위 등급에서도) */
  BONUS_MIN_DELTA: 5,
  /** 다수결 불일치 1문항 */
  MISMATCH_DELTA: -8,
  /** 기준 문항(Gold) 오답 */
  GOLD_FAIL_DELTA: -60,
  /** 매크로 패턴 감지 */
  BOT_FLAG_DELTA: -80,
  /** 구버전(0~100) 점수 → 1000점 환산 배율 */
  LEGACY_MULTIPLIER: 8,
} as const;

/** 신뢰도 등급 (minScore 내림차순) — 상위로 갈수록 획득률↓ · 감점률↑ · 대신 Pi 보상 배율↑ */
export const TRUST_TIERS = [
  { tier: 'master', label: 'Master', minScore: 950, gainRate: 0.12, lossRate: 2, rewardMult: 2.0 },
  { tier: 'diamond', label: 'Diamond', minScore: 850, gainRate: 0.2, lossRate: 1.7, rewardMult: 1.7 },
  { tier: 'platinum', label: 'Platinum', minScore: 700, gainRate: 0.35, lossRate: 1.4, rewardMult: 1.4 },
  { tier: 'gold', label: 'Gold', minScore: 550, gainRate: 0.55, lossRate: 1.2, rewardMult: 1.25 },
  { tier: 'silver', label: 'Silver', minScore: 400, gainRate: 0.8, lossRate: 1, rewardMult: 1.1 },
  { tier: 'bronze', label: 'Bronze', minScore: 0, gainRate: 1, lossRate: 0.8, rewardMult: 1.0 },
] as const;

export type TrustTierId = (typeof TRUST_TIERS)[number]['tier'];

/** 판별 세트 중 보너스 문제(AI 흔적 짚기)가 등장할 확률 */
export const BONUS = {
  CHANCE: 0.4,
} as const;

/** 데일리 퀘스트 & 연속 참여 마일스톤 보너스 */
export const QUEST = {
  DAILY_TRUST_BONUS: 10,
  STREAK_MILESTONES: [3, 7, 14, 30] as readonly number[],
  MILESTONE_TRUST_BONUS: 20,
  REFERRAL_TRUST_BONUS: 10,
} as const;

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

/** 다음 등급 정보 (최상위면 null) */
export function getNextTier(score: number) {
  const current = getTrustTier(score);
  const idx = TRUST_TIERS.findIndex((t) => t.tier === current.tier);
  if (idx <= 0) return null;
  const next = TRUST_TIERS[idx - 1];
  const span = next.minScore - current.minScore;
  return {
    tier: next.tier,
    label: next.label,
    minScore: next.minScore,
    remaining: Math.max(0, next.minScore - score),
    progress: span > 0 ? Math.min(1, Math.max(0, (score - current.minScore) / span)) : 1,
  };
}

/**
 * 현재 등급 배율을 적용한 신뢰도 변동 계산
 *  - rawGain(+)에는 gainRate, rawLoss(-)에는 lossRate 를 곱합니다.
 */
export function applyTrustChange(score: number, rawGain: number, rawLoss: number, flatGain = 0) {
  const tier = getTrustTier(score);
  const gain = Math.round(rawGain * tier.gainRate) + flatGain;
  const loss = Math.round(rawLoss * tier.lossRate);
  const next = clampTrust(score + gain + loss);
  return { next, delta: next - score };
}
