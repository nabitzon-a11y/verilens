import { ok, withErrorHandling } from '@/lib/http';
import { tallyVotes } from '@/lib/consensus';
import { getRepository } from '@/lib/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface AlertFeedItem {
  id: string;
  isLiveSubmission: boolean;
  categoryLabel: { ko: string; en: string };
  title: { ko: string; en: string };
  sample: { ko: string; en: string };
  tip: { ko: string; en: string };
  aiPercent: number;
  votesCount: number;
  reasons: string[];
  createdAt: string;
}

const CURATED_ALERTS: AlertFeedItem[] = [
  {
    id: 'curated-smishing-delivery',
    isLiveSubmission: false,
    categoryLabel: { ko: '택배 스미싱', en: 'Delivery Smishing' },
    title: { ko: '주소지 불명 · 단축 URL 클릭 유도 문자', en: 'Unknown address + shortened link smishing' },
    sample: {
      ko: '[CJ대한통운] 고객님 주소지 불명으로 배송이 보류되었습니다. 금일 내 미확인 시 반송 처리되오니 아래 링크에서 주소 재입력 바랍니다: bit.ly/3xK...',
      en: '[Delivery Notice] Your parcel is on hold due to an incomplete address. Confirm within 2 hours or it returns to sender: bit.ly/3xK...',
    },
    tip: {
      ko: '공식 택배사는 송장번호나 받는 분 성함 없이 단축 URL(bit.ly 등)로 주소 재입력을 요구하지 않습니다.',
      en: 'Legitimate couriers never omit tracking numbers while urging immediate clicks on shortened URLs.',
    },
    aiPercent: 94,
    votesCount: 10,
    reasons: ['외부 링크·유도', '긴급 압박 문체'],
    createdAt: '2026-11-26T00:00:00.000Z',
  },
  {
    id: 'curated-used-listing',
    isLiveSubmission: false,
    categoryLabel: { ko: '중고거래 사기', en: 'Used Listing Scam' },
    title: { ko: '해외 출장 · 안전결제 외부 링크 유도 매물', en: 'Overseas excuse + external escrow link' },
    sample: {
      ko: '[급처] 미개봉 최신형 태블릿 시세 절반 가격! 현재 지방/해외 출장 중이라 직거래는 어렵고 안전결제 링크 보내드리면 바로 발송합니다.',
      en: '[URGENT] Sealed tablet at 50% off! Currently away on business so no meetups—pay via my secure link and I ship today.',
    },
    tip: {
      ko: '시세보다 과도하게 싸면서 직거래를 피하고 외부 결제 링크를 보내는 것은 AI/사기 템플릿의 전형입니다.',
      en: 'Far-below-market pricing paired with refusing local meetups and pushing external links is a classic scam template.',
    },
    aiPercent: 91,
    votesCount: 10,
    reasons: ['외부 링크·유도', '비현실적 조건'],
    createdAt: '2026-11-25T00:00:00.000Z',
  },
  {
    id: 'curated-fake-review',
    isLiveSubmission: false,
    categoryLabel: { ko: '조작·AI 리뷰', en: 'Synthetic Review' },
    title: { ko: '단점 0% · 홍보 문구만 나열된 상품평', en: 'Zero-flaw generic marketing review' },
    sample: {
      ko: '세련된 디자인과 탁월한 내구성으로 일상 속 만족감을 극대화해 주는 최고의 선택입니다. 누구에게나 자신 있게 추천드립니다.',
      en: 'Boasting sleek design and unmatched durability, this product elevates everyday satisfaction. Confidently recommended to everyone!',
    },
    tip: {
      ko: '실제 구매자가 겪는 배송·사이즈·단점 디테일이 전혀 없고 추상적인 칭찬 형용사만 반복됩니다.',
      en: 'Lacks specific fit, shipping, or minor-flaw details that genuine buyers always mention.',
    },
    aiPercent: 87,
    votesCount: 10,
    reasons: ['광고·기계적 문체'],
    createdAt: '2026-11-24T00:00:00.000Z',
  },
];

/** 스미싱·사기 주의 경보 피드 (실제 의뢰 중 AI/사기 다수 판정 + 대표 공익 사례) */
export const GET = withErrorHandling(async () => {
  const repo = getRepository();
  const requester = await repo.listMissions({ origin: 'requester' });

  const liveAlerts: AlertFeedItem[] = [];
  for (const m of requester) {
    if (m.publicAlert === false || m.status === 'draft') continue;
    if (m.mode !== 'single' || m.a.type !== 'text') continue;
    const votes = tallyVotes(await repo.getVotes(m.id));
    const total = votes.A + votes.B;
    if (total < 3 || votes.B <= votes.A) continue;
    const aiPercent = Math.round((votes.B / total) * 100);
    if (aiPercent < 60) continue;

    const reasons = Object.entries(m.reasonCounts ?? {})
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .map(([k]) => k);

    liveAlerts.push({
      id: m.id,
      isLiveSubmission: true,
      categoryLabel: { ko: m.a.sourceLabel || '실시간 제보', en: m.a.sourceLabel || 'Live Report' },
      title: { ko: m.contextNote || m.prompt, en: m.contextNote || m.prompt },
      sample: { ko: m.a.body, en: m.a.body },
      tip: {
        ko: `${total}명 중 ${aiPercent}%가 AI 생성·조작 의심으로 판정했습니다.`,
        en: `${aiPercent}% of ${total} verified Pioneers flagged this as AI/suspicious.`,
      },
      aiPercent,
      votesCount: total,
      reasons,
      createdAt: m.createdAt,
    });
  }

  liveAlerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return ok({ items: [...liveAlerts.slice(0, 8), ...CURATED_ALERTS] });
});
