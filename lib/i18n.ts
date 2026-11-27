/**
 * VeriLens 다국어 지원 (한국어 / English)
 * - 글로벌 해커톤 심사위원과 한국어 사용자 모두 편하게 쓸 수 있도록 핵심 UI 문구를 제공합니다.
 */

export type Lang = 'ko' | 'en';
export type Locale = 'ko' | 'en' | 'vi' | 'id' | 'zh' | 'es';

export const LOCALE_OPTIONS: { id: Locale; code: string; name: string }[] = [
  { id: 'ko', code: 'KO', name: '한국어' },
  { id: 'en', code: 'EN', name: 'English' },
  { id: 'vi', code: 'VI', name: 'Tiếng Việt' },
  { id: 'id', code: 'ID', name: 'Indonesia' },
  { id: 'zh', code: 'ZH', name: '中文' },
  { id: 'es', code: 'ES', name: 'Español' },
];

export const LANG_STORAGE_KEY = 'vl_lang';

export function detectBrowserLocale(raw?: string): Locale {
  const b = (raw ?? '').toLowerCase();
  if (b.startsWith('ko')) return 'ko';
  if (b.startsWith('vi')) return 'vi';
  if (b.startsWith('id') || b.startsWith('in')) return 'id';
  if (b.startsWith('zh')) return 'zh';
  if (b.startsWith('es')) return 'es';
  return 'en';
}

export const NAV_LABELS_6: Record<Locale, { home: string; verify: string; submit: string; wallet: string }> = {
  ko: { home: '홈', verify: '판별하기', submit: '의뢰하기', wallet: '내 지갑' },
  en: { home: 'Home', verify: 'Verify', submit: 'Submit', wallet: 'Wallet' },
  vi: { home: 'Trang chủ', verify: 'Xác minh', submit: 'Gửi kiểm', wallet: 'Ví Pi' },
  id: { home: 'Beranda', verify: 'Verifikasi', submit: 'Ajukan', wallet: 'Dompet' },
  zh: { home: '首页', verify: '鉴别', submit: '委托', wallet: '钱包' },
  es: { home: 'Inicio', verify: 'Verificar', submit: 'Enviar', wallet: 'Billetera' },
};

export const HOME_HUB_TEXT: Record<
  Locale,
  {
    heroCta: string;
    myPage: string;
    verifyTitle: string;
    verifySub: string;
    verifyResumeSub: string;
    submitTitle: string;
    submitSub: string;
    walletTitle: string;
    walletSub: string;
    myTitle: string;
    mySub: string;
    dailyTitle: string;
    dailySub: string;
    photoBadge: string;
    nextPhoto: string;
    tryAnother: string;
    fullGame: string;
    yesterdayTrap: (p: number) => string;
    aiSampleTag: string;
    aiTellLabel: string;
    chipSmishing: string;
    chipListing: string;
    chipReview: string;
    chipAlerts: string;
    yesterdayWin: string;
    yesterdayLose: (ans: string) => string;
  }
> = {
  ko: {
    heroCta: '둘 중 진짜는? 10명의 눈으로 AI 가짜를 가려냅니다',
    myPage: '마이페이지',
    verifyTitle: 'AI 판별하기',
    verifySub: '5문항 · Pi 적립',
    verifyResumeSub: '이어서 풀기',
    submitTitle: '진위 의뢰하기',
    submitSub: '스미싱 · 매물 · 리뷰',
    walletTitle: '내 지갑',
    walletSub: '보상 · Pi 출금',
    myTitle: '마이 · 랭킹',
    mySub: '신뢰도 · TOP 5',
    dailyTitle: '오늘의 데일리 챌린지 (공통 5문제)',
    dailySub: '전 세계 유저 공통 5문제 · 매일 도전!',
    photoBadge: '실사 맛보기',
    nextPhoto: '다른 사진',
    tryAnother: '한 문제 더',
    fullGame: '본 게임 하기',
    yesterdayTrap: (p) => `어제 오답 1위 · 오답률 ${p}%`,
    aiSampleTag: '🤖 많은 사람이 속은 AI 함정 예시',
    aiTellLabel: '감별 포인트: ',
    chipSmishing: '🚨 스미싱 의심',
    chipListing: '📸 중고매물 검증',
    chipReview: '⭐ 가짜리뷰 판별',
    chipAlerts: '🛡️ 사기 경보',
    yesterdayWin: '정답! 남들이 다 속은 문제를 맞혔어요!',
    yesterdayLose: (ans) => `아쉽네요! 실제 인간 원본은 ${ans}였어요.`,
  },
  en: {
    heroCta: 'Real or AI? 10 human eyes verify what is real',
    myPage: 'My Page',
    verifyTitle: 'Verify AI',
    verifySub: '5 Qs · Earn Pi',
    verifyResumeSub: 'Continue set',
    submitTitle: 'Submit Check',
    submitSub: 'Scam · Listing · Review',
    walletTitle: 'My Wallet',
    walletSub: 'Rewards · Claim',
    myTitle: 'My · Ranking',
    mySub: 'Trust · TOP 5',
    dailyTitle: "Today's Daily Challenge (5 Qs)",
    dailySub: 'Same 5 questions worldwide · Play daily!',
    photoBadge: 'Photo Challenge',
    nextPhoto: 'Next photo',
    tryAnother: 'Try another',
    fullGame: 'Full Game',
    yesterdayTrap: (p) => `Yesterday #1 · ${p}% fooled`,
    aiSampleTag: '🤖 AI Trap Sample',
    aiTellLabel: 'AI Tell: ',
    chipSmishing: '🚨 Scam Check',
    chipListing: '📸 Listing Photo',
    chipReview: '⭐ Fake Review',
    chipAlerts: '🛡️ Scam Alerts',
    yesterdayWin: 'Spot on! You beat the trap that fooled most players!',
    yesterdayLose: (ans) => `Caught by the trap! The real human one was ${ans}.`,
  },
  vi: {
    heroCta: 'Phát hiện AI giả & nhận thưởng Pi trong 1 phút!',
    myPage: 'Trang của tôi',
    verifyTitle: 'Xác minh AI',
    verifySub: '5 câu · Nhận Pi',
    verifyResumeSub: 'Tiếp tục',
    submitTitle: 'Gửi kiểm tra',
    submitSub: 'Lừa đảo · Đồ cũ · Review',
    walletTitle: 'Ví của tôi',
    walletSub: 'Thưởng · Rút Pi',
    myTitle: 'Cá nhân · BXH',
    mySub: 'Uy tín · TOP 5',
    dailyTitle: 'Thử thách Hôm nay (5 câu)',
    dailySub: 'Cùng 5 câu toàn cầu · Chơi mỗi ngày!',
    photoBadge: 'Thử ảnh thật',
    nextPhoto: 'Ảnh khác',
    tryAnother: 'Thử câu khác',
    fullGame: 'Chơi ngay',
    yesterdayTrap: (p) => `Bẫy khó nhất hôm qua · ${p}% nhầm`,
    aiSampleTag: '🤖 Mẫu bẫy AI',
    aiTellLabel: 'Dấu hiệu AI: ',
    chipSmishing: '🚨 Tin lừa đảo',
    chipListing: '📸 Ảnh rao bán',
    chipReview: '⭐ Review ảo',
    chipAlerts: '🛡️ Cảnh báo',
    yesterdayWin: 'Chính xác! Bạn đã vượt qua bẫy khó nhất hôm qua!',
    yesterdayLose: (ans) => `Tiếc quá! Đáp án người thật là ${ans}.`,
  },
  id: {
    heroCta: 'Deteksi palsu AI & raih Pi dalam 1 menit!',
    myPage: 'Halaman Saya',
    verifyTitle: 'Verifikasi AI',
    verifySub: '5 Soal · Dapat Pi',
    verifyResumeSub: 'Lanjutkan',
    submitTitle: 'Ajukan Cek',
    submitSub: 'Penipuan · Barang · Ulasan',
    walletTitle: 'Dompet Saya',
    walletSub: 'Hadiah · Klaim Pi',
    myTitle: 'Saya · Peringkat',
    mySub: 'Skor · TOP 5',
    dailyTitle: 'Tantangan Harian (5 Soal)',
    dailySub: '5 soal sama sedunia · Main tiap hari!',
    photoBadge: 'Tebak Foto',
    nextPhoto: 'Foto lain',
    tryAnother: 'Coba lagi',
    fullGame: 'Main Penuh',
    yesterdayTrap: (p) => `Jebakan #1 Kemarin · ${p}% tertipu`,
    aiSampleTag: '🤖 Contoh Jebakan AI',
    aiTellLabel: 'Ciri AI: ',
    chipSmishing: '🚨 Cek Penipuan',
    chipListing: '📸 Foto Barang',
    chipReview: '⭐ Ulasan Palsu',
    chipAlerts: '🛡️ Info Penipuan',
    yesterdayWin: 'Tepat! Kamu lolos dari jebakan tersulit kemarin!',
    yesterdayLose: (ans) => `Terjebak! Jawaban asli manusia adalah ${ans}.`,
  },
  zh: {
    heroCta: '1分钟识破AI造假，赢取Pi奖励！',
    myPage: '我的主页',
    verifyTitle: 'AI 鉴别',
    verifySub: '5题 · 赚取 Pi',
    verifyResumeSub: '继续答题',
    submitTitle: '发起委托',
    submitSub: '防诈 · 二手 · 刷评',
    walletTitle: '我的钱包',
    walletSub: '奖励 · 提取 Pi',
    myTitle: '我的 · 排行',
    mySub: '信誉分 · TOP 5',
    dailyTitle: '每日挑战 (全球同题5题)',
    dailySub: '全球统一5题 · 每日必玩！',
    photoBadge: '实拍挑战',
    nextPhoto: '换一张',
    tryAnother: '再来一题',
    fullGame: '进入正式赛',
    yesterdayTrap: (p) => `昨日最难陷阱 · ${p}% 答错`,
    aiSampleTag: '🤖 AI 陷阱示例',
    aiTellLabel: '识别要点：',
    chipSmishing: '🚨 疑似诈骗',
    chipListing: '📸 二手验图',
    chipReview: '⭐ 虚假好评',
    chipAlerts: '🛡️ 诈骗警报',
    yesterdayWin: '答对了！你识破了昨天最难的陷阱！',
    yesterdayLose: (ans) => `可惜！真实人类内容是 ${ans}。`,
  },
  es: {
    heroCta: '¡Detecta falsos de IA y gana Pi en 1 minuto!',
    myPage: 'Mi Perfil',
    verifyTitle: 'Verificar IA',
    verifySub: '5 pregs · Gana Pi',
    verifyResumeSub: 'Continuar',
    submitTitle: 'Enviar Duda',
    submitSub: 'Estafa · Anuncio · Reseña',
    walletTitle: 'Billetera',
    walletSub: 'Premios · Reclamar',
    myTitle: 'Perfil · Ranking',
    mySub: 'Confianza · TOP 5',
    dailyTitle: 'Reto Diario (5 preguntas)',
    dailySub: 'Mismas 5 preguntas globales · ¡Juega hoy!',
    photoBadge: 'Reto Foto',
    nextPhoto: 'Otra foto',
    tryAnother: 'Probar otra',
    fullGame: 'Jugar ya',
    yesterdayTrap: (p) => `Trampa #1 de ayer · ${p}% falló`,
    aiSampleTag: '🤖 Ejemplo trampa IA',
    aiTellLabel: 'Pista IA: ',
    chipSmishing: '🚨 Posible estafa',
    chipListing: '📸 Foto anuncio',
    chipReview: '⭐ Reseña falsa',
    chipAlerts: '🛡️ Alertas',
    yesterdayWin: '¡Exacto! Superaste la trampa más difícil de ayer!',
    yesterdayLose: (ans) => `¡Casi! La respuesta humana real era ${ans}.`,
  },
};

export const NAV_LABELS: Record<Lang, { home: string; verify: string; submit: string; wallet: string }> = {
  ko: NAV_LABELS_6.ko,
  en: NAV_LABELS_6.en,
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
    startSession: '휴먼 검증 시작 (1시간 유효)',
    howItWorks: 'How it works',
    step1Title: 'PiVerify 인간 증명',
    step1Body: '세션 시작 시 1회 생체·고유성 검증으로 봇을 원천 차단합니다.',
    step2Title: '문항 A/B 판별',
    step2Body: (n) => `${n}문항마다 5초 안에 진짜 원본을 고르세요. 숨김 기준 문항과 가끔 🎁 보너스 문제(맞히면 신뢰도 추가 점수)가 등장합니다.`,
    step3Title: '10인 다수결 합의 → Pi 보상',
    step3Body: (pi) => `다른 인증된 판별자 10명과 다수결(6표 이상)이 일치하면 문항당 ${pi} π 를 받습니다.`,
    tiersLabel: '신뢰도 등급 (1,000점 만점)',
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
    step2Body: (n) => `Pick the authentic human original across ${n} items (~5s each). Includes hidden Gold Standard checks and occasional 🎁 Bonus questions for extra Trust points.`,
    step3Title: '10-Human Consensus → Pi',
    step3Body: (pi) => `Earn ${pi} π per item when your choice aligns with the 10-human majority (6+ votes).`,
    tiersLabel: 'Trust Tiers (out of 1,000)',
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
    startSessionBtn: '휴먼 검증 시작',
    challengeChip: '친구의 도전장 문항이 포함되어 있어요',
    retryBtn: '새 세트 받기',
    question: '문항',
    session: '세션',
    footerHint: '직관을 믿으세요 · 평균 5초 · 너무 빠른 응답은 보상에서 제외됩니다',
    submitting: '10인 다수결 합의 집계 중…',
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
    submitting: 'Computing 10-human consensus…',
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
    accuracyTitle: '이번 세트 판별 적중 (총 5문항)',
    topPrefix: '상위 ',
    topSuffix: '%',
    rewardTitle: '이번 세트 보상',
    matchedSuffix: '문항 10인 다수결 일치',
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
    consensusLabel: '10인 다수결',
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
    accuracyTitle: 'Set Accuracy (5 Questions)',
    topPrefix: 'Top ',
    topSuffix: '%',
    rewardTitle: 'Set Reward',
    matchedSuffix: ' items matched 10-voter consensus',
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
    consensusLabel: '10-Human Vote',
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
