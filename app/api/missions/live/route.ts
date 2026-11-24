import type { LivePoolResponse } from '@/types';
import { requireUser } from '@/lib/auth';
import { GAME } from '@/lib/constants';
import { ok, withErrorHandling } from '@/lib/http';
import { isMissionEligibleForLang } from '@/lib/missionSets';
import { getRepository } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMMUNITY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** 홈 화면용: 진행 중인 의뢰 문항 미리보기 + 오늘 무료 출제 가능 여부 */
export const GET = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const lang = new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const repo = getRepository();

  const requester = await repo.listMissions({ origin: 'requester' });
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

  return ok<LivePoolResponse>({
    activeCount: active.length,
    items,
    freeQuizAvailable: !usedFreeToday,
    freeQuizEligible: user.setsCompleted >= 1,
  });
});
