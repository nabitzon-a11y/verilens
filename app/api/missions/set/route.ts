import { z } from 'zod';
import type { PublicMissionSet } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { issueMissionSet } from '@/lib/missionSets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  verifyToken: z.string().min(1).max(4096),
  challenge: z.string().max(100).optional(),
});

/** 판별 세트 발급 (유효한 PiVerify 세션 필요) */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const { verifyToken, challenge } = await parseBody(req, schema);

  return ok<PublicMissionSet>(await issueMissionSet(user, verifyToken, challenge));
});
