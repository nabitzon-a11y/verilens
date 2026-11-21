import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { cancelSubmissionPayment } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ paymentId: z.string().min(1).max(128) });

/** onCancel → 서버 기록을 취소 상태로 변경 (문항은 draft 로 남아 재결제 가능) */
export const POST = withErrorHandling(async (req) => {
  const { auth } = await requireUser(req);
  const { paymentId } = await parseBody(req, schema);

  return ok(await cancelSubmissionPayment(auth, paymentId));
});
