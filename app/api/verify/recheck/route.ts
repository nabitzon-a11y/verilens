import { z } from 'zod';
import type { VerifySession } from '@/types';
import { requireUser } from '@/lib/auth';
import { HttpError, ok, parseBody, withErrorHandling } from '@/lib/http';
import { getPiVerifyAdapter } from '@/lib/piVerify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(1).max(4096),
  proof: z.string().max(2048).optional(),
});

/** PiVerify 2단계 — 매크로 패턴 감지 후 재검증 (세션 토큰 재발급) */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const { token, proof } = await parseBody(req, schema);

  const result = await getPiVerifyAdapter().recheck(user.uid, token, proof);
  if (!result.ok || !result.session) {
    throw new HttpError(403, result.reason ?? '재검증에 실패했습니다.', 'VERIFY_FAILED');
  }
  return ok<VerifySession>(result.session);
});
