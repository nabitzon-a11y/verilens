import 'server-only';
import { SEED_MISSIONS } from '@/data/missions';
import type {
  Choice,
  LedgerEntry,
  Mission,
  MissionOrigin,
  MissionSet,
  MissionStatus,
  PaymentRecord,
  PioneerUser,
  Repository,
} from '@/types';
import { HttpError } from '../http';

/**
 * Supabase(Postgres) 저장소 — PostgREST REST API 를 fetch 로 직접 호출 (추가 패키지 없음)
 *
 * - 테이블 구조는 supabase/schema.sql 참고 (문서형 vl_documents + 응답 vl_votes)
 * - SUPABASE_SERVICE_ROLE_KEY 는 서버 전용. RLS 가 켜져 있어 다른 키로는 접근 불가
 * - 금전 관련 중복(Claim 토큰 재사용, 세트 보상 중복, 결제 원장 중복)은
 *   DB 유니크 인덱스가 막고, 위반 시 409 DUPLICATE 로 변환합니다.
 */

type Collection = 'users' | 'missions' | 'sets' | 'ledger' | 'payments';

interface DocRow<T> {
  data: T;
}

const SEED_IDS = new Set(SEED_MISSIONS.map((m) => m.id));
const TIMEOUT_MS = 10_000;

export class SupabaseRepository implements Repository {
  private readonly base: string;
  private readonly key: string;

  constructor(url: string, serviceRoleKey: string) {
    this.base = `${url.replace(/\/+$/, '')}/rest/v1`;
    this.key = serviceRoleKey;
  }

  /* ------------------------------------------------------------------ */
  /* HTTP                                                                */
  /* ------------------------------------------------------------------ */

  private async request<T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
    const headers: Record<string, string> = {
      apikey: this.key,
      'Content-Type': 'application/json',
    };
    // legacy JWT(service_role) 만 Authorization: Bearer 사용 (sb_secret_ 새 키는 apikey 헤더만 사용)
    if (!this.key.startsWith('sb_')) {
      headers.Authorization = `Bearer ${this.key}`;
    }
    if (init.prefer) headers.Prefer = init.prefer;

    let res: Response;
    try {
      res = await fetch(`${this.base}${path}`, {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new Error(`Supabase 연결 실패: ${(err as Error).message}`);
    }

    const text = await res.text();
    if (!res.ok) {
      // 23505 = unique_violation (PostgREST 는 409 로 응답)
      if (res.status === 409 || text.includes('23505')) {
        throw new HttpError(409, '이미 처리된 요청입니다.', 'DUPLICATE');
      }
      throw new Error(`Supabase 오류 (${res.status} ${path}): ${text.slice(0, 300)}`);
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  private q(value: string): string {
    return encodeURIComponent(value);
  }

  private async getDoc<T>(collection: Collection, id: string): Promise<T | null> {
    const rows = await this.request<DocRow<T>[]>(
      `/vl_documents?select=data&collection=eq.${collection}&id=eq.${this.q(id)}&limit=1`,
    );
    return rows[0]?.data ?? null;
  }

  private async listDocs<T>(collection: Collection, filters = ''): Promise<T[]> {
    const rows = await this.request<DocRow<T>[]>(`/vl_documents?select=data&collection=eq.${collection}${filters}`);
    return rows.map((r) => r.data);
  }

  /** upsert (같은 collection+id 면 덮어쓰기) */
  private async putDoc(collection: Collection, id: string, uid: string | undefined, data: unknown): Promise<void> {
    await this.request('/vl_documents?on_conflict=collection,id', {
      method: 'POST',
      body: { collection, id, uid: uid ?? null, data },
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
  }

  /** insert only (유니크 인덱스 위반 시 409 DUPLICATE) */
  private async insertDoc(collection: Collection, id: string, uid: string | undefined, data: unknown): Promise<void> {
    await this.request('/vl_documents', {
      method: 'POST',
      body: { collection, id, uid: uid ?? null, data },
      prefer: 'return=minimal',
    });
  }

  /* ------------------------------------------------------------------ */
  /* Repository                                                          */
  /* ------------------------------------------------------------------ */

  getUser(uid: string) {
    return this.getDoc<PioneerUser>('users', uid);
  }

  async upsertUser(user: PioneerUser) {
    await this.putDoc('users', user.uid, user.uid, user);
    return user;
  }

  listUsers() {
    return this.listDocs<PioneerUser>('users');
  }

  async listMissions(filter: { status?: MissionStatus; origin?: MissionOrigin } = {}) {
    const seeds = SEED_MISSIONS.filter(
      (m) => (!filter.status || m.status === filter.status) && (!filter.origin || m.origin === filter.origin),
    ).map((m) => structuredClone(m));
    if (filter.origin === 'seed') return seeds;

    let filters = '';
    if (filter.status) filters += `&data->>status=eq.${this.q(filter.status)}`;
    const stored = await this.listDocs<Mission>('missions', filters);
    return [...seeds, ...stored];
  }

  async getMission(id: string) {
    const seed = SEED_MISSIONS.find((m) => m.id === id);
    if (seed) return structuredClone(seed);
    return this.getDoc<Mission>('missions', id);
  }

  async saveMission(mission: Mission) {
    if (SEED_IDS.has(mission.id)) throw new Error('시드 미션은 수정할 수 없습니다.');
    await this.putDoc('missions', mission.id, mission.requesterUid, mission);
    return mission;
  }

  getSet(setId: string) {
    return this.getDoc<MissionSet>('sets', setId);
  }

  async saveSet(set: MissionSet) {
    await this.putDoc('sets', set.setId, set.uid, set);
    return set;
  }

  listSets() {
    return this.listDocs<MissionSet>('sets');
  }

  async addVote(missionId: string, choice: Choice) {
    await this.request('/vl_votes', {
      method: 'POST',
      body: { mission_id: missionId, choice },
      prefer: 'return=minimal',
    });
    return this.getVotes(missionId);
  }

  async getVotes(missionId: string) {
    const rows = await this.request<{ choice: Choice }[]>(
      `/vl_votes?select=choice&mission_id=eq.${this.q(missionId)}&order=id.asc`,
    );
    return rows.map((r) => r.choice);
  }

  async addLedgerEntry(entry: LedgerEntry) {
    await this.insertDoc('ledger', entry.id, entry.uid, entry);
    return entry;
  }

  async listLedger(uid: string) {
    const entries = await this.listDocs<LedgerEntry>('ledger', `&uid=eq.${this.q(uid)}`);
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listAllLedger() {
    const entries = await this.listDocs<LedgerEntry>('ledger');
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getPayment(paymentId: string) {
    return this.getDoc<PaymentRecord>('payments', paymentId);
  }

  async savePayment(record: PaymentRecord) {
    await this.putDoc('payments', record.paymentId, record.uid, record);
    return record;
  }
}
