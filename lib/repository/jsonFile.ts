import 'server-only';
import fs from 'fs';
import path from 'path';
import type { DataSnapshot } from '@/types';
import { MemoryRepository, emptySnapshot } from './memory';

/**
 * JSON 파일 저장소 (로컬 개발/해커톤 시연용)
 * - 시작 시 파일을 메모리로 읽고, 변경될 때마다 임시 파일에 쓴 뒤 rename 으로 교체(원자적 저장)
 * - 쓰기는 직렬화 큐로 처리해 동시 저장 충돌을 막습니다.
 * - 파일이 손상되었으면 .corrupt-<시각> 으로 백업하고 빈 저장소로 시작합니다.
 */
export class JsonFileRepository extends MemoryRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {
    super(JsonFileRepository.load(filePath));
  }

  private static load(filePath: string): DataSnapshot {
    if (!fs.existsSync(filePath)) return emptySnapshot();
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<DataSnapshot>;
      if (parsed?.version !== 1) throw new Error(`지원하지 않는 데이터 버전: ${String(parsed?.version)}`);
      return { ...emptySnapshot(), ...parsed } as DataSnapshot;
    } catch (err) {
      const backup = `${filePath}.corrupt-${Date.now()}`;
      console.error(`[repo] 데이터 파일을 읽지 못해 백업 후 초기화합니다 → ${backup}`, err);
      try {
        fs.renameSync(filePath, backup);
      } catch {
        /* 백업 실패 시에도 서비스는 계속 */
      }
      return emptySnapshot();
    }
  }

  protected override async persist(): Promise<void> {
    const snapshot = JSON.stringify(this.data, null, 2);
    const target = this.filePath;

    this.writeQueue = this.writeQueue
      .then(async () => {
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        const tmp = `${target}.${process.pid}.tmp`;
        await fs.promises.writeFile(tmp, snapshot, 'utf8');
        await fs.promises.rename(tmp, target);
      })
      .catch((err) => {
        console.error('[repo] 데이터 파일 저장 실패', err);
      });

    return this.writeQueue;
  }
}
