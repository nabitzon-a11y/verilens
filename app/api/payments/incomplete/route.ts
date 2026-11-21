import { z } from 'zod';
import type { IncompletePaymentResponse } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { recoverIncompletePayment } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 클라이언트는 paymentId 만 보냄 — 결제 상태는 서버가 Pi Platform 에서 직접 조회 */
const schema = z.object({ paymentId: z.string().min(1).max(128) });

/** Pi.authenticate 의 onIncompletePaymentFound → 미완료 결제 자동 복구 */
export const POST = withErrorHandling(async (req) => {
  const { auth } = await requireUser(req);
  const { paymentId } = await parseBody(req, schema);

  return ok<IncompletePaymentResponse>(await recoverIncompletePayment(auth, paymentId));
});
