import { HttpError, ok, withErrorHandling } from '@/lib/http';
import { getPublicVerdict } from '@/lib/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 공개 공식 판정서 조회 (비로그인 열람 가능, 의뢰자 문항 전용) */
export const GET = withErrorHandling(async (req) => {
  const id = new URL(req.url).pathname.split('/').filter(Boolean).pop();
  if (!id) throw new HttpError(400, '잘못된 판정서 ID입니다.', 'BAD_REQUEST');
  return ok(await getPublicVerdict(decodeURIComponent(id)));
});
