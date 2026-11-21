import { z } from 'zod';
import type { PaymentCompleteResponse } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { completeSubmissionPayment } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  paymentId: z.string().min(1).max(128),
  txid: z.string().min(1).max(200),
});

/** onReadyForServerCompletion → txid 검증 후 완료 처리 + 의뢰 문항 활성화 */
export const POST = withErrorHandling(async (req) => {
  const { auth } = await requireUser(req);
  const { paymentId, txid } = await parseBody(req, schema);

  return ok<PaymentCompleteResponse>(await completeSubmissionPayment(auth, paymentId, txid));
});
