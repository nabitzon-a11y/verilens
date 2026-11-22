import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { HttpError, ok, parseBody, withErrorHandling } from '@/lib/http';
import { getRepository } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ missionId: z.string().min(1).max(100) });

/** 관리자 강제 문항 마감 */
export const POST = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const { missionId } = await parseBody(req, schema);
  const repo = getRepository();

  const mission = await repo.getMission(missionId);
  if (!mission || mission.origin !== 'requester') {
    throw new HttpError(404, '의뢰 문항을 찾을 수 없습니다.', 'NOT_FOUND');
  }

  if (mission.status !== 'closed') {
    await repo.saveMission({ ...mission, status: 'closed' });
  }
  return ok({ missionId, status: 'closed' as const });
});
