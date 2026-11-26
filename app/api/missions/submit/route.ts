import { z } from 'zod';
import type { SetResult } from '@/types';
import { requireUser } from '@/lib/auth';
import { GAME } from '@/lib/constants';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { submitMissionSet } from '@/lib/missionSets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  setId: z.string().uuid(),
  verifyToken: z.string().min(1).max(4096),
  answers: z
    .array(
      z.object({
        missionId: z.string().min(1).max(100),
        choice: z.enum(['A', 'B']),
        reactionMs: z.number().int().min(0).max(10 * 60 * 1000),
      }),
    )
    .min(1)
    .max(GAME.QUESTIONS_PER_SET),
  bonusChoice: z.number().int().min(0).max(5).optional(),
  refUid: z.string().min(1).max(120).optional(),
});

/** 세트 제출 → 기준 문항 + 5인 다수결 판정 → 보상/신뢰도 반영 */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req, schema);

  return ok<SetResult>(await submitMissionSet(user.uid, body));
});
