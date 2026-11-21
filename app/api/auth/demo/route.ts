import type { SignInResponse } from '@/types';
import { issueAuthToken, readAuth } from '@/lib/auth';
import { DEMO_MODE_ALLOWED } from '@/lib/constants';
import { randomToken } from '@/lib/crypto';
import { HttpError, ok, withErrorHandling } from '@/lib/http';
import { getPaymentsMode } from '@/lib/payments';
import { getRepository } from '@/lib/repository';
import { getOrCreateUser, toProfile } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Demo Sandbox Mode 가상 로그인 (Pi Browser 밖에서 심사위원 시연용)
 * - 기존 데모 토큰이 있으면 같은 데모 계정을 이어서 사용
 * - NEXT_PUBLIC_ALLOW_DEMO_MODE=false 이면 비활성화
 */
export const POST = withErrorHandling(async (req) => {
  if (!DEMO_MODE_ALLOWED) throw new HttpError(403, '데모 모드가 비활성화되어 있습니다.', 'DEMO_DISABLED');

  const current = readAuth(req);
  if (current?.mode === 'demo') {
    const existing = await getRepository().getUser(current.uid);
    if (existing) {
      return ok<SignInResponse>({
        token: issueAuthToken(existing.uid, existing.username, 'demo'),
        profile: toProfile(existing),
        paymentsMode: getPaymentsMode(),
      });
    }
  }

  const suffix = randomToken(4); // 8자리 hex
  const user = await getOrCreateUser(`demo_${suffix}`, `DemoPioneer_${suffix.slice(0, 4).toUpperCase()}`, true);

  return ok<SignInResponse>({
    token: issueAuthToken(user.uid, user.username, 'demo'),
    profile: toProfile(user),
    paymentsMode: getPaymentsMode(),
  });
});
