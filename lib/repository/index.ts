import 'server-only';
import path from 'path';
import type { Repository } from '@/types';
import { JsonFileRepository } from './jsonFile';
import { MemoryRepository } from './memory';
import { SupabaseRepository } from './supabase';

/**
 * 저장소 팩토리 (Repository 패턴)
 *  DATA_STORE=json     → JsonFileRepository (기본, 로컬)
 *  DATA_STORE=memory   → MemoryRepository (재시작 시 초기화)
 *  DATA_STORE=supabase → SupabaseRepository (배포용 영구 저장, supabase/schema.sql 필요)
 *
 * Next.js 개발 서버의 핫 리로드에도 같은 인스턴스를 쓰도록 globalThis 에 보관합니다.
 */

type G = typeof globalThis & { __verilensRepo?: Repository };

function createRepository(): Repository {
  const kind = (process.env.DATA_STORE ?? 'json').trim().toLowerCase();

  if (kind === 'memory') return new MemoryRepository();

  if (kind === 'supabase') {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) throw new Error('DATA_STORE=supabase 에는 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
    return new SupabaseRepository(url, key);
  }

  if (kind === 'json') {
    if (process.env.VERCEL) {
      console.warn('[repo] Vercel 서버리스 환경은 파일 쓰기가 불가하여 memory 저장소로 전환합니다.');
      return new MemoryRepository();
    }
    const filePath = path.resolve(process.cwd(), process.env.DATA_FILE_PATH || '.data/verilens.json');
    return new JsonFileRepository(filePath);
  }

  throw new Error(`지원하지 않는 DATA_STORE 값입니다: ${kind}`);
}

export function getRepository(): Repository {
  const g = globalThis as G;
  if (!g.__verilensRepo) g.__verilensRepo = createRepository();
  return g.__verilensRepo;
}
