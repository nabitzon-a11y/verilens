import { requireUser } from '@/lib/auth';
import { ok, parseBody, withErrorHandling } from '@/lib/http';
import { createCommunityMission, draftSchema } from '@/lib/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 커뮤니티 무료 퀴즈 출제 (판별 1세트 이상 완료 유저 · 1일 1회) */
export const POST = withErrorHandling(async (req) => {
  const { user } = await requireUser(req);
  const input = await parseBody(req, draftSchema);
  return ok(await createCommunityMission(user.uid, input));
});
