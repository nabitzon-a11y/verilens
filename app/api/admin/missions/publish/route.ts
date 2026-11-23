import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { Mission } from '@/types';
import { requireAdmin } from '@/lib/admin';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { getRepository } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  prompt: z.string().trim().min(4).max(100),
  sourceLabel: z.string().trim().min(1).max(30),
  aBody: z.string().trim().min(10).max(600),
  bBody: z.string().trim().min(10).max(600),
  humanSide: z.enum(['A', 'B']),
  aiTell: z.string().trim().max(300).optional(),
});

/** 관리자가 생성된 초안을 즉시 활성 문항으로 출제 */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireAdmin(req);
  const input = await parseBody(req, schema);
  const repo = getRepository();

  const mission: Mission = {
    id: `req-${randomUUID()}`,
    kind: 'text',
    mode: 'compare',
    category: 'custom',
    prompt: input.prompt,
    a: { type: 'text', body: input.aBody, sourceLabel: input.sourceLabel },
    b: { type: 'text', body: input.bBody, sourceLabel: input.sourceLabel },
    humanSide: input.humanSide,
    isGold: false,
    priorVotes: [],
    aiTell: input.aiTell ?? '',
    difficulty: 2,
    origin: 'requester',
    status: 'active',
    requesterUid: user.uid,
    createdAt: new Date().toISOString(),
  };

  await repo.saveMission(mission);
  return ok({ missionId: mission.id, status: 'active' as const });
});
