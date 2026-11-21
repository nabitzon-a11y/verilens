import type { BehaviorSample, BehaviorVerdict } from '@/types';
import { VERIFY } from './constants';

/**
 * PiVerify 2단계 — 무자각 행동 감시 (클라이언트·서버 공용 순수 로직)
 *
 * 클라이언트: BehaviorMonitor 로 실시간 감지 → 경고 모달 + 재검증 트리거
 * 서버: evaluateBehavior / evaluateSetTiming 으로 제출된 기록을 다시 판정
 *       (클라이언트가 보낸 reactionMs 는 조작될 수 있으므로 서버 재판정이 최종 기준)
 */

/** 기록 전체에서 '초고속 클릭 연속 N회 이상'이 있었는지 판정 */
export function evaluateBehavior(samples: BehaviorSample[]): BehaviorVerdict {
  let streak = 0;
  let maxStreak = 0;
  for (const s of samples) {
    if (s.reactionMs < VERIFY.FAST_REACTION_MS) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }
  const suspicious = maxStreak >= VERIFY.FAST_STREAK_LIMIT;
  return {
    suspicious,
    fastStreak: streak,
    reason: suspicious
      ? `${VERIFY.FAST_REACTION_MS}ms 미만 초고속 응답이 연속 ${maxStreak}회 감지되었습니다.`
      : undefined,
  };
}

/**
 * 서버 측 시간 정합성 검사 (조작 탐지 — 재검증으로도 면제되지 않음)
 *  - 세트 발급~제출까지 실제 경과 시간이 클라이언트가 주장한 반응시간 합보다 짧으면 조작 의심
 *  - 문항 수 × 최소 반응시간보다도 짧게 끝났으면 매크로 의심
 */
export function evaluateTimingIntegrity(params: {
  issuedAtMs: number;
  submittedAtMs: number;
  samples: BehaviorSample[];
}): BehaviorVerdict {
  const { issuedAtMs, submittedAtMs, samples } = params;
  const elapsed = submittedAtMs - issuedAtMs;
  const claimed = samples.reduce((sum, s) => sum + s.reactionMs, 0);
  const TOLERANCE_MS = 1000;

  if (elapsed + TOLERANCE_MS < claimed) {
    return { suspicious: true, fastStreak: 0, reason: '보고된 반응시간이 실제 경과 시간보다 깁니다.' };
  }
  if (elapsed < samples.length * VERIFY.FAST_REACTION_MS) {
    return { suspicious: true, fastStreak: samples.length, reason: '세트가 비정상적으로 빠르게 제출되었습니다.' };
  }
  return { suspicious: false, fastStreak: 0 };
}

/** 시간 정합성 + 초고속 연속 클릭을 함께 판정 */
export function evaluateSetTiming(params: {
  issuedAtMs: number;
  submittedAtMs: number;
  samples: BehaviorSample[];
}): BehaviorVerdict {
  const integrity = evaluateTimingIntegrity(params);
  return integrity.suspicious ? integrity : evaluateBehavior(params.samples);
}

/** 클라이언트 실시간 감시기 */
export class BehaviorMonitor {
  private samples: BehaviorSample[] = [];
  private streak = 0;

  /** 문항 응답 1건 기록 → 현재 연속 초고속 클릭 기준 판정 반환 */
  record(sample: BehaviorSample): BehaviorVerdict {
    this.samples.push(sample);
    this.streak = sample.reactionMs < VERIFY.FAST_REACTION_MS ? this.streak + 1 : 0;

    const suspicious = this.streak >= VERIFY.FAST_STREAK_LIMIT;
    return {
      suspicious,
      fastStreak: this.streak,
      reason: suspicious ? '비정상 매크로 패턴이 감지되었습니다. 인간 재검증이 필요합니다.' : undefined,
    };
  }

  /** 재검증 통과 후 연속 카운트만 초기화 (기록은 서버 제출용으로 유지) */
  clearStreak(): void {
    this.streak = 0;
  }

  getSamples(): BehaviorSample[] {
    return [...this.samples];
  }

  reset(): void {
    this.samples = [];
    this.streak = 0;
  }
}
