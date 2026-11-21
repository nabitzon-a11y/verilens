import { z } from 'zod';
import type { VerifySession } from '@/types';
import { requireUser } from '@/lib/auth';
import { HttpError, ok, parseBody, withErrorHandling } from '@/lib/http';
import { getPiVerifyAdapter } from '@/lib/piVerify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ proof: z.string().max(2048).optional() });

/** PiVerify 1단계 — 판별 세션 진입 (1시간 유효 세션 토큰 발급) */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const { proof } = await parseBody(req, schema);

  const result = await getPiVerifyAdapter().startSession(user.uid, proof);
  if (!result.ok || !result.session) {
    throw new HttpError(403, result.reason ?? '인간 검증에 실패했습니다.', 'VERIFY_FAILED');
  }
  return ok<VerifySession>(result.session);
});
