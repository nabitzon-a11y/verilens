import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { reportMission } from '@/lib/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  missionId: z.string().min(1).max(100),
  reason: z.enum(['copyright', 'harmful', 'spam']),
});

/** 문항 신고 (저작권 침해 / 유해 콘텐츠 / 스팸) */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const { missionId, reason } = await parseBody(req, schema);

  return ok(await reportMission(user.uid, missionId, reason));
});
