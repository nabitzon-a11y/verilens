import type { MyMissionItem } from '@/types';
import { requireUser } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/http';
import { listMyMissions } from '@/lib/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 내 의뢰 문항 현황 (상태 + 실제 응답 집계) */
export const GET = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  return ok<MyMissionItem[]>(await listMyMissions(user.uid));
});
