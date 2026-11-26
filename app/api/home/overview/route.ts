import type { HomeOverviewResponse, Mission } from '@/types';
import { SEED_EN } from '@/data/missions.en';
import { requireUser } from '@/lib/auth';
import { GAME, QUEST, getTrustTier } from '@/lib/constants';
import { ok, withErrorHandling } from '@/lib/http';
import { getDailyMissionsForDate, isMissionEligibleForLang } from '@/lib/missionSets';
import { getRepository } from '@/lib/repository';
import { migrateTrust } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMMUNITY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function kstDateOffset(days = 0): string {
  return new Date(Date.now() + 9 * 3600_000 + days * 86400_000).toISOString().slice(0, 10);
}

async function buildYesterdayRecap(
  repo: ReturnType<typeof getRepository>,
  allActive: Mission[],
  lang: 'ko' | 'en',
): Promise<HomeOverviewResponse['yesterdayRecap']> {
  const yesterday = kstDateOffset(-1);
  const daily = getDailyMissionsForDate(allActive, yesterday, lang);
  if (daily.length === 0) return undefined;

  // 어제 데일리 문항 중 실제 투표 + 기준 패널 오답률이 가장 높은 1문항 선정
  const scored = await Promise.all(
    daily.map(async (m) => {
      const votes = await repo.getVotes(m.id);
      const combined = [...m.priorVotes, ...votes];
      const fooled = m.humanSide ? combined.filter((v) => v !== m.humanSide).length : 0;
      const fooledPercent = combined.length > 0 ? Math.round((fooled / combined.length) * 100) : m.difficulty * 22;
      return { m, fooledPercent };
    }),
  );

  scored.sort((a, b) => b.fooledPercent - a.fooledPercent || b.m.difficulty - a.m.difficulty);
  const pick = scored[0]?.m;
  if (!pick) return undefined;

  const tr = lang === 'en' ? SEED_EN[pick.id] : undefined;
  const prompt = tr?.prompt ?? pick.prompt;
  const aiTell = tr?.aiTell ?? pick.aiTell;
  const aContent = tr?.aBody ?? (pick.a.type === 'text' ? pick.a.body : undefined);
  const sourceLabel = tr?.sourceLabel ?? (pick.a.type === 'text' ? pick.a.sourceLabel : undefined);

  return {
    missionId: pick.id,
    prompt,
    kind: pick.kind,
    mode: pick.mode,
    previewText: aContent ? (aContent.length > 120 ? `${aContent.slice(0, 120)}...` : aContent) : undefined,
    sourceLabel,
    fooledPercent: Math.max(28, Math.min(78, scored[0].fooledPercent || 48)),
    humanSide: pick.humanSide,
    aiTell,
  };
}

/** 홈 화면 통합 조회 (실시간 의뢰 현황 + Top 5 리더보드 + 데일리 퀘스트) */
export const GET = withErrorHandling(async (req) => {
  const { user: rawUser } = await requireUser(req);
  const user = migrateTrust(rawUser);
  const lang = new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const repo = getRepository();

  const [requester, allActive, allUsers] = await Promise.all([
    repo.listMissions({ origin: 'requester' }),
    repo.listMissions({ status: 'active' }),
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
      streak: u.streak,
      isMe: u.uid === user.uid,
    };
  });

  const today = kstDateOffset(0);
  const nextMilestone = QUEST.STREAK_MILESTONES.find((m) => m > user.streak) ?? null;
  const yesterdayRecap = await buildYesterdayRecap(repo, allActive, lang);

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
    yesterdayRecap,
  });
});
