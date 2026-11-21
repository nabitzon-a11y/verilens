import 'server-only';

/**
 * 프로세스 내 키 단위 비동기 뮤텍스
 * - 동일 결제 ID에 approve/complete/incomplete 가 동시에 들어오거나,
 *   같은 사용자가 Claim 을 연타할 때의 이중 처리(race condition)를 막습니다.
 * - 단일 서버 프로세스 기준입니다. 다중 인스턴스 배포 시 DB 트랜잭션/행 잠금으로 교체하세요.
 */

type G = typeof globalThis & { __verilensLocks?: Map<string, Promise<void>> };
const g = globalThis as G;
const locks = (g.__verilensLocks ??= new Map<string, Promise<void>>());

export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();

  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  locks.set(key, chained);

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === chained) locks.delete(key);
  }
}
