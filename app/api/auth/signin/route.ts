import { z } from 'zod';
import type { SignInResponse } from '@/types';
import { issueAuthToken } from '@/lib/auth';
import { HttpError, ok, parseBody, withErrorHandling } from '@/lib/http';
import { getPaymentsMode } from '@/lib/payments';
import { PiApiError, fetchPiUser } from '@/lib/piPlatform';
import { getOrCreateUser, toProfile } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ accessToken: z.string().min(10).max(4096) });

/** Pi.authenticate 로 받은 accessToken 을 Pi 서버(/v2/me)에서 검증 후 앱 세션 발급 */
export const POST = withErrorHandling(async (req) => {
  const { accessToken } = await parseBody(req, schema);

  let me;
  try {
    me = await fetchPiUser(accessToken);
  } catch (err) {
    if (err instanceof PiApiError && (err.status === 401 || err.status === 403)) {
      throw new HttpError(401, 'Pi 인증이 만료되었거나 유효하지 않습니다.', 'PI_AUTH_INVALID');
    }
    throw err;
  }
  if (!me?.uid) throw new HttpError(401, 'Pi 사용자 정보를 확인할 수 없습니다.', 'PI_AUTH_INVALID');

  const username = me.username || `pioneer_${me.uid.slice(0, 6)}`;
  const user = await getOrCreateUser(me.uid, username, false);

  return ok<SignInResponse>({
    token: issueAuthToken(user.uid, user.username, 'pi'),
    profile: toProfile(user),
    paymentsMode: getPaymentsMode(),
  });
});
