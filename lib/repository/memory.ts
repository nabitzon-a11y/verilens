import 'server-only';
import { SEED_MISSIONS } from '@/data/missions';
import type {
  Choice,
  DataSnapshot,
  LedgerEntry,
  Mission,
  MissionOrigin,
  MissionSet,
  MissionStatus,
  PaymentRecord,
  PioneerUser,
  Repository,
} from '@/types';

export function emptySnapshot(): DataSnapshot {
  return { version: 1, users: {}, missions: {}, sets: {}, votes: {}, ledger: [], payments: {} };
}

/** 저장소 내부 객체가 외부에서 변형되지 않도록 항상 복제해 주고받음 */
const clone = <T>(value: T): T => structuredClone(value);

const SEED_IDS = new Set(SEED_MISSIONS.map((m) => m.id));

/**
 * 서버 메모리 저장소
 * - 시드 미션(data/missions.ts)은 읽기 전용으로 합쳐서 제공하고, 저장은 의뢰자 문항만 합니다.
 * - 하위 클래스는 persist() 를 오버라이드해 영속화(JSON 파일, DB 등)를 구현합니다.
 */
export class MemoryRepository implements Repository {
  protected data: DataSnapshot;

  constructor(initial?: DataSnapshot) {
    this.data = initial ?? emptySnapshot();
  }

  /** 변경 후 호출되는 영속화 훅 (메모리 저장소는 아무것도 하지 않음) */
  protected async persist(): Promise<void> {}

  /* ---------- users ---------- */
  async getUser(uid: string): Promise<PioneerUser | null> {
    const user = this.data.users[uid];
    return user ? clone(user) : null;
  }

  async upsertUser(user: PioneerUser): Promise<PioneerUser> {
    this.data.users[user.uid] = clone(user);
    await this.persist();
    return clone(user);
  }

  /* ---------- missions ---------- */
  async listMissions(filter: { status?: MissionStatus; origin?: MissionOrigin } = {}): Promise<Mission[]> {
    return [...SEED_MISSIONS, ...Object.values(this.data.missions)]
      .filter((m) => (!filter.status || m.status === filter.status) && (!filter.origin || m.origin === filter.origin))
      .map(clone);
  }

  async getMission(id: string): Promise<Mission | null> {
    const mission = SEED_MISSIONS.find((m) => m.id === id) ?? this.data.missions[id];
    return mission ? clone(mission) : null;
  }

  async saveMission(mission: Mission): Promise<Mission> {
    if (SEED_IDS.has(mission.id)) throw new Error('시드 미션은 수정할 수 없습니다.');
    this.data.missions[mission.id] = clone(mission);
    await this.persist();
    return clone(mission);
  }

  /* ---------- sets ---------- */
  async getSet(setId: string): Promise<MissionSet | null> {
    const set = this.data.sets[setId];
    return set ? clone(set) : null;
  }

  async saveSet(set: MissionSet): Promise<MissionSet> {
    this.data.sets[set.setId] = clone(set);
    await this.persist();
    return clone(set);
  }

  /* ---------- votes ---------- */
  async addVote(missionId: string, choice: Choice): Promise<Choice[]> {
    const votes = this.data.votes[missionId] ?? [];
    votes.push(choice);
    this.data.votes[missionId] = votes;
    await this.persist();
    return [...votes];
  }

  async getVotes(missionId: string): Promise<Choice[]> {
    return [...(this.data.votes[missionId] ?? [])];
  }

  /* ---------- ledger ---------- */
  async addLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    this.data.ledger.push(clone(entry));
    await this.persist();
    return clone(entry);
  }

  async listLedger(uid: string): Promise<LedgerEntry[]> {
    return this.data.ledger
      .filter((e) => e.uid === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  /* ---------- payments ---------- */
  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    const record = this.data.payments[paymentId];
    return record ? clone(record) : null;
  }

  async savePayment(record: PaymentRecord): Promise<PaymentRecord> {
    this.data.payments[record.paymentId] = clone(record);
    await this.persist();
    return clone(record);
  }
}
