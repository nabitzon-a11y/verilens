import type { WalletResponse } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/http';
import { getWallet } from '@/lib/wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 지갑 요약 + 정산 원장 */
export const GET = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  return ok<WalletResponse>(await getWallet(user.uid));
});
