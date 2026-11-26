import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 저장소(Supabase/JSON/Memory) 연결 및 응답 지연 점검용 경량 헬스체크 */
export async function GET() {
  const startedAt = Date.now();
  const store = process.env.DATA_STORE ?? 'json';

  try {
    const missions = await getRepository().listMissions({ status: 'active' });
    return NextResponse.json({
      ok: true,
      store,
      activeMissions: missions.length,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage check failed';
    return NextResponse.json(
      {
        ok: false,
        store,
        error: message,
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
