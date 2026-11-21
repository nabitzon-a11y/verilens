import 'server-only';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import type { ApiResponse } from '@/types';
import { PiApiError } from './piPlatform';

/** 라우트 핸들러에서 던지는 HTTP 오류 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, init);
}

export function fail(status: number, error: string, code?: string) {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error, code }, { status });
}

/** JSON 본문 파싱 + zod 검증 (빈 본문은 {} 로 간주) */
export async function parseBody<T>(req: Request, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T> {
  let json: unknown;
  try {
    const text = await req.text();
    if (text.length > 1_000_000) throw new HttpError(413, '요청 본문이 너무 큽니다.', 'PAYLOAD_TOO_LARGE');
    json = text.trim() ? JSON.parse(text) : {};
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, '잘못된 JSON 본문입니다.', 'BAD_JSON');
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new HttpError(400, '요청 값이 올바르지 않습니다.', 'VALIDATION');
  }
  return parsed.data;
}

type Handler = (req: Request) => Promise<Response>;

/** 공통 오류 처리 래퍼 — 내부 오류 상세는 클라이언트에 노출하지 않음 */
export function withErrorHandling(handler: Handler): Handler {
  return async (req) => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.status, err.message, err.code);
      if (err instanceof PiApiError) {
        console.error('[pi-api]', err.status, err.message, err.body);
        return fail(502, 'Pi Platform 서버와 통신 중 오류가 발생했습니다.', 'PI_API_ERROR');
      }
      console.error('[api]', err);
      return fail(500, '서버 오류가 발생했습니다.', 'INTERNAL');
    }
  };
}
