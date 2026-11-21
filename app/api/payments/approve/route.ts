import { z } from 'zod';
import type { PaymentRecordStatus } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { approveSubmissionPayment } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  paymentId: z.string().min(1).max(128),
  /** Mock 결제(paymentId: mock_*)일 때만 사용. 실결제는 Pi 서버 조회값만 신뢰 */
  mock: z
    .object({
      draftId: z.string().min(1).max(100),
      amount: z.number().positive(),
      memo: z.string().max(200),
    })
    .optional(),
});

/** onReadyForServerApproval → 서버 검증 후 Pi Platform 승인 (PI_API_KEY 미설정 시 Mock Approval) */
export const POST = withErrorHandling(async (req) => {
  const { auth } = await requireUser(req);
  const { paymentId, mock } = await parseBody(req, schema);

  const record = await approveSubmissionPayment(auth, paymentId, mock);
  return ok<{ paymentId: string; status: PaymentRecordStatus; mock: boolean }>({
    paymentId: record.paymentId,
    status: record.status,
    mock: record.mock,
  });
});
