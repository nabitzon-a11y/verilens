/**
 * VeriLens 핵심 타입 정의
 *
 * 설계 원칙
 * 1) 서버 전용 필드(정답·기준문항 여부·가상 응답)는 `Mission` 에만 존재하고,
 *    클라이언트로 내려가는 `PublicMission` 에서는 제거합니다. (정답 유출 방지)
 * 2) 저장소는 Repository 인터페이스로 추상화해 JSON / Memory / Supabase 교체가 가능합니다.
 * 3) Pi SDK 전역 객체(window.Pi) 타입을 함께 선언합니다.
 */

/* =====================================================================
 * 공통
 * ===================================================================== */

/** ISO 8601 문자열 (예: 2026-11-21T12:00:00.000Z) */
export type ISODateString = string;

/** A/B 선택지 */
export type Choice = 'A' | 'B';

/* =====================================================================
 * 미션 (판별 문항)
 * ===================================================================== */

export type MissionKind = 'text' | 'image';

/** compare: A vs B 2개 비교 / single: 1개 콘텐츠의 인간 vs AI 진위 감별 */
export type MissionMode = 'compare' | 'single';

export type MissionCategory =
  | 'review' // 상품/식당 후기
  | 'news' // 뉴스 기사
  | 'social' // SNS 게시글
  | 'community' // 커뮤니티 답변
  | 'anatomy' // 신체 구조 (손가락 등)
  | 'typography' // 이미지 속 글자
  | 'lighting' // 빛/그림자 일관성
  | 'object' // 사물 구조 (시계 등)
  | 'custom'; // 의뢰자 등록 문항

export interface TextContent {
  type: 'text';
  body: string;
  /** 출처 형식 표시용 라벨 (예: "배달앱 리뷰") */
  sourceLabel?: string;
}

export interface ImageContent {
  type: 'image';
  /** 로컬 경로(/missions/...) 또는 의뢰자 업로드 data URL. 외부 URL 사용 금지 */
  src: string;
  alt: string;
  /** 이미지 로드 실패 시 플레이스홀더 카드에 표시할 문구 */
  placeholderLabel: string;
}

export type MissionContent = TextContent | ImageContent;

export type MissionOrigin = 'seed' | 'requester';

export type MissionStatus =
  | 'draft' // 의뢰자 작성 완료, 결제 대기
  | 'active' // 판별 풀에 노출 중
  | 'closed'; // 합의 완료 또는 비활성

/** 서버 내부 미션 (정답 포함 — 절대 그대로 클라이언트에 반환 금지) */
export interface Mission {
  /** 정답을 유추할 수 없는 중립적 ID */
  id: string;
  kind: MissionKind;
  /** 생략 시 'compare' (기존 A vs B 비교) */
  mode?: MissionMode;
  category: MissionCategory;
  /** 질문 문구 */
  prompt: string;
  a: MissionContent;
  b: MissionContent;

  /** [서버 전용] 실제 인간이 만든 원본 쪽. 의뢰자 문항은 정답 미상(undefined) */
  humanSide?: Choice;
  /** [서버 전용] 숨김 기준 문항(Gold Standard) 여부 */
  isGold: boolean;
  /** [서버 전용] 합의 시뮬레이션용 기존 응답 4건 */
  priorVotes: Choice[];
  /** [결과 공개용] AI가 남긴 어색한 흔적 1줄 해설 */
  aiTell: string;

  difficulty: 1 | 2 | 3;
  origin: MissionOrigin;
  status: MissionStatus;
  /** 의뢰자 문항인 경우 의뢰자 uid */
  requesterUid?: string;
  /** 의뢰자 문항인 경우 연결된 결제 ID */
  paymentId?: string;
  /** [서버 전용] 신고 누적 횟수 (2회 이상 시 자동 비공개) */
  reportCount?: number;
  /** [서버 전용] 중복 신고 방지용 신고자 uid 목록 */
  reportedBy?: string[];
  createdAt: ISODateString;
}

/** 클라이언트에 노출되는 미션 (정답·기준문항·가상응답·해설·신고정보 제거) */
export type PublicMission = Omit<
  Mission,
  'humanSide' | 'isGold' | 'priorVotes' | 'aiTell' | 'paymentId' | 'reportCount' | 'reportedBy'
>;

/* =====================================================================
 * 사용자 / 인증
 * ===================================================================== */

export interface PioneerUser {
  /** Pi uid (데모 사용자는 demo_ 접두사) */
  uid: string;
  username: string;
  isDemo: boolean;
  trustScore: number;
  /** 연속 참여일 */
  streak: number;
  /** 마지막 참여일 (YYYY-MM-DD, KST 기준) */
  lastActiveDate?: string;
  /** 마지막 데일리 퀘스트 보상 수령일 (YYYY-MM-DD, KST 기준) */
  lastQuestDate?: string;
  /** 출금 가능 잔액 (Pi) */
  balance: number;
  /** 누적 획득 보상 (Pi) */
  totalEarned: number;
  /** 누적 출금액 (Pi) */
  totalClaimed: number;
  setsCompleted: number;
  /** 매크로 의심 누적 횟수 */
  botFlags: number;
  /** 신뢰도 점수 체계 (1000 = 0~1000점 체계, 미설정 시 구버전 0~100) */
  trustScale?: number;
  /** 마일스톤(3·7·14·30일) 달성 등으로 지급된 무료 의뢰 체험권 수 */
  freeSubmitTickets?: number;
  /** 초대자 uid (최초 1회 기록) */
  referredBy?: string;
  /** 초대 보너스 지급 완료 여부 */
  referralRewarded?: boolean;
  /** 일일 신뢰도 상한 계산용 날짜 (YYYY-MM-DD, KST) */
  dailyTrustDate?: string;
  /** 오늘 누적 획득한 신뢰도 점수 */
  dailyTrustGained?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** 클라이언트용 사용자 요약 */
export interface PioneerProfile extends Pick<
  PioneerUser,
  'uid' | 'username' | 'isDemo' | 'trustScore' | 'streak' | 'balance' | 'totalEarned' | 'totalClaimed' | 'setsCompleted'
> {
  tier: 'master' | 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze';
  tierLabel: string;
  freeSubmitTickets: number;
}

/** 로그인 방식 */
export type AuthMode = 'pi' | 'demo';

/** 서버 로그인 세션 (httpOnly 서명 쿠키에 저장되는 페이로드) */
export interface AuthSessionPayload {
  uid: string;
  username: string;
  mode: AuthMode;
  /** 만료 시각 (epoch ms) */
  exp: number;
}

/* =====================================================================
 * PiVerify (3단계 세션 기반 인간 증명)
 * ===================================================================== */

/** 1단계 세션 진입 / 2단계 행동 플래그 재검증 / 3단계 출금 재검증 */
export type VerifyStage = 'session_entry' | 'behavior_recheck' | 'claim_reverify';

export interface VerifySession {
  /** HMAC 서명된 세션 토큰 */
  token: string;
  uid: string;
  stage: VerifyStage;
  issuedAt: number;
  expiresAt: number;
  /** 생체 생존성 점수 (0~1, Mock) */
  livenessScore: number;
  /** 고유성(1인 1계정) 점수 (0~1, Mock) */
  uniquenessScore: number;
  /** Mock 어댑터 사용 여부 */
  mock: boolean;
}

export interface VerifyResult {
  ok: boolean;
  session?: VerifySession;
  reason?: string;
}

/** 문항별 행동 샘플 (2단계 무자각 행동 감시) */
export interface BehaviorSample {
  missionId: string;
  /** 문항 노출 → 선택까지 걸린 시간 (ms) */
  reactionMs: number;
  /** 선택 시각 (epoch ms) */
  at: number;
}

export interface BehaviorVerdict {
  suspicious: boolean;
  /** 현재 연속 초고속 클릭 횟수 */
  fastStreak: number;
  reason?: string;
}

/* =====================================================================
 * 판별 세트 / 합의 결과
 * ===================================================================== */

/** 서버가 발급하는 판별 세트 (기준문항 위치는 서버만 앎) */
export interface MissionSet {
  setId: string;
  uid: string;
  missionIds: string[];
  verifyToken: string;
  issuedAt: ISODateString;
  submittedAt?: ISODateString;
  /** [서버 전용] 이 세트에 포함된 보너스 문제 ID */
  bonusId?: string;
  /** 오늘의 데일리 챌린지(전 세계 공통 5문항) 여부 */
  isDaily?: boolean;
  /** 제출 완료 시 결과 (중복 제출 시 그대로 반환) */
  result?: SetResult;
}

/** 보너스 문제 (AI 흔적 짚기 3지선다) — 서버 내부용 (정답 포함) */
export interface BonusQuiz {
  id: string;
  kind: 'image' | 'text';
  /** kind=image: 로컬 이미지 경로 */
  image?: string;
  /** kind=text: 판별 대상 문장 */
  text?: { ko: string; en: string };
  prompt: { ko: string; en: string };
  options: { ko: string[]; en: string[] };
  /** [서버 전용] 정답 옵션 인덱스 */
  answer: number;
  /** [결과 공개용] 해설 */
  explain: { ko: string; en: string };
}

/** 클라이언트에 내려가는 보너스 문제 (정답·해설 제거) */
export type PublicBonusQuiz = Omit<BonusQuiz, 'answer' | 'explain'>;

export interface BonusResult {
  quizId: string;
  choice: number;
  answer: number;
  correct: boolean;
  /** 보너스로 얻은 신뢰도 점수 (실격 세트는 0) */
  trustGain: number;
  explain: { ko: string; en: string };
}

/** 클라이언트에 내려가는 판별 세트 */
export interface PublicMissionSet {
  setId: string;
  missions: PublicMission[];
  bonus?: PublicBonusQuiz;
}

/** 홈 화면 통합 응답 (단일 API 호출로 네트워크/로그 최소화) */
export interface HomeOverviewResponse {
  live: LivePoolResponse;
  leaderboard: {
    top: {
      rank: number;
      username: string;
      trustScore: number;
      tier: PioneerProfile['tier'];
      tierLabel: string;
      setsCompleted: number;
      streak: number;
      isMe?: boolean;
    }[];
    myRank: number;
    totalUsers: number;
  };
  quest: {
    dailyDoneToday: boolean;
    dailyBonusPts: number;
    streak: number;
    nextMilestone: number | null;
    milestoneBonusPts: number;
  };
  /** 어제 데일리 챌린지 중 가장 헷갈렸던 1문제 복기 */
  yesterdayRecap?: {
    missionId: string;
    prompt: string;
    kind: MissionKind;
    mode?: MissionMode;
    previewText?: string;
    sourceLabel?: string;
    fooledPercent: number;
    humanSide?: Choice;
    aiTell: string;
  };
}

/** 홈 화면 실시간 의뢰 현황 */
export interface LivePoolResponse {
  activeCount: number;
  items: {
    id: string;
    kind: MissionKind;
    mode?: MissionMode;
    prompt: string;
    sourceLabel?: string;
    votes: number;
    target: number;
  }[];
  /** 오늘 무료 퀴즈 출제 가능 (24시간 1회) */
  freeQuizAvailable: boolean;
  /** 판별 1세트 이상 완료해 무료 출제 자격 충족 */
  freeQuizEligible: boolean;
}

export interface AnswerInput {
  missionId: string;
  choice: Choice;
  reactionMs: number;
}

export interface SetSubmission {
  setId: string;
  verifyToken: string;
  answers: AnswerInput[];
  refUid?: string;
}

export interface VoteTally {
  A: number;
  B: number;
}

export interface MissionResult {
  missionId: string;
  prompt: string;
  kind: MissionKind;
  mode?: MissionMode;
  choice: Choice;
  /** 5인 다수결 확정 라벨 (과반 미달 시 null) */
  consensus: Choice | null;
  tally: VoteTally;
  /** 내 선택 = 다수결 확정 라벨 (기준 문항은 내 선택 = 정답) */
  matched: boolean;
  /** 300ms 미만 초고속 응답이라 보상 집계에서 제외됨 */
  excludedFast: boolean;
  /** 본인이 의뢰한 문항 (보상·실투표 집계 제외) */
  ownMission?: boolean;
  /** 실제 인간 원본 쪽 (시드 문항처럼 정답이 알려진 경우만) */
  humanSide?: Choice;
  /** 10인 패널 중 AI 쪽을 고른(=속은) 인원 (정답이 알려진 문항만) */
  fooledCount?: number;
  difficulty?: 1 | 2 | 3;
  aiTell: string;
  reactionMs: number;
  // 🔒 어떤 문항이 기준 문항(Gold)이었는지는 공개하지 않습니다. (재사용 시 암기 방지)
}

export interface SetResult {
  setId: string;
  total: number;
  /** 다수결(또는 기준 정답) 일치 문항 수 */
  matchedCount: number;
  /** 보상 대상 문항 수 (기준 문항 제외, 일치 + 초고속 아님) */
  rewardedCount: number;
  goldPassed: boolean;
  /** 매크로/조작 의심으로 세트 전체 보상 미지급 */
  flagged: boolean;
  flagReason?: string;
  /** 세트 도중 2단계 재검증을 통과했는지 */
  rechecked: boolean;
  reward: number;
  /** 적용된 등급 보상 배율 (1.0 ~ 2.0) */
  rewardMultiplier?: number;
  /** 오늘의 데일리 챌린지 여부 */
  isDaily?: boolean;
  trustDelta: number;
  trustScore: number;
  /** 세트 시작 전 신뢰도 */
  trustBefore?: number;
  /** 등급 변화 */
  tierChange?: 'up' | 'down';
  /** 완벽 적중 세트 */
  perfect?: boolean;
  /** 보너스 문제 결과 */
  bonus?: BonusResult;
  /** 오늘 첫 유효 세트 완료 데일리 퀘스트 보너스 점수 */
  dailyQuestBonus?: number;
  /** 3/7/14/30일 연속 참여 달성 보너스 (달성 일수) */
  streakMilestone?: number;
  /** 초대 링크 첫 세트 완료 보너스 (초대자·피초대자 각 지급) */
  referralBonus?: number;
  /** 마일스톤 달성으로 무료 의뢰 체험권 지급 여부 */
  freeTicketGranted?: boolean;
  /** 일일 신뢰도 획득 상한(+25점) 도달 여부 */
  dailyCapReached?: boolean;
  /** 상위 N% (시뮬레이션) */
  topPercent: number;
  streak: number;
  /** 친구 도전장으로 공유할 문항 (기준 문항 아님) */
  challengeMissionId?: string;
  results: MissionResult[];
  completedAt: ISODateString;
}

/* =====================================================================
 * 지갑 / 정산 원장
 * ===================================================================== */

export type LedgerType =
  | 'reward' // 판별 보상 적립
  | 'claim' // 보상 출금 (A2U)
  | 'submission_payment'; // 의뢰자 문항 등록 결제 (U2A)

export type LedgerStatus = 'pending' | 'settled' | 'failed';

export interface LedgerEntry {
  id: string;
  uid: string;
  type: LedgerType;
  /** 사용자 기준 증감 (+적립 / -출금·결제) */
  amount: number;
  status: LedgerStatus;
  memo: string;
  setId?: string;
  paymentId?: string;
  txid?: string;
  /** 1회성 토큰 재사용 방지용 참조값 (Claim 재검증 토큰 해시) */
  ref?: string;
  mock: boolean;
  createdAt: ISODateString;
}

/* =====================================================================
 * Pi Payments (서버 기록)
 * ===================================================================== */

export type PaymentRecordStatus =
  | 'created'
  | 'approved'
  | 'completed'
  | 'cancelled'
  | 'failed';

/** createPayment metadata — 서버가 발급한 draftId 로 결제와 문항을 묶음 */
export interface SubmissionPaymentMetadata {
  kind: 'mission_submission';
  draftId: string;
}

export interface PaymentRecord {
  paymentId: string;
  uid: string;
  amount: number;
  memo: string;
  metadata: SubmissionPaymentMetadata;
  status: PaymentRecordStatus;
  txid?: string;
  /** Mock Approval 모드로 처리된 결제 여부 */
  mock: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* =====================================================================
 * Repository (저장소 추상화 — JSON / Memory / Supabase 교체 가능)
 * ===================================================================== */

export interface DataSnapshot {
  version: 1;
  users: Record<string, PioneerUser>;
  /** 의뢰자 등록 문항 (시드 문항은 data/missions.ts 에서 로드) */
  missions: Record<string, Mission>;
  sets: Record<string, MissionSet>;
  /** 의뢰자 문항에 누적된 실제 사용자 응답 */
  votes: Record<string, Choice[]>;
  ledger: LedgerEntry[];
  payments: Record<string, PaymentRecord>;
}

export interface Repository {
  getUser(uid: string): Promise<PioneerUser | null>;
  upsertUser(user: PioneerUser): Promise<PioneerUser>;
  listUsers(): Promise<PioneerUser[]>;

  listMissions(filter?: { status?: MissionStatus; origin?: MissionOrigin }): Promise<Mission[]>;
  getMission(id: string): Promise<Mission | null>;
  saveMission(mission: Mission): Promise<Mission>;

  getSet(setId: string): Promise<MissionSet | null>;
  saveSet(set: MissionSet): Promise<MissionSet>;
  listSets(): Promise<MissionSet[]>;

  addVote(missionId: string, choice: Choice): Promise<Choice[]>;
  getVotes(missionId: string): Promise<Choice[]>;

  addLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry>;
  listLedger(uid: string): Promise<LedgerEntry[]>;
  listAllLedger(): Promise<LedgerEntry[]>;

  getPayment(paymentId: string): Promise<PaymentRecord | null>;
  savePayment(record: PaymentRecord): Promise<PaymentRecord>;
}

/** 관리자 대시보드(/admin) 통계 응답 */
export interface AdminOverviewResponse {
  summary: {
    totalUsers: number;
    piUsers: number;
    demoUsers: number;
    totalSets: number;
    completedSets: number;
    totalMissions: number;
    activeMissions: number;
    closedMissions: number;
    reportedMissions: number;
    totalVotes: number;
    u2aRevenuePi: number;
    a2uRewardedPi: number;
    a2uClaimedPi: number;
  };
  recentUsers: Array<{
    uid: string;
    username: string;
    isDemo: boolean;
    trustScore: number;
    setsCompleted: number;
    balance: number;
    botFlags: number;
    updatedAt: ISODateString;
  }>;
  requesterMissions: Array<{
    id: string;
    prompt: string;
    kind: MissionKind;
    mode?: MissionMode;
    status: MissionStatus;
    requesterUid?: string;
    votes: VoteTally;
    reports: number;
    consensus: Choice | null;
    createdAt: ISODateString;
  }>;
}

/* =====================================================================
 * API 응답 공통 형식
 * ===================================================================== */

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/** live: PI_API_KEY 설정됨 (실제 Pi Platform 승인) / mock: 모의 승인 */
export type PaymentsMode = 'live' | 'mock';

export interface SignInResponse {
  /** HMAC 서명된 Bearer 토큰 */
  token: string;
  profile: PioneerProfile;
  paymentsMode: PaymentsMode;
}

export interface MeResponse {
  profile: PioneerProfile | null;
  paymentsMode: PaymentsMode;
  verifyMode: 'live' | 'mock';
  demoAllowed: boolean;
}

export interface PaymentCompleteResponse {
  paymentId: string;
  status: PaymentRecordStatus;
  /** 결제로 활성화된 의뢰자 문항 ID */
  missionId?: string;
  mock: boolean;
}

export interface IncompletePaymentResponse {
  action: 'none' | 'already_completed' | 'completed' | 'cancelled';
  missionId?: string;
}

/** 의뢰자 문항 작성 결과 */
export interface DraftResponse {
  draftId: string;
  fee: number;
}

/** 내 의뢰 문항 현황 */
export interface MyMissionItem {
  id: string;
  kind: MissionKind;
  mode?: MissionMode;
  prompt: string;
  status: MissionStatus;
  /** 실제 판별자 응답 집계 (가상 응답 제외) */
  votes: VoteTally;
  /** 실제 응답이 과반(3표 이상)으로 모였을 때의 합의 라벨 */
  consensus: Choice | null;
  createdAt: ISODateString;
}

export interface WalletResponse {
  profile: PioneerProfile;
  ledger: LedgerEntry[];
  minClaim: number;
  canClaim: boolean;
  /** live: 실제 A2U 출금 / mock: 모의 정산 */
  payoutMode: PaymentsMode;
}

export interface ClaimResponse {
  amount: number;
  entry: LedgerEntry;
  profile: PioneerProfile;
  mock: boolean;
}

/* =====================================================================
 * Pi SDK (window.Pi) 타입
 * 참고: https://github.com/pi-apps/pi-platform-docs
 * ===================================================================== */

export type PiScope = 'username' | 'payments' | 'wallet_address';

export interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username?: string;
  };
}

/** Pi Platform 이 반환하는 결제 객체 */
export interface PiPaymentDTO {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  from_address: string;
  to_address: string;
  direction: 'user_to_app' | 'app_to_user';
  created_at: string;
  network: string;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction: null | {
    txid: string;
    verified: boolean;
    _link: string;
  };
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPaymentDTO) => void;
}

export interface PiSdk {
  init: (config: { version: string; sandbox?: boolean }) => void | Promise<void>;
  authenticate: (
    scopes: PiScope[],
    onIncompletePaymentFound: (payment: PiPaymentDTO) => void,
  ) => Promise<PiAuthResult>;
  createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
  openShareDialog?: (title: string, message: string) => void;
}

declare global {
  interface Window {
    Pi?: PiSdk;
  }
}
