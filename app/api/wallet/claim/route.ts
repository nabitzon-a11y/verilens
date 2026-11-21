import { z } from 'zod';
import type { ClaimResponse } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { claimRewards } from '@/lib/wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ claimToken: z.string().min(1).max(4096) });

/** 보상 청구 — PiVerify 3단계 재검증 토큰(1회성) 필수 */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const { claimToken } = await parseBody(req, schema);

  return ok<ClaimResponse>(await claimRewards(user.uid, claimToken));
});
