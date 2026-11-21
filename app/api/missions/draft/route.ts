import type { DraftResponse } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { createDraft, draftSchema } from '@/lib/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 의뢰자 문항 작성 (결제 대기 draft) → 클라이언트는 draftId 로 Pi 결제 진행 */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const input = await parseBody(req, draftSchema);

  return ok<DraftResponse>(await createDraft(user.uid, input));
});
