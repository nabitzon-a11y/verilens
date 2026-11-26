import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { createTicketMission, draftSchema } from '@/lib/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 무료 의뢰 체험권으로 정식 의뢰 즉시 등록 */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const input = await parseBody(req, draftSchema);

  return ok(await createTicketMission(user.uid, input));
});
