/**
 * VeriLens 다국어 지원 (한국어 / English)
 * - 글로벌 해커톤 심사위원과 한국어 사용자 모두 편하게 쓸 수 있도록 핵심 UI 문구를 제공합니다.
 */

export type Lang = 'ko' | 'en';

export const LANG_STORAGE_KEY = 'vl_lang';

export const NAV_LABELS: Record<Lang, { home: string; verify: string; submit: string; wallet: string }> = {
  ko: { home: '홈', verify: '판별하기', submit: '의뢰하기', wallet: '내 지갑' },
  en: { home: 'Home', verify: 'Verify', submit: 'Submit', wallet: 'Wallet' },
};

export const HOME_TEXT: Record<
  Lang,
  {
    tagline: string;
    introPrefix: string;
    introHighlight: string;
    introMid: string;
    introReward: string;
    introSuffix: string;
    loginTitle: string;
    trustLabel: string;
    streakLabel: string;
    streakUnit: string;
    setsLabel: string;
    balanceLabel: string;
    sessionActive: string;
    continueVerify: string;
    sessionDesc1: string;
    sessionDescHighlight: string;
    sessionDesc2: string;
    startSession: string;
    howItWorks: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: (n: number) => string;
    step3Title: string;
    step3Body: (pi: number) => string;
    tiersLabel: string;
    termsLink: string;
    privacyLink: string;
  }
> = {
  ko: {
    tagline: 'Human Intuition vs. Synthetic Illusion',
    introPrefix: 'AI가 만든 가짜가 넘쳐나는 시대, ',
    introHighlight: 'KYC 인증된 진짜 인간',
    introMid: '의 직관으로 AI 합성물과 딥페이크를 가려내고 ',
    introReward: 'Pi 보상',
    introSuffix: '을 받으세요.',
    loginTitle: '인간 판별단에 합류하기',
    trustLabel: '신뢰도 (Trust Score)',
    streakLabel: '연속 참여',
    streakUnit: '일',
    setsLabel: '완료 세트',
    balanceLabel: '잔액',
    sessionActive: 'Human Verified 세션 활성',
    continueVerify: '판별 계속하기',
    sessionDesc1: '판별을 시작하려면 ',
    sessionDescHighlight: '1회 인간 검증',
    sessionDesc2: '이 필요합니다. 검증 후 60분 동안 자유롭게 판별할 수 있어요.',
    startSession: '인간 판별 세션 시작 (1시간 유효)',
    howItWorks: 'How it works',
    step1Title: 'PiVerify 인간 증명',
    step1Body: '세션 시작 시 1회 생체·고유성 검증으로 봇을 원천 차단합니다.',
    step2Title: '문항 A/B 판별',
    step2Body: (n) => `${n}문항마다 5초 안에 진짜 원본을 고르세요. 정답이 정해진 숨김 기준 문항이 섞여 있습니다.`,
    step3Title: '5인 다수결 합의 → Pi 보상',
    step3Body: (pi) => `다른 인증된 판별자들과 다수결이 일치하면 문항당 ${pi} π 를 받습니다.`,
    tiersLabel: '신뢰도 등급',
    termsLink: '이용약관',
    privacyLink: '개인정보처리방침',
  },
  en: {
    tagline: 'Human Intuition vs. Synthetic Illusion',
    introPrefix: 'In an era of synthetic AI content, use ',
    introHighlight: 'KYC-verified human intuition',
    introMid: ' to spot deepfakes and AI fakes and earn ',
    introReward: 'Pi rewards',
    introSuffix: '.',
    loginTitle: 'Join the Human Verifiers',
    trustLabel: 'Trust Score',
    streakLabel: 'Streak',
    streakUnit: 'd',
    setsLabel: 'Sets',
    balanceLabel: 'Balance',
    sessionActive: 'Human Verified Session Active',
    continueVerify: 'Continue Verifying',
    sessionDesc1: 'Start with a quick ',
    sessionDescHighlight: '1-step human check',
    sessionDesc2: '. Once verified, you can verify freely for 60 minutes.',
    startSession: 'Start Human Session (1h)',
    howItWorks: 'How it works',
    step1Title: 'PiVerify Proof of Human',
    step1Body: 'Blocks bots at session entry with liveness & uniqueness verification.',
    step2Title: 'A/B Intuition Check',
    step2Body: (n) => `Pick the authentic human original across ${n} items (~5s each). Includes hidden Gold Standard checks.`,
    step3Title: '5-Person Consensus → Pi',
    step3Body: (pi) => `Earn ${pi} π per matched item when your choice aligns with the 5-human majority.`,
    tiersLabel: 'Trust Tiers',
    termsLink: 'Terms',
    privacyLink: 'Privacy',
  },
};

export const LOGIN_TEXT: Record<
  Lang,
  {
    defaultTitle: string;
    piBrowserHint: string;
    webHint: string;
    piLoginBtn: string;
    demoBtn: string;
  }
> = {
  ko: {
    defaultTitle: '로그인이 필요합니다',
    piBrowserHint: 'Pi 계정으로 로그인하고 인간 판별을 시작하세요.',
    webHint: 'Pi Browser 에서 열면 Pi 계정으로 로그인할 수 있습니다.',
    piLoginBtn: 'Pi 계정으로 로그인',
    demoBtn: '데모 계정으로 체험하기',
  },
  en: {
    defaultTitle: 'Sign in required',
    piBrowserHint: 'Sign in with your Pi account to start verifying.',
    webHint: 'Open in Pi Browser to sign in with your Pi account, or try Demo Mode below.',
    piLoginBtn: 'Sign in with Pi',
    demoBtn: 'Try with Demo Account',
  },
};

export const VERIFY_TEXT: Record<
  Lang,
  {
    loading: string;
    preparing: string;
    needSessionTitle: string;
    needSessionDesc: string;
    startSessionBtn: string;
    challengeChip: string;
    retryBtn: string;
    question: string;
    session: string;
    footerHint: string;
    submitting: string;
    loginTitle: string;
    scanTitle: string;
    scanSubtitle: string;
    recheckTitle: string;
    recheckSubtitle: string;
    expiredTitle: string;
    expiredSubtitle: string;
    recheckFailed: string;
  }
> = {
  ko: {
    loading: '불러오는 중…',
    preparing: '판별 세트를 준비하는 중…',
    needSessionTitle: '인간 검증이 필요합니다',
    needSessionDesc: '1회 검증으로 1시간 동안 판별할 수 있습니다.',
    startSessionBtn: '인간 판별 세션 시작',
    challengeChip: '친구의 도전장 문항이 포함되어 있어요',
    retryBtn: '새 세트 받기',
    question: '문항',
    session: '세션',
    footerHint: '직관을 믿으세요 · 평균 5초 · 너무 빠른 응답은 보상에서 제외됩니다',
    submitting: '5인 다수결 합의 집계 중…',
    loginTitle: '판별하려면 로그인하세요',
    scanTitle: 'PiVerify 인간 검증',
    scanSubtitle: '얼굴 생존성·고유성을 확인하는 중…',
    recheckTitle: '2단계 인간 재검증',
    recheckSubtitle: '비정상 패턴이 감지되어 사람임을 다시 확인합니다…',
    expiredTitle: '세션 만료 · 인간 재검증',
    expiredSubtitle: '제출 전에 사람임을 다시 확인합니다…',
    recheckFailed: '재검증에 실패했습니다. 다시 시도해 주세요.',
  },
  en: {
    loading: 'Loading…',
    preparing: 'Preparing verification set…',
    needSessionTitle: 'Human verification needed',
    needSessionDesc: 'Verify once to unlock 1 hour of verification.',
    startSessionBtn: 'Start Human Session',
    challengeChip: "Includes a friend's challenge item",
    retryBtn: 'Get new set',
    question: 'Item',
    session: 'Session',
    footerHint: 'Trust your intuition · ~5s each · Ultra-fast clicks are excluded from rewards',
    submitting: 'Computing 5-human consensus…',
    loginTitle: 'Sign in to verify',
    scanTitle: 'PiVerify Human Check',
    scanSubtitle: 'Checking liveness & uniqueness…',
    recheckTitle: 'Stage 2 Human Recheck',
    recheckSubtitle: 'Unusual pattern detected. Re-verifying human presence…',
    expiredTitle: 'Session Expired · Re-verify',
    expiredSubtitle: 'Confirming human presence before submitting…',
    recheckFailed: 'Re-verification failed. Please try again.',
  },
};

export const RESULT_TEXT: Record<
  Lang,
  {
    empty: string;
    goVerify: string;
    accuracyTitle: string;
    topPrefix: string;
    topSuffix: string;
    rewardTitle: string;
    matchedSuffix: string;
    trustLabel: string;
    streakSuffix: string;
    reportTitle: string;
    shareBtn: string;
    nextSetBtn: string;
    homeBtn: string;
    flaggedTitle: string;
    flaggedBody: string;
    goldFailTitle: string;
    goldFailBody: string;
    goldPassTitle: string;
    goldPassRecheck: string;
    goldPassBody: string;
    imageLabel: string;
    textLabel: string;
    fastExcluded: string;
    myChoice: string;
    consensusLabel: string;
    undecided: string;
    actualOrigin: string;
    votesUnit: string;
    reactionLabel: string;
    secUnit: string;
    aiTellLabel: string;
  }
> = {
  ko: {
    empty: '표시할 판별 결과가 없습니다.',
    goVerify: '판별하러 가기',
    accuracyTitle: '당신의 인간 직관 적중률',
    topPrefix: '상위 ',
    topSuffix: '%',
    rewardTitle: '이번 세트 보상',
    matchedSuffix: '문항 다수결 일치',
    trustLabel: '신뢰도',
    streakSuffix: '일 연속',
    reportTitle: 'AI가 남긴 어색한 흔적 리포트',
    shareBtn: '친구에게 도전장 보내기 (PiNet 링크)',
    nextSetBtn: '다음 세트',
    homeBtn: '홈',
    flaggedTitle: '매크로 의심 — 이번 세트 보상 미지급',
    flaggedBody: '반복되면 신뢰도가 크게 하락합니다.',
    goldFailTitle: '숨김 기준 문항을 놓쳤어요',
    goldFailBody: '정답이 확정된 기준 문항을 틀려 이번 세트 보상이 지급되지 않았고 신뢰도가 하락했습니다. 무작위 선택을 막기 위한 장치예요.',
    goldPassTitle: '기준 문항 통과 · Human Verified',
    goldPassRecheck: '세트 도중 2단계 재검증을 통과했습니다. 초고속 응답 문항만 보상에서 제외됩니다.',
    goldPassBody: '정답이 확정된 숨김 기준 문항을 통과해 다수결 일치 문항에 보상이 지급되었습니다.',
    imageLabel: '이미지',
    textLabel: '텍스트',
    fastExcluded: '초고속 · 보상 제외',
    myChoice: '내 선택',
    consensusLabel: '5인 다수결',
    undecided: '미확정',
    actualOrigin: '실제 원본',
    votesUnit: '표',
    reactionLabel: '반응 ',
    secUnit: '초',
    aiTellLabel: 'AI가 남긴 흔적',
  },
  en: {
    empty: 'No verification results to display.',
    goVerify: 'Start Verifying',
    accuracyTitle: 'Your Human Intuition Score',
    topPrefix: 'Top ',
    topSuffix: '%',
    rewardTitle: 'Set Reward',
    matchedSuffix: ' items matched consensus',
    trustLabel: 'Trust',
    streakSuffix: 'd streak',
    reportTitle: 'AI Tell Report',
    shareBtn: 'Challenge a Friend (PiNet Link)',
    nextSetBtn: 'Next Set',
    homeBtn: 'Home',
    flaggedTitle: 'Bot Pattern Flagged — Reward Withheld',
    flaggedBody: 'Repeated flags will reduce your Trust Score.',
    goldFailTitle: 'Hidden Gold Standard Missed',
    goldFailBody: 'You missed the hidden ground-truth check, so rewards for this set were withheld to prevent random clicking.',
    goldPassTitle: 'Gold Standard Passed · Human Verified',
    goldPassRecheck: 'Stage 2 re-check passed. Only ultra-fast responses were excluded from rewards.',
    goldPassBody: 'You passed the hidden Gold Standard check and earned rewards for consensus matches.',
    imageLabel: 'Image',
    textLabel: 'Text',
    fastExcluded: 'Too fast · Excluded',
    myChoice: 'Your Pick',
    consensusLabel: '5-Human Vote',
    undecided: 'Tie',
    actualOrigin: 'Original',
    votesUnit: '',
    reactionLabel: '',
    secUnit: 's',
    aiTellLabel: 'AI Tell',
  },
};

export const WALLET_TEXT: Record<
  Lang,
  {
    loginTitle: string;
    title: string;
    trustLabel: string;
    balanceLabel: string;
    minClaimLabel: string;
    claimBtn: string;
    claimReadyHint: string;
    claimMinHint: (min: number) => string;
    earnedLabel: string;
    claimedLabel: string;
    setsLabel: string;
    ledgerTitle: string;
    emptyLedger: string;
    goVerifyBtn: string;
    reverifyTitle: string;
    reverifySubtitle: string;
  }
> = {
  ko: {
    loginTitle: '지갑을 보려면 로그인하세요',
    title: '내 지갑',
    trustLabel: '신뢰도',
    balanceLabel: '출금 가능 잔액',
    minClaimLabel: '최소 청구 기준',
    claimBtn: '보상 청구 (Claim)',
    claimReadyHint: '청구 시 1초 생체 재검증(PiVerify 3단계)을 거칩니다.',
    claimMinHint: (min) => `잔액이 ${min} π 이상이면 청구할 수 있어요.`,
    earnedLabel: '누적 획득',
    claimedLabel: '누적 청구',
    setsLabel: '완료 세트',
    ledgerTitle: '정산 내역',
    emptyLedger: '아직 정산 내역이 없습니다. 판별에 참여해 첫 보상을 받아 보세요.',
    goVerifyBtn: '판별하러 가기',
    reverifyTitle: '3단계 출금 재검증',
    reverifySubtitle: '보상 청구 전 마지막으로 본인을 확인합니다…',
  },
  en: {
    loginTitle: 'Sign in to view your wallet',
    title: 'My Wallet',
    trustLabel: 'Trust',
    balanceLabel: 'Claimable Balance',
    minClaimLabel: 'Minimum Claim',
    claimBtn: 'Claim Rewards',
    claimReadyHint: 'Requires a 1s Stage-3 PiVerify check before payout.',
    claimMinHint: (min) => `Reach at least ${min} π to claim rewards.`,
    earnedLabel: 'Total Earned',
    claimedLabel: 'Total Claimed',
    setsLabel: 'Sets Done',
    ledgerTitle: 'Ledger History',
    emptyLedger: 'No transactions yet. Complete a verification set to earn your first reward.',
    goVerifyBtn: 'Go Verify',
    reverifyTitle: 'Stage 3 Claim Re-verify',
    reverifySubtitle: 'Final human check before payout…',
  },
};
