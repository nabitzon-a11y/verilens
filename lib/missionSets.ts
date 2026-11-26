import 'server-only';
import { createHash, randomInt, randomUUID } from 'crypto';
import type {
  AnswerInput,
  BonusResult,
  Mission,
  MissionResult,
  MissionSet,
  PioneerUser,
  PublicMissionSet,
  SetResult,
} from '@/types';
import { toPublicMission } from '@/data/missions';
import { SEED_EN } from '@/data/missions.en';
import { BONUS_QUIZZES, getBonusQuiz, toPublicBonus } from '@/data/bonus';
import { evaluateBehavior, evaluateTimingIntegrity } from './behavior';
import { decideConsensus, getPriorVotes, tallyVotes } from './consensus';
import { BONUS, GAME, QUEST, TRUST, TRUST_TIERS, VERIFY, applyTrustChange, getTrustTier, roundPi } from './constants';
import { HttpError } from './http';
import { withLock } from './lock';
import { SESSION_STAGES, getPiVerifyAdapter } from './piVerify';
import { getRepository } from './repository';
import { migrateTrust } from './users';

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

/** 등급 순서 (index 가 작을수록 상위) */
const GAME_TIER_ORDER: string[] = TRUST_TIERS.map((t) => t.tier);

function deterministicShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  return [...items]
    .map((item) => ({
      item,
      key: createHash('sha256').update(`${seed}:${item.id}`).digest('hex'),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((x) => x.item);
}

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

function hasHangulText(text: string): boolean {
  return /[가-힣]/.test(text);
}

function bodyHasHangul(m: Mission): boolean {
  // single 모드의 b 는 고정 라벨('AI 생성 · 합성')이므로 실제 판별 대상인 a 만 검사
  const bodies =
    m.mode === 'single'
      ? [m.a.type === 'text' ? m.a.body : '']
      : [m.a.type === 'text' ? m.a.body : '', m.b.type === 'text' ? m.b.body : ''];
  return bodies.some(hasHangulText);
}

export function getDailyMissionsForDate(active: Mission[], dateStr: string, lang: 'ko' | 'en'): Mission[] {
  const golds = active.filter((m) => m.isGold && m.humanSide);
  const regular = active.filter((m) => !m.isGold);
  const langEligible = (m: Mission) => isMissionEligibleForLang(m, lang);
  const eligibleGolds = golds.filter(langEligible);
  const goldPool = eligibleGolds.length > 0 ? eligibleGolds : golds;
  const need = GAME.QUESTIONS_PER_SET - GAME.GOLD_PER_SET;

  const dailySeed = `daily:${dateStr}:${lang}`;
  const seedRegular = deterministicShuffle(
    regular.filter((m) => m.origin === 'seed' && langEligible(m)),
    dailySeed,
  );
  const seedGolds = deterministicShuffle(
    goldPool.filter((m) => m.origin === 'seed'),
    `${dailySeed}:gold`,
  );
  const ordered = seedRegular.slice(0, need);
  const gold = seedGolds[0] ?? goldPool[0];
  if (gold) {
    const hashByte = createHash('sha256').update(dailySeed).digest()[0];
    ordered.splice(hashByte % (ordered.length + 1), 0, gold);
  }
  return ordered;
}

export function isMissionEligibleForLang(m: Mission, lang: 'ko' | 'en'): boolean {
  if (m.origin === 'seed') {
    return lang === 'en' ? Boolean(SEED_EN[m.id]) : hasHangulText(m.prompt) || bodyHasHangul(m);
  }
  // 이미지 의뢰 문항은 언어 장벽이 없으므로 KO/EN 양쪽에서 모두 판별 참여 가능
  if (m.kind === 'image') return true;
  // 텍스트 의뢰 문항은 질문(prompt)이 아닌 실제 본문 언어를 기준으로 KO/EN 엄격 분리
  return lang === 'en' ? !bodyHasHangul(m) : bodyHasHangul(m);
}

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
  lang: 'ko' | 'en' = 'ko',
  mode: 'normal' | 'daily' = 'normal',
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
  const langEligible = (m: Mission) => isMissionEligibleForLang(m, lang);
  const eligibleGolds = golds.filter(langEligible);
  const goldPool = eligibleGolds.length > 0 ? eligibleGolds : golds;

  const isDaily = mode === 'daily';
  let ordered: Mission[];
  let gold: Mission;

  if (isDaily) {
    ordered = getDailyMissionsForDate(active, kstDate(), lang);
  } else {
    const challenge = challengeId ? regular.find((m) => m.id === challengeId) : undefined;
    if (challenge) picked.push(challenge);

    const requesterFirst = shuffle(
      regular.filter((m) => m.origin === 'requester' && langEligible(m) && !picked.includes(m)),
    ).slice(0, 2);
    picked.push(...requesterFirst);

    // 이미지 문항이 세트당 최소 1~2개 포함되도록 우선 선발 (눈에 끌리는 시각 몰입감)
    const imageFirst = shuffle(
      regular.filter((m) => m.kind === 'image' && langEligible(m) && !picked.includes(m)),
    ).slice(0, Math.max(0, Math.min(2, need - picked.length)));
    picked.push(...imageFirst);

    for (const m of shuffle(regular.filter((m) => langEligible(m) && !picked.includes(m)))) {
      if (picked.length >= need) break;
      picked.push(m);
    }

    // 난이도 곡선: 워밍업(1) → 실전 함정(2) → 고난도(3) 순 배치 (Gold는 무작위 위치 삽입)
    ordered = picked.slice(0, need).sort((a, b) => a.difficulty - b.difficulty);
    gold = goldPool[randomInt(goldPool.length)];
    ordered.splice(randomInt(ordered.length + 1), 0, gold);
  }

  const bonusQuiz = isDaily
    ? BONUS_QUIZZES[createHash('sha256').update(`daily-bonus:${kstDate()}`).digest()[0] % BONUS_QUIZZES.length]
    : randomInt(1000) < BONUS.CHANCE * 1000
      ? BONUS_QUIZZES[randomInt(BONUS_QUIZZES.length)]
      : undefined;

  const set: MissionSet = {
    setId: randomUUID(),
    uid: user.uid,
    missionIds: ordered.map((m) => m.id),
    verifyToken,
    issuedAt: new Date().toISOString(),
    bonusId: bonusQuiz?.id,
    isDaily: isDaily || undefined,
  };
  await repo.saveSet(set);

  return {
    setId: set.setId,
    missions: ordered.map(toPublicMission),
    bonus: bonusQuiz ? toPublicBonus(bonusQuiz) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* 세트 제출 & 판정                                                    */
/* ------------------------------------------------------------------ */

export async function submitMissionSet(
  uid: string,
  input: { setId: string; verifyToken: string; answers: AnswerInput[]; bonusChoice?: number; refUid?: string },
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
    let hardMatched = 0;
    let regularCount = 0;
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
          regularCount += 1;
          if (matched && !excludedFast) {
            rewardedCount += 1;
            if (mission.difficulty === 3) hardMatched += 1;
          }
          if (!matched) mismatchedRegular += 1;
          if (!challengeMissionId || (matched && mission.origin === 'seed')) challengeMissionId = mission.id;
        }
      }
      if (matched) matchedCount += 1;

      // 정답이 알려진 문항: 10인 패널 중 AI 쪽을 고른(=속은) 인원
      const fooledCount = mission.humanSide ? tally[mission.humanSide === 'A' ? 'B' : 'A'] : undefined;

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
        fooledCount,
        difficulty: mission.difficulty,
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

    // 보너스 문제 판정 (세트에 포함된 경우에만, 정답은 서버만 앎)
    const bonusQuiz = set.bonusId ? getBonusQuiz(set.bonusId) : undefined;
    const bonusCorrect =
      bonusQuiz !== undefined && typeof input.bonusChoice === 'number' && input.bonusChoice === bonusQuiz.answer;
    const qualified = !flagged && goldPassed;
    const perfect = qualified && regularCount > 0 && rewardedCount === regularCount;

    // 신뢰도 기본 변동폭 (등급 배율은 사용자 점수 기준으로 아래에서 적용)
    let rawGain = 0;
    let rawLoss = 0;
    if (flagged) {
      rawLoss = TRUST.BOT_FLAG_DELTA;
    } else if (!goldPassed) {
      rawLoss = TRUST.GOLD_FAIL_DELTA;
    } else {
      rawGain =
        rewardedCount * TRUST.MATCH_DELTA + hardMatched * TRUST.HARD_MATCH_BONUS + (perfect ? TRUST.PERFECT_SET_BONUS : 0);
      rawLoss = mismatchedRegular * TRUST.MISMATCH_DELTA;
    }

    const completedAt = new Date(submittedAtMs).toISOString();

    const result = await withLock(`user:${uid}`, async () => {
      const raw = await repo.getUser(uid);
      if (!raw) throw new HttpError(401, '사용자 정보를 찾을 수 없습니다.', 'UNAUTHORIZED');
      const user = migrateTrust(raw);
      const beforeTier = getTrustTier(user.trustScore);
      const rewardMult = beforeTier.rewardMult;
      const reward = qualified ? roundPi(rewardedCount * GAME.REWARD_PER_MATCH_PI * rewardMult) : 0;

      const today = kstDate();
      const updatedStreak = nextStreak(user);
      const dailyQuestBonus = qualified && user.lastQuestDate !== today ? QUEST.DAILY_TRUST_BONUS : 0;
      const hitMilestone =
        qualified &&
        user.lastActiveDate !== today &&
        QUEST.STREAK_MILESTONES.includes(updatedStreak)
          ? updatedStreak
          : undefined;
      const streakBonus = hitMilestone ? QUEST.MILESTONE_TRUST_BONUS : 0;
      const freeTicketGranted = Boolean(hitMilestone);

      let referralBonus = 0;
      let validRefUid: string | undefined;
      if (qualified && !user.referralRewarded && input.refUid && input.refUid !== uid) {
        const referrer = await repo.getUser(input.refUid);
        if (referrer) {
          validRefUid = referrer.uid;
          referralBonus = QUEST.REFERRAL_TRUST_BONUS;
        }
      }

      const bonusGain =
        bonusCorrect && qualified
          ? Math.max(TRUST.BONUS_MIN_DELTA, Math.round(TRUST.BONUS_CORRECT_DELTA * beforeTier.gainRate))
          : 0;
      const { next: nextTrust, delta: trustDelta } = applyTrustChange(
        user.trustScore,
        rawGain,
        rawLoss,
        bonusGain + dailyQuestBonus + streakBonus + referralBonus,
      );
      const afterTier = getTrustTier(nextTrust);
      const tierOrder = (t: string) => GAME_TIER_ORDER.indexOf(t);
      const tierChange =
        tierOrder(afterTier.tier) < tierOrder(beforeTier.tier)
          ? ('up' as const)
          : tierOrder(afterTier.tier) > tierOrder(beforeTier.tier)
            ? ('down' as const)
            : undefined;

      const bonus: BonusResult | undefined = bonusQuiz
        ? {
            quizId: bonusQuiz.id,
            choice: typeof input.bonusChoice === 'number' ? input.bonusChoice : -1,
            answer: bonusQuiz.answer,
            correct: bonusCorrect,
            trustGain: bonusGain,
            explain: bonusQuiz.explain,
          }
        : undefined;

      const updated: PioneerUser = {
        ...user,
        trustScore: nextTrust,
        balance: roundPi(user.balance + reward),
        totalEarned: roundPi(user.totalEarned + reward),
        setsCompleted: user.setsCompleted + 1,
        botFlags: user.botFlags + (flagged ? 1 : 0),
        streak: updatedStreak,
        lastActiveDate: today,
        lastQuestDate: dailyQuestBonus > 0 ? today : user.lastQuestDate,
        freeSubmitTickets: (user.freeSubmitTickets ?? 0) + (freeTicketGranted ? 1 : 0),
        referredBy: validRefUid ?? user.referredBy,
        referralRewarded: validRefUid ? true : user.referralRewarded,
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
        rewardMultiplier: rewardMult,
        isDaily: set.isDaily,
        trustDelta,
        trustScore: updated.trustScore,
        trustBefore: user.trustScore,
        tierChange,
        perfect,
        bonus,
        dailyQuestBonus: dailyQuestBonus > 0 ? dailyQuestBonus : undefined,
        streakMilestone: hitMilestone,
        referralBonus: referralBonus > 0 ? referralBonus : undefined,
        freeTicketGranted: freeTicketGranted || undefined,
        topPercent: estimateTopPercent(matchedCount, set.missionIds.length),
        streak: updated.streak,
        challengeMissionId,
        results,
        completedAt,
      };
      return setResult;
    });

    await repo.saveSet({ ...set, submittedAt: completedAt, result });

    if (result.referralBonus && input.refUid && input.refUid !== uid) {
      await withLock(`user:${input.refUid}`, async () => {
        const refRaw = await repo.getUser(input.refUid!);
        if (!refRaw) return;
        const refUser = migrateTrust(refRaw);
        const { next } = applyTrustChange(refUser.trustScore, 0, 0, QUEST.REFERRAL_TRUST_BONUS);
        await repo.upsertUser({
          ...refUser,
          trustScore: next,
          updatedAt: new Date().toISOString(),
        });
      });
    }

    return result;
  });
}
