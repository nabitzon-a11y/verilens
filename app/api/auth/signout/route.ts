import { ok, withErrorHandling } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 로그아웃 — 세션은 무상태(Bearer 토큰)이므로 클라이언트가 토큰을 삭제하면 끝입니다.
 * (토큰 즉시 무효화가 필요해지면 서버 측 토큰 블랙리스트를 추가하세요.)
 */
export const POST = withErrorHandling(async () => ok({ signedOut: true }));
