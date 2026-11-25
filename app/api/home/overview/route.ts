import type { HomeOverviewResponse } from '@/types';
import { requireUser } from '@/lib/auth';
import { GAME, QUEST, getTrustTier } from '@/lib/constants';
import { ok, withErrorHandling } from '@/lib/http';
import { isMissionEligibleForLang } from '@/lib/missionSets';
import { getRepository } from '@/lib/repository';
import { migrateTrust } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMMUNITY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function kstToday(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

/** 홈 화면 통합 조회 (실시간 의뢰 현황 + Top 5 리더보드 + 데일리 퀘스트) */
export const GET = withErrorHandling(async (req) => {
  const { user: rawUser } = await requireUser(req);
  const user = migrateTrust(rawUser);
  const lang = new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const repo = getRepository();

  const [requester, allUsers] = await Promise.all([
    repo.listMissions({ origin: 'requester' }),
    repo.listUsers(),
  ]);

  const active = requester.filter((m) => m.status === 'active' && isMissionEligibleForLang(m, lang));
  const withVotes = await Promise.all(
    active.map(async (m) => ({ m, votes: (await repo.getVotes(m.id)).length })),
  );
  const items = withVotes
    .sort((x, y) => y.votes - x.votes || y.m.createdAt.localeCompare(x.m.createdAt))
    .slice(0, 2)
    .map(({ m, votes }) => ({
      id: m.id,
      kind: m.kind,
      mode: m.mode,
      prompt: m.prompt,
      sourceLabel: m.a.type === 'text' ? m.a.sourceLabel : undefined,
      votes: Math.min(votes, GAME.REQUESTER_TARGET_VOTES),
      target: GAME.REQUESTER_TARGET_VOTES,
    }));

  const usedFreeToday = requester.some(
    (m) =>
      m.requesterUid === user.uid &&
      m.id.startsWith('ugc-') &&
      Date.now() - Date.parse(m.createdAt) < COMMUNITY_COOLDOWN_MS,
  );

  // 리더보드: 신뢰도 점수 내림차순 → 완료 세트 수 내림차순
  const ranked = allUsers
    .map(migrateTrust)
    .sort((a, b) => b.trustScore - a.trustScore || b.setsCompleted - a.setsCompleted || a.createdAt.localeCompare(b.createdAt));

  const myIndex = ranked.findIndex((u) => u.uid === user.uid);
  const top = ranked.slice(0, 5).map((u, idx) => {
    const tier = getTrustTier(u.trustScore);
    return {
      rank: idx + 1,
      username: u.username,
      trustScore: u.trustScore,
      tier: tier.tier,
      tierLabel: tier.label,
      setsCompleted: u.setsCompleted,
      isMe: u.uid === user.uid,
    };
  });

  const today = kstToday();
  const nextMilestone = QUEST.STREAK_MILESTONES.find((m) => m > user.streak) ?? null;

  return ok<HomeOverviewResponse>({
    live: {
      activeCount: active.length,
      items,
      freeQuizAvailable: !usedFreeToday,
      freeQuizEligible: user.setsCompleted >= 1,
    },
    leaderboard: {
      top,
      myRank: myIndex >= 0 ? myIndex + 1 : ranked.length + 1,
      totalUsers: ranked.length,
    },
    quest: {
      dailyDoneToday: user.lastQuestDate === today,
      dailyBonusPts: QUEST.DAILY_TRUST_BONUS,
      streak: user.streak,
      nextMilestone,
      milestoneBonusPts: QUEST.MILESTONE_TRUST_BONUS,
    },
  });
});
