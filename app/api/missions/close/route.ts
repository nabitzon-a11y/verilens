import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { closeMyMission } from '@/lib/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ missionId: z.string().min(1).max(100) });

/** 의뢰자가 본인 문항을 직접 마감(판별 풀에서 제외) */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const { missionId } = await parseBody(req, schema);

  return ok(await closeMyMission(user.uid, missionId));
});
