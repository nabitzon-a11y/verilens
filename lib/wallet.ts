import 'server-only';
import { createHash, randomUUID } from 'crypto';
import type { ClaimResponse, LedgerEntry, WalletResponse } from '@/types';
import { WALLET, roundPi } from './constants';
import { HttpError } from './http';
import { withLock } from './lock';
import { getPiVerifyAdapter } from './piVerify';
import { getRepository } from './repository';
import { toProfile } from './users';

/**
 * 지갑 / 보상 청구(Claim)
 *
 * 출금은 반드시 PiVerify 3단계(claim_reverify) 토큰이 있어야 하며, 토큰은 1회만 사용할 수 있습니다.
 *
 * ⚠️ 실제 A2U(App-to-User) 송금은 앱 지갑 시드(PI_WALLET_PRIVATE_SEED)와 Pi 백엔드 SDK가 필요합니다.
 *    해커톤 MVP 에서는 원장에만 기록하는 Mock 정산으로 처리합니다.
 */

const LEDGER_LIMIT = 50;

function payoutMode(): 'live' | 'mock' {
  // TODO: A2U 연동 구현 후 PI_WALLET_PRIVATE_SEED && PI_API_KEY 설정 시 'live'
  return 'mock';
}

export async function getWallet(uid: string): Promise<WalletResponse> {
  const repo = getRepository();
  const user = await repo.getUser(uid);
  if (!user) throw new HttpError(401, '사용자 정보를 찾을 수 없습니다.', 'UNAUTHORIZED');

  const ledger = (await repo.listLedger(uid)).slice(0, LEDGER_LIMIT);
  return {
    profile: toProfile(user),
    ledger,
    minClaim: WALLET.MIN_CLAIM_PI,
    canClaim: user.balance >= WALLET.MIN_CLAIM_PI,
    payoutMode: payoutMode(),
  };
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function claimRewards(uid: string, claimToken: string): Promise<ClaimResponse> {
  const session = getPiVerifyAdapter().validate(claimToken, uid, ['claim_reverify']);
  if (!session) {
    throw new HttpError(401, '출금 전 인간 재검증이 필요합니다. 다시 시도해 주세요.', 'CLAIM_REVERIFY_REQUIRED');
  }

  const repo = getRepository();
  const ref = hashToken(claimToken);

  return withLock(`user:${uid}`, async () => {
    const ledger = await repo.listLedger(uid);
    if (ledger.some((e) => e.ref === ref)) {
      throw new HttpError(409, '이미 사용된 재검증 토큰입니다. 다시 인증해 주세요.', 'CLAIM_TOKEN_USED');
    }

    const user = await repo.getUser(uid);
    if (!user) throw new HttpError(401, '사용자 정보를 찾을 수 없습니다.', 'UNAUTHORIZED');

    const amount = roundPi(user.balance);
    if (amount < WALLET.MIN_CLAIM_PI) {
      throw new HttpError(400, `최소 ${WALLET.MIN_CLAIM_PI} π 이상부터 청구할 수 있습니다.`, 'BELOW_MIN_CLAIM');
    }

    const now = new Date().toISOString();
    const mock = payoutMode() === 'mock';
    const entry: LedgerEntry = {
      id: randomUUID(),
      uid,
      type: 'claim',
      amount: roundPi(-amount),
      status: 'settled',
      memo: mock ? '보상 청구 (Mock A2U 정산)' : '보상 청구 (A2U)',
      ref,
      mock,
      createdAt: now,
    };

    // 원장 먼저 기록: DB 유니크 인덱스(토큰당 1회)가 다중 인스턴스 이중 출금을 차단
    await repo.addLedgerEntry(entry);
    const updated = await repo.upsertUser({
      ...user,
      balance: 0,
      totalClaimed: roundPi(user.totalClaimed + amount),
      updatedAt: now,
    });

    return { amount, entry, profile: toProfile(updated), mock };
  });
}
