import 'server-only';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { DraftResponse, Mission, MissionContent, MyMissionItem } from '@/types';
import { decideConsensus, tallyVotes } from './consensus';
import { WALLET } from './constants';
import { HttpError } from './http';
import { getRepository } from './repository';

/**
 * 의뢰자(B2B) 문항 등록
 *  1) draft 생성 (status: draft) → 2) U2A 결제 (lib/payments.ts) → 3) 결제 완료 시 active 로 전환
 */

const MAX_PENDING_DRAFTS = 5;
/** base64 data URL 최대 길이 (≈ 330KB 이미지) */
const MAX_IMAGE_DATA_URL = 450_000;
const IMAGE_DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const text = z.string().trim().min(10, '텍스트는 10자 이상 입력하세요.').max(600, '텍스트는 600자 이하로 입력하세요.');
const image = z
  .string()
  .max(MAX_IMAGE_DATA_URL, '이미지 용량이 너무 큽니다.')
  .regex(IMAGE_DATA_URL_RE, 'PNG/JPEG/WEBP 이미지만 등록할 수 있습니다.');

export const draftSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    prompt: z.string().trim().max(80).optional(),
    sourceLabel: z.string().trim().max(30).optional(),
    a: text,
    b: text,
  }),
  z.object({
    kind: z.literal('image'),
    prompt: z.string().trim().max(80).optional(),
    a: image,
    b: image,
  }),
]);

export type DraftInput = z.infer<typeof draftSchema>;

const DEFAULT_PROMPT = {
  text: '어느 쪽이 실제 사람이 직접 쓴 글일까요?',
  image: '어느 쪽이 AI가 만들지 않은 원본 장면일까요?',
} as const;

export async function createDraft(uid: string, input: DraftInput): Promise<DraftResponse> {
  const repo = getRepository();

  const pending = (await repo.listMissions({ origin: 'requester', status: 'draft' })).filter(
    (m) => m.requesterUid === uid,
  );
  if (pending.length >= MAX_PENDING_DRAFTS) {
    throw new HttpError(429, `결제 대기 중인 문항이 ${MAX_PENDING_DRAFTS}개를 넘었습니다. 먼저 결제를 완료해 주세요.`, 'TOO_MANY_DRAFTS');
  }

  let a: MissionContent;
  let b: MissionContent;
  if (input.kind === 'text') {
    if (input.a === input.b) throw new HttpError(400, 'A와 B에 서로 다른 내용을 입력하세요.', 'SAME_CONTENT');
    a = { type: 'text', body: input.a, sourceLabel: input.sourceLabel || undefined };
    b = { type: 'text', body: input.b, sourceLabel: input.sourceLabel || undefined };
  } else {
    if (input.a === input.b) throw new HttpError(400, 'A와 B에 서로 다른 이미지를 올려 주세요.', 'SAME_CONTENT');
    a = { type: 'image', src: input.a, alt: '의뢰 이미지 A', placeholderLabel: '의뢰 이미지 A' };
    b = { type: 'image', src: input.b, alt: '의뢰 이미지 B', placeholderLabel: '의뢰 이미지 B' };
  }

  const mission: Mission = {
    id: `req-${randomUUID()}`,
    kind: input.kind,
    category: 'custom',
    prompt: input.prompt || DEFAULT_PROMPT[input.kind],
    a,
    b,
    isGold: false,
    priorVotes: [],
    aiTell: '',
    difficulty: 2,
    origin: 'requester',
    status: 'draft',
    requesterUid: uid,
    createdAt: new Date().toISOString(),
  };
  await repo.saveMission(mission);

  return { draftId: mission.id, fee: WALLET.SUBMISSION_FEE_PI };
}

/** 내가 의뢰한 문항 + 실제 응답 집계 */
export async function listMyMissions(uid: string): Promise<MyMissionItem[]> {
  const repo = getRepository();
  const mine = (await repo.listMissions({ origin: 'requester' }))
    .filter((m) => m.requesterUid === uid)
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt));

  return Promise.all(
    mine.map(async (m) => {
      const votes = tallyVotes(await repo.getVotes(m.id));
      return {
        id: m.id,
        kind: m.kind,
        prompt: m.prompt,
        status: m.status,
        votes,
        consensus: decideConsensus(votes),
        createdAt: m.createdAt,
      };
    }),
  );
}
