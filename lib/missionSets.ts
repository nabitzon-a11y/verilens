import 'server-only';
import { randomInt, randomUUID } from 'crypto';
import type {
  AnswerInput,
  Mission,
  MissionResult,
  MissionSet,
  PioneerUser,
  PublicMissionSet,
  SetResult,
} from '@/types';
import { toPublicMission } from '@/data/missions';
import { evaluateBehavior, evaluateTimingIntegrity } from './behavior';
import { decideConsensus, getPriorVotes, tallyVotes } from './consensus';
import { GAME, TRUST, VERIFY, clampTrust, roundPi } from './constants';
import { HttpError } from './http';
import { withLock } from './lock';
import { SESSION_STAGES, getPiVerifyAdapter } from './piVerify';
import { getRepository } from './repository';

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** KST 기준 YYYY-MM-DD */
function kstDate(offsetDays = 0): string {
  return new Date(Date.now() + 9 * 3600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

function nextStreak(user: PioneerUser): number {
  const today = kstDate();
  if (user.lastActiveDate === today) return Math.max(1, user.streak);
  if (user.lastActiveDate === kstDate(-1)) return user.streak + 1;
  return 1;
}

/** 상위 N% (시연용 추정치: 정확도 + 약간의 변동) */
function estimateTopPercent(matched: number, total: number): number {
  const accuracy = total ? matched / total : 0;
  const jitter = randomInt(7) - 3;
  return Math.max(1, Math.min(99, Math.round(100 - accuracy * 88 + jitter)));
}

function requireVerifySession(token: string, uid: string) {
  const session = getPiVerifyAdapter().validate(token, uid, SESSION_STAGES);
  if (!session) {
    throw new HttpError(401, '인간 판별 세션이 만료되었습니다. 다시 인증해 주세요.', 'VERIFY_REQUIRED');
  }
  return session;
}

/* ------------------------------------------------------------------ */
/* 세트 발급                                                           */
/* ------------------------------------------------------------------ */

/**
 * 5문항 세트 구성
 *  - 기준 문항(Gold) 1개를 무작위 위치에 숨김 배치
 *  - 도전장 문항(challenge)이 있으면 우선 포함
 *  - 결제된 의뢰자 문항을 최대 2개 우선 포함 (등록 즉시 판별되도록)
 *  - 본인이 의뢰한 문항도 노출되지만, 제출 시 보상·실투표에서 제외 */
export async function issueMissionSet(
  user: PioneerUser,
  verifyToken: string,
  challengeId?: string,
): Promise<PublicMissionSet> {
  requireVerifySession(verifyToken, user.uid);
  const repo = getRepository();

  const active = await repo.listMissions({ status: 'active' });
  const golds = active.filter((m) => m.isGold && m.humanSide);
  // 본인 의뢰 문항도 노출(등록 즉시 확인 가능)하되, 제출 시 보상·실투표에서 제외
  const regular = active.filter((m) => !m.isGold);

  if (golds.length < GAME.GOLD_PER_SET || regular.length === 0) {
    throw new HttpError(503, '판별 가능한 문항이 부족합니다.', 'NOT_ENOUGH_MISSIONS');
  }

  const need = GAME.QUESTIONS_PER_SET - GAME.GOLD_PER_SET;
  const picked: Mission[] = [];

  const challenge = challengeId ? regular.find((m) => m.id === challengeId) : undefined;
  if (challenge) picked.push(challenge);

  const requesterFirst = shuffle(regular.filter((m) => m.origin === 'requester' && !picked.includes(m))).slice(0, 2);
  picked.push(...requesterFirst);

  for (const m of shuffle(regular.filter((m) => !picked.includes(m)))) {
    if (picked.length >= need) break;
    picked.push(m);
  }

  const ordered = shuffle(picked.slice(0, need));
  const gold = golds[randomInt(golds.length)];
  ordered.splice(randomInt(ordered.length + 1), 0, gold);

  const set: MissionSet = {
    setId: randomUUID(),
    uid: user.uid,
    missionIds: ordered.map((m) => m.id),
    verifyToken,
    issuedAt: new Date().toISOString(),
  };
  await repo.saveSet(set);

  return { setId: set.setId, missions: ordered.map(toPublicMission) };
}

/* ------------------------------------------------------------------ */
/* 세트 제출 & 판정                                                    */
/* ------------------------------------------------------------------ */

export async function submitMissionSet(
  uid: string,
  input: { setId: string; verifyToken: string; answers: AnswerInput[] },
): Promise<SetResult> {
  const repo = getRepository();

  return withLock(`set:${input.setId}`, async () => {
    const set = await repo.getSet(input.setId);
    if (!set || set.uid !== uid) throw new HttpError(404, '판별 세트를 찾을 수 없습니다.', 'SET_NOT_FOUND');
    if (set.result) return set.result; // 중복 제출 → 기존 결과 (보상 중복 없음)

    const verifySession = requireVerifySession(input.verifyToken, uid);

    // 답안 구성 검증: 세트의 모든 문항에 정확히 1개씩
    const answerMap = new Map(input.answers.map((a) => [a.missionId, a]));
    if (answerMap.size !== input.answers.length || set.missionIds.some((id) => !answerMap.has(id)) || answerMap.size !== set.missionIds.length) {
      throw new HttpError(400, '세트의 모든 문항에 한 번씩 답해야 합니다.', 'BAD_ANSWERS');
    }

    const submittedAtMs = Date.now();
    const issuedAtMs = Date.parse(set.issuedAt);
    const samples = set.missionIds.map((id) => ({
      missionId: id,
      reactionMs: answerMap.get(id)!.reactionMs,
      at: submittedAtMs,
    }));

    // 2단계 행동 판정 (서버 재판정이 최종)
    const integrity = evaluateTimingIntegrity({ issuedAtMs, submittedAtMs, samples });
    const behavior = evaluateBehavior(samples);
    const rechecked = verifySession.stage === 'behavior_recheck' && verifySession.issuedAt >= issuedAtMs;
    const flagged = integrity.suspicious || (behavior.suspicious && !rechecked);
    const flagReason = integrity.suspicious ? integrity.reason : flagged ? behavior.reason : undefined;

    // 문항별 판정
    const results: MissionResult[] = [];
    let goldPassed = true;
    let matchedCount = 0;
    let rewardedCount = 0;
    let mismatchedRegular = 0;
    let challengeMissionId: string | undefined;
    const pendingVotes: { missionId: string; choice: AnswerInput['choice'] }[] = [];

    for (const id of set.missionIds) {
      const mission = await repo.getMission(id);
      if (!mission) throw new HttpError(409, '세트 문항 정보가 변경되었습니다.', 'MISSION_GONE');
      const answer = answerMap.get(id)!;

      const tally = tallyVotes([...(await getPriorVotes(mission)), answer.choice]);
      const consensus = decideConsensus(tally);
      const excludedFast = answer.reactionMs < VERIFY.FAST_REACTION_MS;
      const ownMission = mission.requesterUid === uid;

      let matched: boolean;
      if (mission.isGold) {
        matched = answer.choice === mission.humanSide;
        if (!matched) goldPassed = false;
      } else {
        matched = consensus !== null && answer.choice === consensus;
        if (!ownMission) {
          if (matched && !excludedFast) rewardedCount += 1;
          if (!matched) mismatchedRegular += 1;
          if (!challengeMissionId || (matched && mission.origin === 'seed')) challengeMissionId = mission.id;
        }
      }
      if (matched) matchedCount += 1;

      results.push({
        missionId: id,
        prompt: mission.prompt,
        kind: mission.kind,
        mode: mission.mode,
        choice: answer.choice,
        consensus,
        tally,
        matched,
        excludedFast,
        ownMission: ownMission || undefined,
        humanSide: mission.humanSide,
        aiTell: ownMission
          ? '내가 의뢰한 문항입니다. 본인 응답은 보상과 실제 집계에서 제외됩니다.'
          : mission.aiTell || '의뢰자 문항입니다. 정답은 인증된 판별자들의 다수결로 확정됩니다.',
        reactionMs: answer.reactionMs,
      });

      // 의뢰자 문항: 정상 응답만 실제 투표로 누적 (기준 문항 판정 후 아래에서 일괄 반영)
      if (mission.origin === 'requester' && !excludedFast && !ownMission) {
        pendingVotes.push({ missionId: id, choice: answer.choice });
      }
    }

    // 데이터 품질 보호: 매크로 의심 또는 기준 문항 실패 세트의 응답은 버림
    if (!flagged && goldPassed) {
      for (const v of pendingVotes) {
        const allVotes = await repo.addVote(v.missionId, v.choice);
        if (allVotes.length >= GAME.REQUESTER_TARGET_VOTES) {
          const m = await repo.getMission(v.missionId);
          if (m && m.origin === 'requester' && m.status === 'active') {
            await repo.saveMission({ ...m, status: 'closed' });
          }
        }
      }
    }

    // 보상 & 신뢰도
    let reward = 0;
    let trustDelta: number;
    if (flagged) {
      trustDelta = TRUST.BOT_FLAG_DELTA;
    } else if (!goldPassed) {
      trustDelta = TRUST.GOLD_FAIL_DELTA;
    } else {
      reward = roundPi(rewardedCount * GAME.REWARD_PER_MATCH_PI);
      trustDelta = rewardedCount * TRUST.MATCH_DELTA + mismatchedRegular * TRUST.MISMATCH_DELTA;
    }

    const completedAt = new Date(submittedAtMs).toISOString();

    const result = await withLock(`user:${uid}`, async () => {
      const user = await repo.getUser(uid);
      if (!user) throw new HttpError(401, '사용자 정보를 찾을 수 없습니다.', 'UNAUTHORIZED');

      const updated: PioneerUser = {
        ...user,
        trustScore: clampTrust(user.trustScore + trustDelta),
        balance: roundPi(user.balance + reward),
        totalEarned: roundPi(user.totalEarned + reward),
        setsCompleted: user.setsCompleted + 1,
        botFlags: user.botFlags + (flagged ? 1 : 0),
        streak: nextStreak(user),
        lastActiveDate: kstDate(),
        updatedAt: completedAt,
      };

      // 원장 먼저 기록: DB 유니크 인덱스(세트당 보상 1회)가 다중 인스턴스 중복 지급을 차단
      if (reward > 0) {
        await repo.addLedgerEntry({
          id: randomUUID(),
          uid,
          type: 'reward',
          amount: reward,
          status: 'settled',
          memo: `판별 보상 · ${rewardedCount}문항 합의 일치`,
          setId: set.setId,
          mock: true,
          createdAt: completedAt,
        });
      }
      await repo.upsertUser(updated);

      const setResult: SetResult = {
        setId: set.setId,
        total: set.missionIds.length,
        matchedCount,
        rewardedCount: reward > 0 ? rewardedCount : 0,
        goldPassed,
        flagged,
        flagReason,
        rechecked,
        reward,
        trustDelta,
        trustScore: updated.trustScore,
        topPercent: estimateTopPercent(matchedCount, set.missionIds.length),
        streak: updated.streak,
        challengeMissionId,
        results,
        completedAt,
      };
      return setResult;
    });

    await repo.saveSet({ ...set, submittedAt: completedAt, result });
    return result;
  });
}
