import { z } from 'zod';
import type { VerifySession } from '@/types';
import { requireUser } from '@/lib/auth';
import { HttpError, ok, parseBody, withErrorHandling } from '@/lib/http';
import { getPiVerifyAdapter } from '@/lib/piVerify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ proof: z.string().max(2048).optional() });

/** PiVerify 3단계 — 보상 출금 직전 재검증 (2분 유효 출금 토큰, /api/wallet/claim 에서 사용) */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const { proof } = await parseBody(req, schema);

  const result = await getPiVerifyAdapter().reverifyForClaim(user.uid, proof);
  if (!result.ok || !result.session) {
    throw new HttpError(403, result.reason ?? '출금 재검증에 실패했습니다.', 'VERIFY_FAILED');
  }
  return ok<VerifySession>(result.session);
});
