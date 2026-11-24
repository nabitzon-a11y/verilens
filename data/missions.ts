/**
 * VeriLens 시연용 시드 미션 데이터셋 (총 30문항)
 *  - 텍스트 진위 판별 20문항 + 시각 패턴 비교 10문항 (SVG 8 + 실사형 데모 2)
 *  - 외부 이미지 URL을 쓰지 않습니다. 이미지는 /public/missions/ 의 로컬 파일만 사용합니다.
 *  - ID와 파일명은 정답을 유추할 수 없도록 중립적으로 지었습니다. (예: v01-a.svg, v09-a.jpg)
 *  - 문항 5개(t01, t04, t09, v01, v06)는 정답이 명확한 '숨김 기준 문항(Gold Standard)'입니다.
 *
 * ⚠️ 데이터 안내
 *  - 아래 텍스트는 해커톤 시연을 위해 새로 작성한 예시입니다. (실제 기사/후기/인물 아님)
 *  - 시각 문항은 AI 생성 이미지의 대표적인 흔적을 단순화한 일러스트입니다.
 *    실제 사진/AI 이미지로 바꾸려면 같은 파일명으로 /public/missions/ 에 덮어쓰세요.
 *    (사용 권한이 확인된 이미지만 넣으세요.)
 *
 * 🔒 이 파일은 서버에서만 import 하세요. 클라이언트에는 toPublicMission() 결과만 내려보냅니다.
 */

import type { Choice, Mission, MissionCategory, PublicMission } from '@/types';

const SEED_CREATED_AT = '2026-11-21T00:00:00.000Z';

const TEXT_PROMPT = '어느 쪽이 실제 사람이 직접 쓴 글일까요?';
const IMAGE_PROMPT = '어느 쪽이 AI가 만들지 않은 원본 장면일까요?';

export const SEED_MISSIONS: Mission[] = [
  /* ------------------------------------------------------------------
   * ① 텍스트 진위 판별 (6문항)
   * ------------------------------------------------------------------ */
  {
    id: 'seed-t01', // Gold Standard
    kind: 'text',
    category: 'review',
    prompt: TEXT_PROMPT,
    a: {
      type: 'text',
      sourceLabel: '배달앱 리뷰',
      body:
        '이 식당은 훌륭한 맛과 친절한 서비스로 많은 이들에게 사랑받는 곳입니다. 특히 국물의 깊은 풍미는 잊을 수 없는 경험을 선사하며, 정갈한 반찬 구성 또한 인상적이었습니다. 전반적으로 모든 면에서 만족스러운 식사였습니다.',
    },
    b: {
      type: 'text',
      sourceLabel: '배달앱 리뷰',
      body:
        '웨이팅 40분 했는데 국물은 솔직히 좀 짰음. 근데 수육이 미쳤어요 ㅋㅋ 비계 싫어하는 저도 다 먹음. 다음엔 평일 점심에 갈 듯. 주차는 포기하세요',
    },
    humanSide: 'B',
    isGold: true,
    priorVotes: ['B', 'B', 'B', 'B'],
    aiTell: 'AI 후기는 단점 없이 "깊은 풍미", "잊을 수 없는 경험" 같은 광고 문구만 이어지고, 웨이팅 시간·주차처럼 직접 겪은 사람만 아는 디테일이 없습니다.',
    difficulty: 1,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t02',
    kind: 'text',
    category: 'news',
    prompt: TEXT_PROMPT,
    a: {
      type: 'text',
      sourceLabel: '지역 뉴스',
      body:
        '21일 오전 7시 40분께 경기도의 한 신도시 아파트 지하 2층 주차장에서 불이 나 차량 3대가 타고 주민 20여 명이 대피했다. 소방당국은 장비 18대와 인력 52명을 투입해 약 40분 만에 불을 껐다. 소방 관계자는 "충전 중이던 차량 하부에서 연기가 났다는 주민 진술을 토대로 원인을 조사 중"이라고 말했다.',
    },
    b: {
      type: 'text',
      sourceLabel: '지역 뉴스',
      body:
        '최근 한 아파트 주차장에서 화재가 발생하여 많은 주민들이 큰 불안감을 느꼈다. 다행히 신속한 대응으로 큰 피해는 막을 수 있었으며, 관계 당국은 철저한 조사를 통해 정확한 원인을 규명할 방침이다. 이번 사건은 우리 사회에 안전의 중요성을 다시 한번 일깨워주는 계기가 되고 있다.',
    },
    humanSide: 'A',
    isGold: false,
    priorVotes: ['A', 'A', 'B', 'A'],
    aiTell: 'AI 기사는 날짜·시간·투입 장비 수 같은 구체적 수치가 없고, "안전의 중요성을 일깨워준다" 같은 교훈형 문장으로 마무리됩니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t03',
    kind: 'text',
    category: 'review',
    prompt: TEXT_PROMPT,
    a: {
      type: 'text',
      sourceLabel: '쇼핑몰 상품평 (무선 이어폰)',
      body:
        '뛰어난 음질과 편안한 착용감을 제공하는 제품입니다. 노이즈 캔슬링 성능 또한 기대 이상이었습니다. 다만 일부 사용자에게는 연결 안정성 측면에서 개선의 여지가 있을 수 있습니다. 전반적으로 가격 대비 훌륭한 선택이라고 생각합니다.',
    },
    b: {
      type: 'text',
      sourceLabel: '쇼핑몰 상품평 (무선 이어폰)',
      body:
        '왼쪽만 가끔 끊겨요. 출근길 지하철 환승할 때 특히 심함. 배터리는 광고만큼은 안 가고 5시간 좀 넘게? 노캔은 이 가격이면 괜찮은 편. 케이스 뚜껑이 헐렁해서 주머니에서 열려있던 적 두 번 있음',
    },
    humanSide: 'B',
    isGold: false,
    priorVotes: ['B', 'A', 'B', 'B'],
    aiTell: 'AI 상품평은 "일부 사용자에게는 ~일 수 있습니다"처럼 단점을 흐리게 말하고 장점-단점-총평 구조가 지나치게 균형 잡혀 있습니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t04', // Gold Standard
    kind: 'text',
    category: 'social',
    prompt: TEXT_PROMPT,
    a: {
      type: 'text',
      sourceLabel: 'SNS 게시글',
      body:
        '엄마 생신이라 아침에 미역국 끓였는데 간 보다가 국간장을 콸콸 부어버려서 결국 물 두 컵 더 부음... 양이 냄비 넘치기 직전ㅋㅋ 엄마는 맛있다고 두 그릇 드심 ㅠ 내년엔 레시피 보고 할게',
    },
    b: {
      type: 'text',
      sourceLabel: 'SNS 게시글',
      body:
        '오늘은 사랑하는 어머니의 생신이었습니다. 정성을 담아 미역국을 준비하며 감사의 마음을 전할 수 있었고, 가족과 함께한 소중한 시간은 오래도록 기억에 남을 것입니다. 💕 #가족 #감사 #행복한하루',
    },
    humanSide: 'A',
    isGold: true,
    priorVotes: ['A', 'A', 'A', 'A'],
    aiTell: 'AI 게시글은 실수나 구체적 사건 없이 "소중한 시간", "오래도록 기억" 같은 정형화된 감성 문구와 해시태그로만 채워져 있습니다.',
    difficulty: 1,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t05',
    kind: 'text',
    category: 'community',
    prompt: TEXT_PROMPT,
    a: {
      type: 'text',
      sourceLabel: '커뮤니티 답변 (인터넷 속도 저하 질문)',
      body:
        '인터넷 속도 저하 문제는 여러 가지 원인이 있을 수 있습니다. 첫째, 공유기를 재부팅해 보세요. 둘째, 랜 케이블의 상태를 확인해 보세요. 셋째, 문제가 지속된다면 통신사 고객센터에 문의하는 것도 좋은 방법입니다. 도움이 되셨길 바랍니다!',
    },
    b: {
      type: 'text',
      sourceLabel: '커뮤니티 답변 (인터넷 속도 저하 질문)',
      body:
        '저도 똑같았는데 공유기 재부팅은 소용없었고 랜선 바꾸니까 바로 해결됨. 집에 굴러다니던 거 꽂아놨었는데 뒤집어보니 CAT.5라고 써있더라구요;; 기가 요금제면 선부터 확인해보세요',
    },
    humanSide: 'B',
    isGold: false,
    priorVotes: ['B', 'B', 'A', 'B'],
    aiTell: 'AI 답변은 "첫째·둘째·셋째" 나열식 일반론에 "도움이 되셨길 바랍니다!"로 끝나며, 실제로 시도해 본 경험이 없습니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t06',
    kind: 'text',
    category: 'review',
    prompt: TEXT_PROMPT,
    a: {
      type: 'text',
      sourceLabel: '지도앱 카페 리뷰',
      body:
        '주차장 입구 찾기 어려움. 내비가 뒷골목으로 안내해서 두 바퀴 돎. 커피는 산미 있는 거 좋아하면 괜찮고 아니면 비추. 2층 창가 자리 콘센트 없음',
    },
    b: {
      type: 'text',
      sourceLabel: '지도앱 카페 리뷰',
      body:
        '진짜 여기 완전 강추예요!! 분위기도 너무 좋고 커피도 맛있고 직원분들도 다 친절하셔서 모든 게 완벽했어요 ㅎㅎ 데이트 코스로도 딱이에요~ 꼭 한번 가보세요!',
    },
    humanSide: 'A',
    isGold: false,
    priorVotes: ['A', 'B', 'A', 'B'],
    aiTell: 'AI가 구어체를 흉내 내도 "분위기·맛·친절·완벽"을 고르게 칭찬할 뿐, 주차·콘센트처럼 직접 방문해야 아는 불편함이 빠져 있습니다.',
    difficulty: 3,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },

  /* ------------------------------------------------------------------
   * ② 시각 패턴 비교 (4문항, 로컬 SVG)
   * ------------------------------------------------------------------ */
  {
    id: 'seed-v01', // Gold Standard
    kind: 'image',
    category: 'anatomy',
    prompt: IMAGE_PROMPT,
    a: {
      type: 'image',
      src: '/missions/v01-a.svg',
      alt: '손바닥을 편 손 이미지 A',
      placeholderLabel: '손 이미지 A',
    },
    b: {
      type: 'image',
      src: '/missions/v01-b.svg',
      alt: '손바닥을 편 손 이미지 B',
      placeholderLabel: '손 이미지 B',
    },
    humanSide: 'B',
    isGold: true,
    priorVotes: ['B', 'B', 'B', 'B'],
    aiTell: 'A의 손은 엄지를 빼고도 손가락이 5개이며 두 손가락이 끝에서 붙어 있습니다. 손가락 개수·관절 이상은 AI 이미지의 대표적 흔적입니다.',
    difficulty: 1,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-v02',
    kind: 'image',
    category: 'typography',
    prompt: IMAGE_PROMPT,
    a: {
      type: 'image',
      src: '/missions/v02-a.svg',
      alt: '빵집 외관 이미지 A',
      placeholderLabel: '빵집 간판 A',
    },
    b: {
      type: 'image',
      src: '/missions/v02-b.svg',
      alt: '빵집 외관 이미지 B',
      placeholderLabel: '빵집 간판 B',
    },
    humanSide: 'A',
    isGold: false,
    priorVotes: ['A', 'A', 'A', 'B'],
    aiTell: 'B의 간판 글자는 "BAKERY"처럼 보이지만 비슷한 모양의 엉뚱한 문자가 섞여 있고, 한글·영업시간도 깨져 있습니다. 이미지 속 글자 왜곡은 AI의 흔한 실수입니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-v03',
    kind: 'image',
    category: 'lighting',
    prompt: IMAGE_PROMPT,
    a: {
      type: 'image',
      src: '/missions/v03-a.svg',
      alt: '나무와 전봇대, 집이 있는 야외 풍경 A',
      placeholderLabel: '야외 풍경 A',
    },
    b: {
      type: 'image',
      src: '/missions/v03-b.svg',
      alt: '나무와 전봇대, 집이 있는 야외 풍경 B',
      placeholderLabel: '야외 풍경 B',
    },
    humanSide: 'B',
    isGold: false,
    priorVotes: ['B', 'A', 'B', 'B'],
    aiTell: 'A는 해가 하나인데 나무·전봇대·집의 그림자 방향이 제각각입니다. 광원과 그림자 방향 불일치는 AI 합성 이미지를 가려내는 핵심 단서입니다.',
    difficulty: 3,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-v04',
    kind: 'image',
    category: 'object',
    prompt: IMAGE_PROMPT,
    a: {
      type: 'image',
      src: '/missions/v04-a.svg',
      alt: '벽시계 이미지 A',
      placeholderLabel: '벽시계 A',
    },
    b: {
      type: 'image',
      src: '/missions/v04-b.svg',
      alt: '벽시계 이미지 B',
      placeholderLabel: '벽시계 B',
    },
    humanSide: 'A',
    isGold: false,
    priorVotes: ['A', 'B', 'A', 'A'],
    aiTell: 'B의 시계는 숫자 8이 두 번 나오고 12 자리에 13이 있으며, 바늘이 3개인데 초침이 아닌 같은 굵기입니다. AI는 숫자 배열 같은 규칙적 구조를 자주 틀립니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },

  /* ------------------------------------------------------------------
   * ③ 확장 텍스트 문항 (14문항) — t09 는 Gold Standard
   * ------------------------------------------------------------------ */
  textMission('seed-t07', 'review', '영화 관람평', {
    a: '중반까지 졸렸는데 마지막 20분이 다 함. 엔딩 크레딧 끝나고 쿠키 있으니 바로 나가지 마세요. 팝콘 카라멜맛은 비추',
    b: '이 영화는 탄탄한 스토리와 배우들의 열연이 돋보이는 작품입니다. 감동적인 메시지와 화려한 영상미가 어우러져 관객들에게 깊은 여운을 남깁니다. 강력히 추천합니다.',
    human: 'A', votes: ['A', 'A', 'A', 'B'], difficulty: 1,
    tell: 'AI 관람평은 "탄탄한 스토리", "깊은 여운" 같은 홍보 문구뿐이고, 쿠키 영상·팝콘 맛처럼 극장에 직접 가 본 사람의 디테일이 없습니다.',
  }),
  textMission('seed-t08', 'news', '아파트 공지문', {
    a: '입주민 여러분께 알려드립니다. 보다 쾌적한 주거 환경 조성을 위해 저수조 청소를 실시할 예정입니다. 이에 따라 일시적으로 단수가 발생할 수 있으니 너그러운 양해와 협조를 부탁드립니다.',
    b: '[관리사무소] 11월 25일(수) 오전 10시~오후 2시 저수조 청소로 단수됩니다. 101~104동 해당. 미리 물 받아두세요. 문의는 관리사무소 내선 0번',
    human: 'B', votes: ['B', 'B', 'A', 'B'], difficulty: 2,
    tell: 'AI 공지는 정중하지만 날짜·시간·해당 동처럼 실제로 필요한 정보가 하나도 없습니다. 실무 공지는 짧고 구체적입니다.',
  }),
  textMission('seed-t09', 'social', 'SNS 여행 후기', {
    a: '제주도 여행은 정말 환상적이었습니다! 아름다운 자연경관과 맛있는 음식, 친절한 사람들까지 모든 것이 완벽했습니다. 일상에서 벗어나 힐링할 수 있는 최고의 시간이었어요. ✨🌊 #제주 #힐링 #여행스타그램',
    b: '렌트카 반납 시간 착각해서 공항까지 20분 만에 밟음... 고기국수는 웨이팅 없는 집 갔는데 오히려 맛있었음. 귤 한 박스 들고 비행기 탔다가 팔 빠질 뻔',
    human: 'B', votes: ['B', 'B', 'B', 'B'], difficulty: 1, gold: true,
    tell: 'AI 후기는 "모든 것이 완벽" 같은 총평과 이모지·해시태그로 채워져 있고, 실수담이나 구체적 장소·사건이 없습니다.',
  }),
  textMission('seed-t10', 'community', '중고거래 게시글', {
    a: '폰케이스 팝니다. 두 번 씀. 색이 사진보다 좀 더 핑크핑크해요. 역 앞 직거래만, 택배 안 해요. 네고 x',
    b: '거의 새 제품과 다름없는 상태의 휴대폰 케이스를 판매합니다. 세련된 디자인과 뛰어난 보호 기능을 갖추고 있어 만족하실 것입니다. 궁금하신 점은 언제든지 편하게 문의해 주세요!',
    human: 'A', votes: ['A', 'A', 'B', 'A'], difficulty: 2,
    tell: 'AI 판매글은 광고처럼 장점만 늘어놓고, 거래 방식·색감 차이처럼 실제 판매자가 꼭 적는 조건이 빠져 있습니다.',
  }),
  textMission('seed-t11', 'community', '요리 팁 댓글', {
    a: '김치찌개를 맛있게 끓이는 비결은 신선한 재료와 정성입니다. 잘 익은 김치와 돼지고기를 사용하고, 적절한 불 조절을 통해 깊은 맛을 낼 수 있습니다. 취향에 따라 다양한 재료를 추가해 보세요.',
    b: '김치찌개는 김치 국물 반 컵 꼭 넣으세요. 저는 설탕 반 스푼 넣는데 엄마는 질색함ㅋㅋ 참치보다 돼지 앞다리가 낫고, 두부는 마지막 3분',
    human: 'B', votes: ['B', 'B', 'B', 'A'], difficulty: 2,
    tell: 'AI 팁은 "신선한 재료와 정성", "취향에 따라" 같은 누구나 할 수 있는 말뿐이고 분량·순서·개인 취향이 없습니다.',
  }),
  textMission('seed-t12', 'social', '야구 경기 후기', {
    a: '9회말 투아웃에 그 볼을 왜 건드려... 직관 갔다가 지하철 막차 놓칠 뻔. 그래도 불펜 오늘은 버텼다',
    b: '오늘 경기는 양 팀 선수들의 치열한 접전 속에서 많은 팬들에게 큰 감동을 선사했습니다. 비록 아쉬운 결과였지만 선수들의 투혼은 박수받아 마땅합니다.',
    human: 'A', votes: ['A', 'B', 'A', 'A'], difficulty: 2,
    tell: 'AI 후기는 어떤 장면이 아쉬웠는지 말하지 않고 "치열한 접전", "투혼" 같은 중계 멘트로 감정을 일반화합니다.',
  }),
  textMission('seed-t13', 'community', '아르바이트 구인글', {
    a: '저희 매장은 열정 넘치는 인재를 기다립니다! 자유로운 분위기와 성장 가능성이 가득한 환경에서 함께 꿈을 키워나가실 분을 모집합니다. 많은 관심과 지원 부탁드립니다.',
    b: '주 3일 오후 1~6시 카페 파트타임 구해요. 시급 10,500원(주휴 별도), 바리스타 경험 없어도 됨. 일요일 마감 가능하신 분 우대. 문자 먼저 주세요',
    human: 'B', votes: ['B', 'B', 'A', 'B'], difficulty: 2,
    tell: 'AI 구인글에는 근무 시간·시급·자격 조건이 없습니다. "열정", "성장 가능성" 같은 추상어만 반복합니다.',
  }),
  textMission('seed-t14', 'review', '앱스토어 리뷰', {
    a: '와 이 앱 진짜 대박이에요!! 디자인도 예쁘고 기능도 많고 속도도 빨라서 완전 만족합니다 ㅎㅎ 다들 꼭 써보세요 강추강추!',
    b: '업데이트 후 다크모드 풀림. 설정 들어가서 다시 켜야 함. 알림 끄기 메뉴가 너무 깊이 숨어있음. 기능 자체는 괜찮아서 별 3개',
    human: 'B', votes: ['B', 'A', 'B', 'A'], difficulty: 3,
    tell: 'AI가 구어체·이모티콘을 흉내 내도 "디자인·기능·속도"를 고르게 칭찬할 뿐, 실제 사용 중 겪은 특정 버그나 메뉴 위치가 없습니다.',
  }),
  textMission('seed-t15', 'news', '경제 뉴스', {
    a: '최근 경제 상황이 어려워지면서 많은 소상공인들이 어려움을 겪고 있다. 전문가들은 다양한 지원 정책이 필요하다고 입을 모으고 있으며, 향후 경기 회복 여부에 귀추가 주목된다.',
    b: '서울의 한 전통시장 상인회는 이달부터 지역화폐로 결제하면 5%를 추가 할인해 주는 행사를 연다고 20일 밝혔다. 행사는 12월 31일까지이며 1인당 월 10만 원 한도다.',
    human: 'B', votes: ['B', 'B', 'B', 'A'], difficulty: 2,
    tell: 'AI 기사는 "전문가들은 입을 모은다", "귀추가 주목된다" 같은 상투어로 끝나고 누가·언제·얼마나가 빠져 있습니다.',
  }),
  textMission('seed-t16', 'community', '반려동물 질문 답변', {
    a: '저희 집 고양이도 갑자기 사료 안 먹어서 병원 갔더니 치아에 염증이었어요. 이틀 넘게 안 먹으면 무조건 병원 가세요. 저는 하루 더 기다렸다가 후회함',
    b: '고양이가 사료를 먹지 않는 데에는 다양한 원인이 있을 수 있습니다. 스트레스, 건강 문제, 사료에 대한 거부감 등이 대표적입니다. 증상이 지속된다면 수의사와 상담하는 것을 권장합니다.',
    human: 'A', votes: ['A', 'A', 'B', 'A'], difficulty: 2,
    tell: 'AI 답변은 가능한 원인을 나열하고 "상담을 권장합니다"로 마무리할 뿐, 직접 겪은 결과와 후회 같은 경험담이 없습니다.',
  }),
  textMission('seed-t17', 'review', '쇼핑몰 판매자 답글', {
    a: '고객님, 이번 일로 불편을 끼쳐드려 진심으로 사과드립니다. 앞으로 더 나은 서비스를 제공하기 위해 최선을 다하겠습니다. 소중한 의견에 감사드립니다.',
    b: '주문하신 머그컵 포장할 때 뽁뽁이를 한 겹만 했어요ㅠ 제 실수입니다. 오늘 새 제품 다시 보냈고 깨진 건 버리셔도 돼요. 운송장 번호는 문자로 드렸어요',
    human: 'B', votes: ['B', 'B', 'A', 'B'], difficulty: 2,
    tell: 'AI 답글은 어떤 문제였는지, 어떻게 해결했는지 없이 사과 템플릿만 반복합니다.',
  }),
  textMission('seed-t18', 'news', '날씨 뉴스', {
    a: '기상청은 내일 아침 서울 기온이 영하 3도까지 떨어지겠다고 21일 예보했다. 낮 최고기온은 6도로 일교차가 크겠고, 강원 산지에는 1~3cm의 눈이 내릴 것으로 보인다.',
    b: '내일은 전국적으로 쌀쌀한 날씨가 이어질 것으로 예상됩니다. 아침저녁으로 기온이 크게 떨어지는 만큼 건강 관리에 각별히 유의하시고, 외출 시 따뜻한 옷차림을 하시기 바랍니다.',
    human: 'A', votes: ['A', 'A', 'A', 'B'], difficulty: 2,
    tell: 'AI 예보는 기온 숫자와 지역이 없고 "건강 관리에 유의하라"는 당부로 분량을 채웁니다.',
  }),
  textMission('seed-t19', 'news', '학교 가정통신문', {
    a: '3학년 2반 학부모님께. 다음 주 화요일 현장체험학습 도시락 꼭 챙겨주세요. 우천 시 강당 활동으로 바뀌고, 그 경우 오전 8시에 문자 드립니다.',
    b: '학부모님들께 안내드립니다. 학생들의 견문을 넓히고 다양한 경험을 제공하기 위해 현장체험학습을 실시하고자 합니다. 가정에서도 많은 관심과 협조를 부탁드립니다.',
    human: 'A', votes: ['A', 'A', 'B', 'A'], difficulty: 2,
    tell: 'AI 통신문은 취지 설명만 있고 날짜·준비물·우천 시 대안처럼 학부모가 실제로 알아야 할 내용이 없습니다.',
  }),
  textMission('seed-t20', 'review', '도서 리뷰', {
    a: '이 책은 흥미로운 주제를 다루고 있지만, 일부 독자에게는 다소 어렵게 느껴질 수 있습니다. 그럼에도 불구하고 저자의 깊이 있는 통찰은 충분히 읽을 가치가 있다고 생각합니다.',
    b: '출퇴근 지하철에서 3일 만에 다 읽음. 2장은 솔직히 건너뛰어도 됨. 마지막 장 읽고 회사 그만두고 싶어져서 위험한 책ㅋㅋ',
    human: 'B', votes: ['B', 'A', 'B', 'B'], difficulty: 3,
    tell: 'AI 리뷰는 "~지만, 그럼에도 불구하고"로 장단점을 기계적으로 저울질하고, 어느 장이 어땠는지 같은 독서 경험이 없습니다.',
  }),

  /* ------------------------------------------------------------------
   * ④ 확장 시각 문항 (4문항, 로컬 SVG) — v06 은 Gold Standard
   * ------------------------------------------------------------------ */
  imageMission('seed-v05', 'object', '체스판', {
    human: 'B', votes: ['B', 'B', 'A', 'B'], difficulty: 2,
    tell: 'A의 체스판은 한 줄에 칸이 9개이고, 위쪽 줄에는 같은 색 칸이 연달아 붙어 있습니다. 반복 패턴의 규칙이 깨지는 것은 AI 이미지의 흔한 흔적입니다.',
  }),
  imageMission('seed-v06', 'typography', '키보드', {
    human: 'A', votes: ['A', 'A', 'A', 'A'], difficulty: 1, gold: true,
    tell: 'B의 키보드는 E가 뒤집혀 있고 I·K가 두 번 나오며 Ł·И 같은 엉뚱한 키가 섞여 있습니다. 둘째 줄 키는 판 밖으로 삐져나와 있습니다.',
  }),
  imageMission('seed-v07', 'lighting', '호수 풍경', {
    human: 'B', votes: ['B', 'A', 'B', 'B'], difficulty: 3,
    tell: 'A의 호수에는 나무 반영이 없고, 산의 반영은 모양이 다르며, 해의 반영은 반대편에 있습니다. 물에 비친 모습이 실제 사물과 대칭이 아니면 합성을 의심하세요.',
  }),
  imageMission('seed-v08', 'typography', '달력', {
    human: 'A', votes: ['A', 'A', 'B', 'A'], difficulty: 2,
    tell: 'B의 달력은 철자가 NOVEMEBR로 틀렸고, 토요일 자리에 F가 있으며 17일이 두 번 나오고 18일이 빠졌고 31·32일까지 있습니다.',
  }),
  imageMission('seed-v09', 'typography', '카페 테이블', {
    human: 'B', votes: ['B', 'B', 'A', 'B'], difficulty: 2, ext: 'jpg',
    tell: 'A의 메뉴판에는 "CΦFFΞE", "LATTƎ", "Psəstry"처럼 깨진 문자가 있고, 스푼 손잡이 끝이 나무 결 속으로 휘어지며 녹아 있습니다.',
  }),
  imageMission('seed-v10', 'object', '과일 노점', {
    human: 'A', votes: ['A', 'A', 'B', 'A'], difficulty: 2, ext: 'jpg',
    tell: 'B의 칠판 글자("FRE5H OЯANG")가 깨져 있고, 가운데 나무 상자 판자가 물결치듯 서로 녹아 붙어 있으며 과일 광택이 지나치게 균일합니다.',
  }),

  /* ------------------------------------------------------------------
   * ⑤ 단일 감별(Single Check) 문항 (4문항) — 1개만 보고 인간 vs AI 판별
   * ------------------------------------------------------------------ */
  {
    id: 'seed-t21',
    kind: 'text',
    mode: 'single',
    category: 'review',
    prompt: '이 쇼핑몰 후기는 실제 사람이 썼을까요, AI가 썼을까요?',
    a: {
      type: 'text',
      sourceLabel: '쇼핑몰 상품평',
      body: '세련된 디자인과 뛰어난 내구성이 완벽한 조화를 이룹니다. 일상생활에서 매우 실용적으로 활용할 수 있으며, 전반적인 품질과 만족도가 기대 이상입니다. 누구에게나 자신 있게 추천합니다.',
    },
    b: { type: 'text', body: 'AI 생성 · 합성' },
    humanSide: 'B',
    isGold: false,
    priorVotes: ['B', 'B', 'B', 'A'],
    aiTell: '"완벽한 조화", "전반적인 품질과 만족도"처럼 구체적 사용 상황(크기·무게·배송·단점) 없이 장점만 추상적으로 나열하는 전형적인 AI 생성 리뷰입니다.',
    difficulty: 1,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t22',
    kind: 'text',
    mode: 'single',
    category: 'community',
    prompt: '이 커뮤니티 글은 실제 경험담일까요, AI 생성 글일까요?',
    a: {
      type: 'text',
      sourceLabel: '커뮤니티 글',
      body: '오늘 처음 셀프 세차장 갔다가 500원짜리 동전 모자라서 편의점에서 급하게 껌 사고 거스름돈 받아옴ㅋㅋ 거품 솔 쓰려는데 앞사람이 거품 다 안 헹구고 가서 바닥 미끄러웠어요.',
    },
    b: { type: 'text', body: 'AI 생성 · 합성' },
    humanSide: 'A',
    isGold: false,
    priorVotes: ['A', 'A', 'A', 'B'],
    aiTell: '동전이 부족해 껌을 사서 거슬러 받은 행동, 앞사람 때문에 바닥이 미끄러웠던 사소한 짜증 등 실제 현장 경험이 담긴 인간 작성 글입니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t23',
    kind: 'text',
    mode: 'single',
    category: 'review',
    prompt: '이 배달 리뷰는 실제 주문자일까요, AI 생성 리뷰일까요?',
    a: {
      type: 'text',
      sourceLabel: '배달앱 리뷰',
      body: '비 와서 15분 늦긴 했는데 기사님이 죄송하다고 먼저 연락 주셔서 괜찮았어요. 탕수육 소스는 부먹으로 왔는데 다행히 눅눅하진 않네요. 단무지 하나 더 넣어주셔서 감사!',
    },
    b: { type: 'text', body: 'AI 생성 · 합성' },
    humanSide: 'A',
    isGold: false,
    priorVotes: ['A', 'A', 'B', 'A'],
    aiTell: '비 오는 날 15분 지연, 기사님 연락, 부먹·단무지 같은 구체적 상황과 감정이 자연스럽게 섞인 실제 인간 리뷰입니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },
  {
    id: 'seed-t24',
    kind: 'text',
    mode: 'single',
    category: 'social',
    prompt: '이 사내 공지 문구는 사람이 직접 썼을까요, AI가 썼을까요?',
    a: {
      type: 'text',
      sourceLabel: '사내 공지',
      body: '임직원 여러분의 노고에 깊은 감사를 드립니다. 다가오는 분기에도 혁신적인 사고와 긴밀한 협업을 통해 더 큰 도약을 이루어 나가길 기대합니다. 모두의 건승을 기원합니다.',
    },
    b: { type: 'text', body: 'AI 생성 · 합성' },
    humanSide: 'B',
    isGold: false,
    priorVotes: ['B', 'B', 'A', 'B'],
    aiTell: '구체적인 일정·안건·담당자 없이 "혁신적인 사고", "긴밀한 협업", "더 큰 도약" 같은 추상적 미사여구만 이어지는 AI 생성 문구입니다.',
    difficulty: 2,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  },

  /* ------------------------------------------------------------------
   * ⑥ 추가 생활밀착 문항 (6문항) — 총 40문항 완성
   * ------------------------------------------------------------------ */
  textMission('seed-t25', 'community', '원룸 자취 후기', {
    a: '채광은 좋은데 밤에 1층 치킨집 환풍기 소리가 은근 큼. 수압은 세서 만족, 겨울에 창문 틈 바람 좀 들어와서 뽁뽁이 붙이고 살았어요',
    b: '이 원룸은 쾌적한 주거 환경과 편리한 주변 인프라를 갖추고 있어 1인 가구에게 안성맞춤입니다. 깔끔한 내부 인테리어와 채광이 돋보여 만족도가 높습니다.',
    human: 'A', votes: ['A', 'A', 'A', 'B'], difficulty: 1,
    tell: 'AI 후기는 "쾌적한 주거 환경·인프라"처럼 부동산 홍보 문구만 나열하고, 1층 치킨집 소음이나 창문 틈 외풍 같은 실거주자 디테일이 없습니다.',
  }),
  textMission('seed-t26', 'review', '헬스장 등록 후기', {
    a: '최신식 기구와 청결한 시설, 친절한 트레이너 선생님까지 모두 만족스러운 헬스장입니다. 체계적인 운동 프로그램을 통해 건강하고 활기찬 일상을 만들어 보세요.',
    b: '저녁 7시 넘으면 랫풀다운 줄 서야 됨. 샤워실 온수는 잘 나오는데 헤어드라이어가 두 대뿐이라 좀 기다려요. 관장님이 자세는 잘 봐주심',
    human: 'B', votes: ['B', 'B', 'A', 'B'], difficulty: 2,
    tell: 'AI 후기는 피크타임 기구 대기나 드라이어 개수 같은 실제 회원만 아는 생활 불편이 전혀 없습니다.',
  }),
  textMission('seed-t27', 'community', '중고차 매물 문의 답변', {
    a: '네 차주 본인 맞고요, 운전석 앞 휀다 단순 교환 1건 있습니다. 성능점검표 사진 보내드릴게요. 주중에 오시면 리프트 띄워서 하부도 같이 보실 수 있어요',
    b: '문의하신 차량은 최상의 컨디션을 유지하고 있으며 철저한 관리를 통해 최선의 만족을 드립니다. 언제든지 편하게 연락 주시면 친절히 안내해 드리겠습니다.',
    human: 'A', votes: ['A', 'A', 'A', 'B'], difficulty: 2,
    tell: 'AI 답변은 단순 교환 이력, 성능점검표, 리프트 하부 확인 등 실제 중고차 거래의 핵심 정보가 빠져 있습니다.',
  }),
  textMission('seed-t28', 'review', '무선 청소기 사용기', {
    a: '가벼워서 손목 안 아픈 건 최고인데 먼지통 비울 때 먼지가 좀 날림. 강 모드로 돌리면 15분 만에 배터리 닳아서 원룸이나 서브용으로 추천합니다',
    b: '강력한 흡입력과 가벼운 무게가 완벽한 균형을 이루는 무선 청소기입니다. 세련된 디자인과 긴 배터리 수명으로 청소의 즐거움을 더해줍니다.',
    human: 'A', votes: ['A', 'A', 'B', 'A'], difficulty: 2,
    tell: 'AI는 "긴 배터리 수명"처럼 장점만 쓰지만, 실제 사용자는 15분 배터리 소모와 먼지 날림 같은 단점을 솔직히 적습니다.',
  }),
  textMission('seed-t29', 'social', '해외여행 숙소 리뷰', {
    a: '역에서 도보 3분이라 캐리어 끌고 가기 편했어요. 다만 엘리베이터가 4인용이라 좁고 조식 크루아상은 9시 넘으면 거의 다 떨어짐',
    b: '훌륭한 위치와 아늑한 객실, 정성 가득한 조식 서비스 덕분에 잊지 못할 여행이 되었습니다. 다음 방문 시에도 반드시 다시 이용하고 싶은 숙소입니다.',
    human: 'A', votes: ['A', 'A', 'A', 'B'], difficulty: 1,
    tell: 'AI 리뷰는 "잊지 못할 여행" 같은 추상적 감상뿐이고, 캐리어 이동 거리·엘리베이터 크기·조식 품절 시간 같은 구체적 팁이 없습니다.',
  }),
  textMission('seed-t30', 'community', '취업 면접 후기', {
    a: '면접관 세 분 들어오셨고 생각보다 기술 질문보다 이전 프로젝트에서 팀원 갈등 어떻게 풀었는지 집요하게 물어봄. 대기실에 물이랑 커피 있었고 결과는 다음 주 금요일 안내받았어요',
    b: '면접은 전반적으로 편안한 분위기 속에서 진행되었으며, 지원자의 역량과 경험을 심도 있게 확인하는 자리였습니다. 앞으로의 좋은 결과를 기대해 봅니다.',
    human: 'A', votes: ['A', 'B', 'A', 'A'], difficulty: 2,
    tell: 'AI 후기는 면접관 인원, 실제 질문 주제, 발표 날짜 등 면접장 디테일 없이 "역량과 경험을 심도 있게 확인" 같은 요약문만 씁니다.',
  }),

  /* ------------------------------------------------------------------
   * ⑦ 생활 밀착 테마 챌린지 (6문항) — 중고거래 사기·썸 카톡·맛집·낚시 썸네일 등
   * ------------------------------------------------------------------ */
  textMission('seed-t31', 'community', '중고거래 판매글 (사기 의심)', {
    a: '[급처] 아이패드 프로 6세대 미개봉 정품 35만원! 해외 출장 중이라 직거래 불가하고 안전결제 링크로만 거래합니다. 오늘 입금하시는 분께 무조건 우선 판매해요. 문의 많으니 빨리 연락주세요!',
    b: '아이패드 프로 6세대 쓰던 거 팔아요. 액정 오른쪽 아래 생활기스 하나 있고 배터리 효율 89%예요. 박스·충전기 다 있고 강남역 2번 출구 평일 저녁 직거래만 합니다.',
    human: 'B', votes: ['B', 'B', 'B', 'A'], difficulty: 2,
    tell: 'A는 시세보다 터무니없이 싼 가격, "해외 출장·직거래 불가·외부 안전결제 링크·오늘 입금 우선" 같은 전형적인 사기 템플릿입니다. 실제 판매자는 기스 위치·배터리 효율처럼 불리한 정보도 적습니다.',
  }),
  textMission('seed-t32', 'social', '썸 카톡 답장', {
    a: '오늘 정말 즐거운 시간이었어요! 함께 나눈 대화 하나하나가 소중하게 느껴졌고, 다음에도 이런 따뜻한 시간을 함께할 수 있으면 좋겠어요. 편안한 밤 보내세요 😊',
    b: 'ㅋㅋㅋ 아까 파스타집 웨이팅 진짜 길었다 다리 아픔 ㅠ 근데 티라미수는 인정… 다음엔 내가 아는 덮밥집 가자 거긴 웨이팅 없음 잘 들어갔어??',
    human: 'B', votes: ['B', 'B', 'A', 'B'], difficulty: 1,
    tell: 'AI 대필 답장은 "소중한 대화", "따뜻한 시간" 같은 정중한 총평뿐이고, 웨이팅·디저트·다음 약속 장소처럼 그날 함께한 사람만 아는 디테일이 없습니다.',
  }),
  textMission('seed-t33', 'review', '맛집 영수증 리뷰', {
    a: '영수증 인증해요. 2인 세트 38,000원에 공깃밥 추가 1,000원. 고기 두께는 사진보다 얇았는데 숯향은 확실함. 냉면은 육수가 너무 달아서 반 남김. 화장실이 건물 밖이라 불편해요',
    b: '분위기 좋고 음식도 정말 맛있는 곳이에요! 고기는 부드럽고 육즙이 가득했으며, 직원분들도 친절해서 기분 좋게 식사할 수 있었습니다. 가족·연인 모임 장소로 강력 추천합니다!',
    human: 'A', votes: ['A', 'A', 'A', 'B'], difficulty: 2,
    tell: 'AI 리뷰는 메뉴 가격·추가 주문·화장실 위치처럼 영수증을 가진 사람만 아는 정보 없이, 칭찬 키워드를 고르게 나열합니다.',
  }),
  textMission('seed-t34', 'social', '유튜브 영상 제목', {
    a: '자취 3년차 냉장고 털어서 5,000원으로 일주일 버티기 (3일차에 실패함)',
    b: '충격! 전문가들도 모르는 단 하나의 비밀… 이것만 알면 당신의 인생이 완전히 바뀝니다 (끝까지 보세요)',
    human: 'A', votes: ['A', 'A', 'B', 'A'], difficulty: 2,
    tell: 'AI 낚시 제목은 "충격", "단 하나의 비밀", "인생이 바뀐다"처럼 내용 없는 과장 공식을 반복합니다. 사람이 쓴 제목은 금액·기간·실패담처럼 구체적입니다.',
  }),
  textMission('seed-t35', 'community', '분실물 찾습니다 글', {
    a: '소중한 물건을 분실하였습니다. 찾아주시는 분께는 진심으로 감사의 마음을 전하며 소정의 사례를 드리겠습니다. 작은 관심과 도움 부탁드립니다.',
    b: '어제(화) 밤 10시쯤 3번 마을버스 맨 뒷자리에 검정 에어팟 프로 케이스 두고 내렸어요ㅠ 케이스에 고양이 스티커 붙어 있어요. 찾으시면 사례금 3만 원 드릴게요',
    human: 'B', votes: ['B', 'B', 'B', 'A'], difficulty: 1,
    tell: 'AI 분실물 글에는 무엇을, 언제, 어디서 잃어버렸는지가 하나도 없습니다. 실제 글은 버스 번호·좌석·스티커 같은 식별 정보가 핵심입니다.',
  }),
  textMission('seed-t36', 'review', '숙소 호스트 답글', {
    a: '게스트님 남겨주신 의견 감사합니다! 말씀하신 샤워기 수압은 어제 기사님 불러서 헤드 교체했고, 2층 소음은 귀마개를 비치해 두었어요. 다음엔 조식 쿠폰 하나 더 챙겨드릴게요',
    b: '소중한 후기를 남겨주셔서 진심으로 감사드립니다. 고객님의 만족을 최우선으로 생각하며, 더 나은 서비스를 위해 항상 노력하겠습니다. 다시 뵙기를 기대하겠습니다.',
    human: 'A', votes: ['A', 'B', 'A', 'B'], difficulty: 3,
    tell: 'AI 답글은 감사·노력 다짐만 반복할 뿐 무엇을 고쳤는지가 없습니다. 실제 호스트는 샤워기 교체·귀마개 비치처럼 구체적 조치를 적습니다.',
  }),
];

/* ------------------------------------------------------------------
 * 시드 문항 생성 헬퍼
 * ------------------------------------------------------------------ */

interface SeedSpec {
  human: Choice;
  votes: Choice[];
  difficulty: 1 | 2 | 3;
  tell: string;
  gold?: boolean;
}

function textMission(id: string, category: MissionCategory, sourceLabel: string, spec: SeedSpec & { a: string; b: string }): Mission {
  return {
    id,
    kind: 'text',
    category,
    prompt: TEXT_PROMPT,
    a: { type: 'text', sourceLabel, body: spec.a },
    b: { type: 'text', sourceLabel, body: spec.b },
    humanSide: spec.human,
    isGold: spec.gold ?? false,
    priorVotes: spec.votes,
    aiTell: spec.tell,
    difficulty: spec.difficulty,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  };
}

function imageMission(id: string, category: MissionCategory, label: string, spec: SeedSpec & { ext?: 'svg' | 'jpg' }): Mission {
  const n = id.replace('seed-', '');
  const ext = spec.ext ?? 'svg';
  return {
    id,
    kind: 'image',
    category,
    prompt: IMAGE_PROMPT,
    a: { type: 'image', src: `/missions/${n}-a.${ext}`, alt: `${label} 이미지 A`, placeholderLabel: `${label} A` },
    b: { type: 'image', src: `/missions/${n}-b.${ext}`, alt: `${label} 이미지 B`, placeholderLabel: `${label} B` },
    humanSide: spec.human,
    isGold: spec.gold ?? false,
    priorVotes: spec.votes,
    aiTell: spec.tell,
    difficulty: spec.difficulty,
    origin: 'seed',
    status: 'active',
    createdAt: SEED_CREATED_AT,
  };
}

/** 서버 내부 미션 → 클라이언트 노출용 미션 (정답·기준문항·가상응답·해설 제거) */
export function toPublicMission(mission: Mission): PublicMission {
  const {
    humanSide: _humanSide,
    isGold: _isGold,
    priorVotes: _priorVotes,
    aiTell: _aiTell,
    paymentId: _paymentId,
    reportCount: _reportCount,
    reportedBy: _reportedBy,
    ...publicFields
  } = mission;
  return publicFields;
}

/** 시드 미션 ID로 조회 */
export function getSeedMission(id: string): Mission | undefined {
  return SEED_MISSIONS.find((m) => m.id === id);
}

/** 데이터 무결성 자체 점검 (개발 중 호출용) */
export function validateSeedMissions(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const m of SEED_MISSIONS) {
    if (ids.has(m.id)) errors.push(`중복 ID: ${m.id}`);
    ids.add(m.id);
    if (m.priorVotes.length !== 4) errors.push(`${m.id}: priorVotes는 4개여야 합니다`);
    if (m.isGold && !m.humanSide) errors.push(`${m.id}: 기준 문항은 humanSide가 필요합니다`);
    if (m.a.type !== m.b.type) errors.push(`${m.id}: A/B 콘텐츠 타입이 다릅니다`);
    for (const c of [m.a, m.b]) {
      if (c.type === 'image' && !c.src.startsWith('/missions/')) {
        errors.push(`${m.id}: 이미지는 /missions/ 로컬 경로만 허용됩니다`);
      }
    }
  }
  if (!SEED_MISSIONS.some((m) => m.isGold)) errors.push('기준 문항(Gold)이 최소 1개 필요합니다');
  return errors;
}
