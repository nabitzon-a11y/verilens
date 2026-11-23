import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { ok, parseBody, withErrorHandling } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  topic: z.string().trim().max(60).optional(),
});

export interface GeneratedDraft {
  prompt: string;
  sourceLabel: string;
  aBody: string;
  bBody: string;
  humanSide: 'A' | 'B';
  aiTell: string;
}

const FALLBACK_DRAFTS: GeneratedDraft[] = [
  {
    prompt: '어느 쪽이 실제 사람이 직접 쓴 글일까요?',
    sourceLabel: '당근/중고거래',
    aBody: '에어팟 프로 오른쪽만 잃어버려서 왼쪽이랑 본체만 팝니다. 생활기스 좀 있고 배터리 3시간 정도 가요. 직거래 사당역 6번 출구 가능',
    bBody: '깔끔한 상태의 무선 이어폰을 합리적인 가격에 양도합니다. 뛰어난 음질과 편안한 착용감을 자랑하며 언제든 편하게 문의해 주세요.',
    humanSide: 'A',
    aiTell: 'A는 한쪽 분실·배터리 시간·구체적 역 출구 등 실제 거래자만 적는 조건이 있고, B는 광고 문구처럼 장점만 나열합니다.',
  },
  {
    prompt: '어느 쪽이 실제 사람이 직접 쓴 글일까요?',
    sourceLabel: '배달앱 리뷰',
    aBody: '떡볶이 매운맛 시켰는데 생각보다 달달해서 좋았어요. 튀김은 눅눅할까 봐 소스 따로 요청했는데 바삭하게 잘 왔네요. 김말이 추가 필수!',
    bBody: '정성 가득한 조리와 신선한 재료가 돋보이는 최고의 분식 맛집입니다. 깔끔한 포장과 빠른 배달 덕분에 매우 만족스러운 식사였습니다.',
    humanSide: 'A',
    aiTell: 'B는 구체적 메뉴나 식감 없이 "신선한 재료·만족스러운 식사" 같은 전형적인 AI 칭찬 패턴만 반복합니다.',
  },
  {
    prompt: '어느 쪽이 실제 사람이 직접 쓴 글일까요?',
    sourceLabel: '직장인 커뮤니티',
    aBody: '현대 사회에서 워라밸의 중요성이 날로 커지고 있습니다. 효율적인 시간 관리와 건강한 소통 문화를 통해 업무 만족도를 높일 수 있습니다.',
    bBody: '오늘 점심시간 10분 늦게 들어왔다고 팀장님 눈치 주는데 진짜 현타 오네요. 이직 준비 다시 시작해야지... 커피만 3잔째 마시는 중',
    humanSide: 'B',
    aiTell: 'A는 교과서적인 일반론만 나열하고, B는 구체적 상황과 감정이 생생하게 드러납니다.',
  },
];

async function generateWithGemini(
  apiKey: string,
  topic?: string,
): Promise<{ drafts: GeneratedDraft[] } | { error: string }> {
  const focus = topic || '쇼핑몰 리뷰, 중고거래, 배달 후기, 직장/학교 커뮤니티, 여행 후기';
  const promptText = `You are generating 3 Korean A/B comparison items for VeriLens (human vs AI text detection).
Topic focus: ${focus}.
For each item, create ONE realistic human-written Korean text (2-3 sentences, casual/specific lived details, minor imperfections or concrete numbers/places) and ONE AI-written Korean text (2-3 sentences, overly polished, abstract praise or textbook summary).
Randomize whether the human text is A or B.
Return ONLY valid JSON array of 3 objects with exact keys:
prompt (string), sourceLabel (string), aBody (string), bBody (string), humanSide ("A" or "B"), aiTell (string, 1-sentence Korean explanation).`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.9,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { error: `Gemini HTTP ${res.status}: ${errText.slice(0, 120)}` };
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return { error: 'Gemini 응답이 비어 있습니다.' };
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { error: 'Gemini JSON 형식이 배열이 아닙니다.' };

    const valid: GeneratedDraft[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.prompt === 'string' &&
        typeof item.sourceLabel === 'string' &&
        typeof item.aBody === 'string' &&
        typeof item.bBody === 'string' &&
        (item.humanSide === 'A' || item.humanSide === 'B') &&
        typeof item.aiTell === 'string'
      ) {
        valid.push(item as GeneratedDraft);
      }
    }
    if (valid.length === 0) return { error: 'Gemini 응답 필드가 맞지 않습니다.' };
    return { drafts: valid.slice(0, 3) };
  } catch (err) {
    return { error: `Gemini 호출 실패: ${(err as Error).message}` };
  }
}

/** 관리자용 AI 문항 초안 생성 (GEMINI_API_KEY 설정 시 실시간 생성, 미설정 시 내장 템플릿) */
export const POST = withErrorHandling(async (req) => {
  await requireAdmin(req);
  const { topic } = await parseBody(req, schema);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return ok({ source: 'template' as const, reason: 'GEMINI_API_KEY 미설정', drafts: FALLBACK_DRAFTS });
  }

  const result = await generateWithGemini(apiKey, topic);
  if ('drafts' in result) {
    return ok({ source: 'gemini' as const, drafts: result.drafts });
  }

  return ok({ source: 'template' as const, reason: result.error, drafts: FALLBACK_DRAFTS });
});
