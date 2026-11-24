/**
 * Pi Developer Portal 도메인 소유 확인용 파일
 *  - Portal 에서 앱 URL 을 등록하면 발급되는 검증 키를 PI_VALIDATION_KEY 환경변수에 넣으면
 *    https://<배포도메인>/validation-key.txt 로 그대로 응답합니다.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAINNET_VALIDATION_KEY =
  '1bbde0c59152d1185861697596a0b2135f0ca4c3a980e7b548ca19ca1f8b1322d7ae1b119d6c65c471d2d4acd358cc2a3638d97e88c7acd155c8f46f5cb932eb';

export function GET() {
  const key = MAINNET_VALIDATION_KEY || process.env.PI_VALIDATION_KEY?.trim();
  if (!key) return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(key, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
