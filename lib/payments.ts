import 'server-only';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type {
  AuthSessionPayload,
  IncompletePaymentResponse,
  Mission,
  PaymentCompleteResponse,
  PaymentRecord,
  PaymentsMode,
  PiPaymentDTO,
  SubmissionPaymentMetadata,
} from '@/types';
import { WALLET, roundPi } from './constants';
import { HttpError } from './http';
import { withLock } from './lock';
import * as pi from './piPlatform';
import { getRepository } from './repository';

/**
 * 의뢰자 문항 등록 결제 (U2A) 서비스
 *
 * 흐름: [클라이언트] 문항 draft 생성 → Pi.createPayment(metadata.draftId)
 *   → onReadyForServerApproval → POST /api/payments/approve  (여기서 서버 검증 후 승인)
 *   → 사용자 지갑 서명 → onReadyForServerCompletion → POST /api/payments/complete
 *   → 서버가 txid 검증 후 완료 처리 + 문항을 판별 풀(active)로 활성화
 *
 * Mock 결제(paymentId 가 mock_ 로 시작)는 아래 경우에만 허용합니다.
 *  - PI_API_KEY 미설정(mock 모드)
 *  - 데모 사용자(Pi 계정이 없어 실결제가 불가능한 심사위원 시연)
 */

const metadataSchema = z.object({
  kind: z.literal('mission_submission'),
  draftId: z.string().min(1).max(100),
});

const STALE_APPROVAL_MS = 10 * 60 * 1000;
const now = () => new Date().toISOString();
const sameAmount = (a: number, b: number) => Math.abs(a - b) < 1e-7;

export function getPaymentsMode(): PaymentsMode {
  return pi.isPiApiConfigured() ? 'live' : 'mock';
}

function canUseMock(auth: AuthSessionPayload): boolean {
  return getPaymentsMode() === 'mock' || auth.mode === 'demo';
}

function assertPaymentId(paymentId: string) {
  if (!pi.isValidPaymentId(paymentId)) throw new HttpError(400, '잘못된 결제 ID 형식입니다.', 'BAD_PAYMENT_ID');
}

/** Pi 서버에서 받은 결제가 우리 앱의 정상 문항 등록 결제인지 검증 */
function validateLivePayment(p: PiPaymentDTO, uid: string): SubmissionPaymentMetadata {
  if (p.user_uid !== uid) throw new HttpError(403, '본인의 결제가 아닙니다.', 'FORBIDDEN');
  if (p.direction !== 'user_to_app') throw new HttpError(400, '결제 방향이 올바르지 않습니다.', 'BAD_DIRECTION');
  if (p.status.cancelled || p.status.user_cancelled) throw new HttpError(409, '취소된 결제입니다.', 'PAYMENT_CANCELLED');
  if (!sameAmount(p.amount, WALLET.SUBMISSION_FEE_PI)) {
    throw new HttpError(400, '결제 금액이 등록 수수료와 다릅니다.', 'BAD_AMOUNT');
  }
  const md = metadataSchema.safeParse(p.metadata);
  if (!md.success) throw new HttpError(400, '결제 메타데이터가 올바르지 않습니다.', 'BAD_METADATA');
  return md.data;
}

/** 본인의 결제 대기 문항인지 확인하고, 다른 결제가 진행 중이면 거부 */
async function getPayableDraft(draftId: string, uid: string, paymentId: string): Promise<Mission> {
  const repo = getRepository();
  const draft = await repo.getMission(draftId);

  if (!draft || draft.origin !== 'requester') {
    throw new HttpError(404, '등록 대기 중인 문항을 찾을 수 없습니다.', 'DRAFT_NOT_FOUND');
  }
  if (draft.requesterUid !== uid) throw new HttpError(403, '본인이 작성한 문항만 결제할 수 있습니다.', 'FORBIDDEN');
  if (draft.status !== 'draft') throw new HttpError(409, '이미 등록이 완료된 문항입니다.', 'DRAFT_NOT_PENDING');

  if (draft.paymentId && draft.paymentId !== paymentId) {
    const prev = await repo.getPayment(draft.paymentId);
    const fresh = prev && Date.now() - Date.parse(prev.updatedAt) < STALE_APPROVAL_MS;
    if (prev?.status === 'approved' && fresh) {
      throw new HttpError(409, '이 문항에 대해 이미 진행 중인 결제가 있습니다.', 'PAYMENT_IN_PROGRESS');
    }
  }
  return draft;
}

/* ================================================================== */
/* 1) 승인                                                             */
/* ================================================================== */

export interface MockPaymentInput {
  draftId: string;
  amount: number;
  memo: string;
}

export async function approveSubmissionPayment(
  auth: AuthSessionPayload,
  paymentId: string,
  mockInput?: MockPaymentInput,
): Promise<PaymentRecord> {
  assertPaymentId(paymentId);
  const repo = getRepository();

  return withLock(`payment:${paymentId}`, async () => {
    const existing = await repo.getPayment(paymentId);
    if (existing) {
      if (existing.uid !== auth.uid) throw new HttpError(403, '본인의 결제가 아닙니다.', 'FORBIDDEN');
      if (existing.status === 'approved' || existing.status === 'completed') return existing; // 멱등
      throw new HttpError(409, '취소되었거나 실패한 결제입니다.', 'PAYMENT_CLOSED');
    }

    const isMock = paymentId.startsWith('mock_');
    let metadata: SubmissionPaymentMetadata;
    let amount: number;
    let memo: string;

    if (isMock) {
      if (!canUseMock(auth)) {
        throw new HttpError(400, '실결제 모드에서는 Mock 결제를 사용할 수 없습니다.', 'MOCK_NOT_ALLOWED');
      }
      if (!mockInput) throw new HttpError(400, 'Mock 결제 정보가 없습니다.', 'VALIDATION');
      if (!sameAmount(mockInput.amount, WALLET.SUBMISSION_FEE_PI)) {
        throw new HttpError(400, '결제 금액이 등록 수수료와 다릅니다.', 'BAD_AMOUNT');
      }
      metadata = { kind: 'mission_submission', draftId: mockInput.draftId };
      amount = WALLET.SUBMISSION_FEE_PI;
      memo = mockInput.memo;
    } else {
      if (getPaymentsMode() !== 'live') {
        throw new HttpError(503, 'PI_API_KEY 가 설정되지 않아 실결제를 승인할 수 없습니다.', 'PI_API_NOT_CONFIGURED');
      }
      if (auth.mode !== 'pi') throw new HttpError(403, 'Pi 계정으로 로그인해야 결제할 수 있습니다.', 'FORBIDDEN');
      const payment = await pi.fetchPayment(paymentId);
      metadata = validateLivePayment(payment, auth.uid);
      amount = payment.amount;
      memo = payment.memo;
    }

    return withLock(`draft:${metadata.draftId}`, async () => {
      const draft = await getPayableDraft(metadata.draftId, auth.uid, paymentId);

      if (!isMock) await pi.approvePayment(paymentId);

      const timestamp = now();
      const record: PaymentRecord = {
        paymentId,
        uid: auth.uid,
        amount,
        memo,
        metadata,
        status: 'approved',
        mock: isMock,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await repo.savePayment(record);
      await repo.saveMission({ ...draft, paymentId }); // 진행 중 결제로 예약
      return record;
    });
  });
}

/* ================================================================== */
/* 2) 완료                                                             */
/* ================================================================== */

/** 완료 처리 공통: 기록 갱신 + 문항 활성화 + 원장 기록 (반드시 lock 내부에서 호출) */
async function finalizeCompletion(record: PaymentRecord, txid: string): Promise<PaymentCompleteResponse> {
  const repo = getRepository();
  const wasCompleted = record.status === 'completed';
  const updated: PaymentRecord = { ...record, status: 'completed', txid, updatedAt: now() };
  await repo.savePayment(updated);

  let missionId: string | undefined;
  const draft = record.metadata.draftId ? await repo.getMission(record.metadata.draftId) : null;
  if (draft && draft.origin === 'requester' && draft.requesterUid === record.uid) {
    if (draft.status === 'draft') {
      await repo.saveMission({ ...draft, status: 'active', paymentId: record.paymentId });
    }
    missionId = draft.id;
  }

  if (!wasCompleted) {
    await repo.addLedgerEntry({
      id: randomUUID(),
      uid: record.uid,
      type: 'submission_payment',
      amount: roundPi(-record.amount),
      status: 'settled',
      memo: '판별 문항 등록 결제',
      paymentId: record.paymentId,
      txid,
      mock: record.mock,
      createdAt: now(),
    });
  }

  return { paymentId: record.paymentId, status: 'completed', missionId, mock: record.mock };
}

/** 서버 재시작 등으로 승인 기록이 사라졌을 때 Pi 서버 기준으로 복원 (live 전용) */
async function rebuildRecordFromPi(uid: string, paymentId: string): Promise<PaymentRecord> {
  if (getPaymentsMode() !== 'live' || paymentId.startsWith('mock_')) {
    throw new HttpError(404, '결제 기록을 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND');
  }
  const payment = await pi.fetchPayment(paymentId);
  const metadata = validateLivePayment(payment, uid);
  if (!payment.status.developer_approved) {
    throw new HttpError(409, '서버 승인이 되지 않은 결제입니다.', 'PAYMENT_NOT_APPROVED');
  }
  const timestamp = now();
  const record: PaymentRecord = {
    paymentId,
    uid,
    amount: payment.amount,
    memo: payment.memo,
    metadata,
    status: 'approved',
    mock: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return getRepository().savePayment(record);
}

export async function completeSubmissionPayment(
  auth: AuthSessionPayload,
  paymentId: string,
  txid: string,
): Promise<PaymentCompleteResponse> {
  assertPaymentId(paymentId);
  if (!pi.isValidTxid(txid)) throw new HttpError(400, '잘못된 txid 형식입니다.', 'BAD_TXID');

  return withLock(`payment:${paymentId}`, async () => {
    const record = (await getRepository().getPayment(paymentId)) ?? (await rebuildRecordFromPi(auth.uid, paymentId));

    if (record.uid !== auth.uid) throw new HttpError(403, '본인의 결제가 아닙니다.', 'FORBIDDEN');

    if (record.status === 'completed') {
      if (record.txid !== txid) throw new HttpError(409, '이미 다른 트랜잭션으로 완료된 결제입니다.', 'TXID_MISMATCH');
      return finalizeCompletion(record, txid); // 멱등 (원장 중복 기록 없음)
    }
    if (record.status !== 'approved') {
      throw new HttpError(409, '승인 상태가 아닌 결제는 완료할 수 없습니다.', 'PAYMENT_NOT_APPROVED');
    }

    if (record.mock) {
      if (!txid.startsWith('mocktx_')) throw new HttpError(400, 'Mock 결제의 txid 형식이 아닙니다.', 'BAD_TXID');
    } else {
      const payment = await pi.fetchPayment(paymentId);
      validateLivePayment(payment, auth.uid);
      if (!payment.transaction || payment.transaction.txid !== txid) {
        throw new HttpError(400, '블록체인 트랜잭션 정보가 일치하지 않습니다.', 'TXID_MISMATCH');
      }
      if (!payment.status.developer_completed) await pi.completePayment(paymentId, txid);
    }

    return withLock(`draft:${record.metadata.draftId}`, () => finalizeCompletion(record, txid));
  });
}

/* ================================================================== */
/* 3) 취소                                                             */
/* ================================================================== */

export async function cancelSubmissionPayment(auth: AuthSessionPayload, paymentId: string) {
  assertPaymentId(paymentId);
  const repo = getRepository();

  return withLock(`payment:${paymentId}`, async () => {
    const record = await repo.getPayment(paymentId);
    if (!record) return { paymentId, status: 'cancelled' as const };
    if (record.uid !== auth.uid) throw new HttpError(403, '본인의 결제가 아닙니다.', 'FORBIDDEN');
    if (record.status === 'completed') throw new HttpError(409, '이미 완료된 결제는 취소할 수 없습니다.', 'PAYMENT_COMPLETED');

    await repo.savePayment({ ...record, status: 'cancelled', updatedAt: now() });
    return { paymentId, status: 'cancelled' as const };
  });
}

/* ================================================================== */
/* 4) 미완료 결제 복구 (Pi.authenticate 의 onIncompletePaymentFound)   */
/* ================================================================== */

/**
 * 클라이언트가 보낸 결제 객체는 신뢰하지 않고, paymentId 로 Pi 서버에서 다시 조회합니다.
 *  - 트랜잭션이 있으면 → 완료 처리 (사용자가 이미 지불했으므로 반드시 완료)
 *  - 트랜잭션이 없으면 → 취소 (새 결제를 막는 '걸린 결제' 해소)
 */
export async function recoverIncompletePayment(
  auth: AuthSessionPayload,
  paymentId: string,
): Promise<IncompletePaymentResponse> {
  assertPaymentId(paymentId);
  if (paymentId.startsWith('mock_') || getPaymentsMode() !== 'live' || auth.mode !== 'pi') {
    return { action: 'none' };
  }
  const repo = getRepository();

  return withLock(`payment:${paymentId}`, async () => {
    const payment = await pi.fetchPayment(paymentId);
    if (payment.user_uid !== auth.uid) throw new HttpError(403, '본인의 결제가 아닙니다.', 'FORBIDDEN');

    const md = metadataSchema.safeParse(payment.metadata);
    const timestamp = now();
    const record: PaymentRecord = (await repo.getPayment(paymentId)) ?? {
      paymentId,
      uid: auth.uid,
      amount: payment.amount,
      memo: payment.memo,
      // 우리 앱 형식이 아닌 결제라도 사용자가 지불했다면 완료는 해줘야 하므로 빈 draftId 로 기록
      metadata: md.success ? md.data : { kind: 'mission_submission', draftId: '' },
      status: 'approved',
      mock: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const txid = payment.transaction?.txid;

    if (payment.status.developer_completed) {
      if (record.status !== 'completed' && txid) await finalizeCompletion(record, txid);
      return { action: 'already_completed' };
    }

    if (txid) {
      await pi.completePayment(paymentId, txid);
      const result = await finalizeCompletion(record, txid);
      return { action: 'completed', missionId: result.missionId };
    }

    try {
      await pi.cancelPayment(paymentId);
    } catch (err) {
      console.error('[payments] 미완료 결제 취소 실패', paymentId, err);
      return { action: 'none' };
    }
    await repo.savePayment({ ...record, status: 'cancelled', updatedAt: timestamp });
    return { action: 'cancelled' };
  });
}
