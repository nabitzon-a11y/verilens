import 'server-only';
import { createHash } from 'crypto';
import type { Choice, Mission, VoteTally } from '@/types';
import { GAME } from './constants';
import { getRepository } from './repository';

/**
 * 10인 다수결 합의 (Consensus)
 *  패널 = 기존 응답 9건 + 본인 1건
 *  - 시드 문항: data/missions.ts 의 priorVotes(4건)를 문항 성향에 맞게 9건으로 확장
 *  - 의뢰자 문항: 실제 누적 응답 중 최근 9건, 부족하면 결정적 가상 응답으로 채움
 */

const PRIOR_PANEL = GAME.CONSENSUS_PANEL_SIZE - 1;

export function tallyVotes(votes: Choice[]): VoteTally {
  return votes.reduce<VoteTally>((t, v) => ({ ...t, [v]: t[v] + 1 }), { A: 0, B: 0 });
}

/** 과반(CONSENSUS_MAJORITY 이상) 득표한 쪽. 동률·과반 미달 시 null */
export function decideConsensus(tally: VoteTally): Choice | null {
  if (tally.A >= GAME.CONSENSUS_MAJORITY && tally.A > tally.B) return 'A';
  if (tally.B >= GAME.CONSENSUS_MAJORITY && tally.B > tally.A) return 'B';
  return null;
}

/** missionId 기반 결정적 가상 응답 (같은 문항은 항상 같은 가상 응답) */
function simulatedVotes(missionId: string, count: number): Choice[] {
  const digest = createHash('sha256').update(`verilens:${missionId}`).digest();
  return Array.from({ length: count }, (_, i) => (digest[i] % 2 === 0 ? 'A' : 'B'));
}

export async function getPriorVotes(mission: Mission): Promise<Choice[]> {
  if (mission.origin === 'seed') {
    const base = mission.priorVotes;
    if (base.length >= PRIOR_PANEL) return base.slice(0, PRIOR_PANEL);
    // 기준 문항은 전원 정답, 일반 시드 문항은 기존 다수 성향(3:1 / 2:2)을 유지하며 9표로 확장
    const extra: Choice[] = [];
    for (let i = base.length; i < PRIOR_PANEL; i++) {
      extra.push(base[i % base.length] ?? mission.humanSide ?? 'A');
    }
    return [...base, ...extra];
  }

  const recent = (await getRepository().getVotes(mission.id)).slice(-PRIOR_PANEL);
  return [...recent, ...simulatedVotes(mission.id, PRIOR_PANEL - recent.length)];
}
