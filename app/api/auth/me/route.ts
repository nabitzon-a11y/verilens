import type { MeResponse } from '@/types';
import { readAuth } from '@/lib/auth';
import { DEMO_MODE_ALLOWED } from '@/lib/constants';
import { ok, withErrorHandling } from '@/lib/http';
import { getPaymentsMode } from '@/lib/payments';
import { getPiVerifyAdapter } from '@/lib/piVerify';
import { getRepository } from '@/lib/repository';
import { toProfile } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 현재 로그인 사용자 + 서버 동작 모드 (비로그인도 200 응답) */
export const GET = withErrorHandling(async (req) => {
  const auth = readAuth(req);
  const user = auth ? await getRepository().getUser(auth.uid) : null;

  return ok<MeResponse>({
    profile: user ? toProfile(user) : null,
    paymentsMode: getPaymentsMode(),
    verifyMode: getPiVerifyAdapter().mock ? 'mock' : 'live',
    demoAllowed: DEMO_MODE_ALLOWED,
  });
});
