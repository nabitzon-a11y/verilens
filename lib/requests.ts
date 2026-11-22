import 'server-only';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { DraftResponse, Mission, MissionContent, MyMissionItem } from '@/types';
import { decideConsensus, tallyVotes } from './consensus';
import { WALLET } from './constants';
import { HttpError } from './http';
import { withLock } from './lock';
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

const modeSchema = z.enum(['compare', 'single']).default('compare');

export const draftSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    mode: modeSchema,
    prompt: z.string().trim().max(80).optional(),
    sourceLabel: z.string().trim().max(30).optional(),
    a: text,
    b: text.optional(),
  }),
  z.object({
    kind: z.literal('image'),
    mode: modeSchema,
    prompt: z.string().trim().max(80).optional(),
    a: image,
    b: image.optional(),
  }),
]);

export type DraftInput = z.infer<typeof draftSchema>;

const DEFAULT_PROMPT = {
  compare: {
    text: '어느 쪽이 실제 사람이 직접 쓴 글일까요?',
    image: '어느 쪽이 AI가 만들지 않은 원본 장면일까요?',
  },
  single: {
    text: '이 글은 실제 사람이 썼을까요, AI가 썼을까요?',
    image: '이 이미지는 실제 원본일까요, AI 생성물일까요?',
  },
} as const;

export async function createDraft(uid: string, input: DraftInput): Promise<DraftResponse> {
  const repo = getRepository();
  const mode = input.mode ?? 'compare';

  const pending = (await repo.listMissions({ origin: 'requester', status: 'draft' }))
    .filter((m) => m.requesterUid === uid)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (pending.length >= MAX_PENDING_DRAFTS) {
    const stale = pending.slice(0, pending.length - MAX_PENDING_DRAFTS + 1);
    await Promise.all(stale.map((m) => repo.saveMission({ ...m, status: 'closed' })));
  }

  let a: MissionContent;
  let b: MissionContent;
  if (input.kind === 'text') {
    a = { type: 'text', body: input.a, sourceLabel: input.sourceLabel || undefined };
    if (mode === 'single') {
      b = { type: 'text', body: 'AI 생성 · 합성' };
    } else {
      if (!input.b) throw new HttpError(400, '비교할 B 텍스트를 입력하세요.', 'VALIDATION');
      if (input.a === input.b) throw new HttpError(400, 'A와 B에 서로 다른 내용을 입력하세요.', 'SAME_CONTENT');
      b = { type: 'text', body: input.b, sourceLabel: input.sourceLabel || undefined };
    }
  } else {
    a = { type: 'image', src: input.a, alt: '의뢰 이미지', placeholderLabel: '의뢰 이미지' };
    if (mode === 'single') {
      b = { type: 'text', body: 'AI 생성 · 합성' };
    } else {
      if (!input.b) throw new HttpError(400, '비교할 B 이미지를 올려 주세요.', 'VALIDATION');
      if (input.a === input.b) throw new HttpError(400, 'A와 B에 서로 다른 이미지를 올려 주세요.', 'SAME_CONTENT');
      b = { type: 'image', src: input.b, alt: '의뢰 이미지 B', placeholderLabel: '의뢰 이미지 B' };
    }
  }

  const mission: Mission = {
    id: `req-${randomUUID()}`,
    kind: input.kind,
    mode,
    category: 'custom',
    prompt: input.prompt || DEFAULT_PROMPT[mode][input.kind],
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
        mode: m.mode,
        prompt: m.prompt,
        status: m.status,
        votes,
        consensus: decideConsensus(votes),
        createdAt: m.createdAt,
      };
    }),
  );
}

const REPORT_AUTO_HIDE_THRESHOLD = 2;

export type ReportReason = 'copyright' | 'harmful' | 'spam';

/**
 * 문항 신고 (저작권 침해 / 유해 콘텐츠 / 스팸)
 * - 의뢰자 문항에 서로 다른 인증 사용자 2명 이상이 신고하면 즉시 비공개(closed) 처리
 */
export async function reportMission(
  uid: string,
  missionId: string,
  _reason: ReportReason,
): Promise<{ reported: boolean; hidden: boolean }> {
  const repo = getRepository();
  const mission = await repo.getMission(missionId);
  if (!mission) throw new HttpError(404, '문항을 찾을 수 없습니다.', 'MISSION_NOT_FOUND');
  if (mission.origin === 'seed') return { reported: true, hidden: false };

  return withLock(`mission:${missionId}`, async () => {
    const latest = await repo.getMission(missionId);
    if (!latest) throw new HttpError(404, '문항을 찾을 수 없습니다.', 'MISSION_NOT_FOUND');

    const reporters = new Set(latest.reportedBy ?? []);
    if (reporters.has(uid)) {
      return { reported: true, hidden: latest.status === 'closed' };
    }
    reporters.add(uid);
    const count = reporters.size;
    const shouldHide = count >= REPORT_AUTO_HIDE_THRESHOLD;

    await repo.saveMission({
      ...latest,
      reportCount: count,
      reportedBy: [...reporters],
      status: shouldHide ? 'closed' : latest.status,
    });
    return { reported: true, hidden: shouldHide };
  });
}

/** 의뢰자가 본인의 문항을 직접 마감(중단) */
export async function closeMyMission(uid: string, missionId: string): Promise<{ closed: boolean }> {
  const repo = getRepository();
  return withLock(`mission:${missionId}`, async () => {
    const mission = await repo.getMission(missionId);
    if (!mission || mission.origin !== 'requester') {
      throw new HttpError(404, '문항을 찾을 수 없습니다.', 'MISSION_NOT_FOUND');
    }
    if (mission.requesterUid !== uid) {
      throw new HttpError(403, '본인이 의뢰한 문항만 마감할 수 있습니다.', 'FORBIDDEN');
    }
    if (mission.status !== 'closed') {
      await repo.saveMission({ ...mission, status: 'closed' });
    }
    return { closed: true };
  });
}
