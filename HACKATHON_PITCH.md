# VeriLens — Pi Next Hackathon Submission Kit

> 해커톤 제출 폼(`Develop → Hackathon`)과 데모 영상 제작 시 그대로 복사·참고하실 수 있는 자료입니다.

---

## 1. 영문 출품 소개문 (Hackathon Form 복사용)

### App Name / Subtitle
- **App Name**: `VeriLens`
- **Subtitle**: `Spot AI Fakes & Earn Pi`
- **Live URL**: `https://verilens-chi.vercel.app`
- **PiNet URL**: `https://verilens1759.pinet.com`

### One-Liner (한 줄 요약)
> A human-intuition verification platform powered by Pi Network, enabling KYC-verified Pioneers to spot AI-generated fakes, prevent Model Collapse, and earn Pi via 10-human consensus.

### Project Description (Full)

#### The Problem: AI Model Collapse & Bot Pollution
As AI-generated text, deepfakes, and synthetic images flood the internet, AI models increasingly retrain on synthetic outputs—causing **Model Collapse**. Traditional crowdsourcing platforms struggle with automated bots and click-farms that poison human-labeled datasets.

#### The Solution: VeriLens
**VeriLens** leverages Pi Network's verified human community to create a bot-resistant **Human Reality Filter**—applicable to both AI dataset curation and everyday digital fraud prevention (smishing/phishing messages, fake marketplace listings, synthetic reviews, and deepfakes). In fast comparisons, verified Pioneers distinguish authentic human-created content from AI fakes and earn Pi rewards when their intuition aligns with a 10-human consensus.

#### Alignment with Pi Ecosystem Summit Vision
VeriLens directly operationalizes the core themes highlighted at the **Pi Ecosystem Summit**:
- **Human-in-the-Loop AI (`Pi DataLab` Vision)**: Connects growing AI evaluation and content-verification demand with Pi Network's KYC-verified human community.
- **Proof of Humanity (`PiVerify`)**: Combines Pi KYC identity with 3-stage session proof and behavioral anti-bot checks to ensure only genuine human judgment enters consensus.
- **From Liquidity to Utility**: Powers a real two-sided utility loop—requesters pay in Pi (and **Phase 2 B2B OUSD** stablecoin rails), and verified Pioneers earn Pi for accurate human judgment.

#### Key Features & Pi Infrastructure Integration
1. **Pi Sign-In & Live Testnet Payments (`Pi SDK v2.0`)**:
   - Seamless authentication inside Pi Browser (`Pi.authenticate`) with automatic incomplete-payment recovery (`onIncompletePaymentFound`).
   - **B2C & B2B Requester Portal (`/submit`)**: Features **4 1-tap real-world templates** (**Smishing/Scam**, **Marketplace Listing Photo**, **Human Tone A/B**, and **Fake Review Check**) supporting both **Single Check (1 item)** and **A/B Compare (2 items)**, plus **VeriLens Official Verdict** summaries once consensus forms. Requesters submit text or compressed, EXIF-stripped images, confirm copyright warranty, and pay **1 Test-Pi** on Pi Testnet (`Pi.createPayment`) to publish directly into the live verification pool.
   - **Demo Sandbox Mode**: Automatically enabled in regular web browsers so judges without Pi Browser can test the full end-to-end flow immediately.
2. **3-Stage Session-Based Human Proof (`PiVerifyAdapter` Architecture)**:
   - **Stage 1 (Session Entry)**: Quick human liveness/uniqueness check issuing a signed 1-hour session token.
   - **Stage 2 (Passive Behavior Monitor)**: Tracks per-item reaction latency (ms) on both client and server; consecutive ultra-fast clicks (<300ms) trigger a mandatory re-check modal.
   - **Stage 3 (Claim Re-verify)**: One-time 2-minute re-verification token required before claiming rewards.
   - *(Note: Built with a clean `PiVerifyAdapter` interface; currently running `MockPiVerifyAdapter` for hackathon demo until official PiVerify API endpoints are released, while token signing & server timing integrity checks are live.)*
3. **Dual Quality Assurance (Hidden Gold Standard + 10-Human Consensus)**:
   - Every 5-item set hides 1 ground-truth **Gold Standard** anchor item. Failing the anchor withholds set rewards and lowers the user's Trust Score, stopping random clicking.
   - Remaining items use **10-human majority consensus** (6+ votes), followed by an engaging **AI Tell Report** explaining the subtle AI artifacts—driving high retention alongside **AI Detection Hints** and **PiNet challenge link sharing**.
4. **Gamification, Retention & Viral Growth Engine**:
   - **Daily Challenge (`?mode=daily`)**: A deterministic global 5-item daily challenge with Wordle-style `🟩`/`🟥` emoji grid sharing and bidirectional referral bonuses (`?ref=`).
   - **1,000-Point 6-Tier Trust System (`Bronze` → `Master`)**: Features tier reward multipliers (`1.0x` to `2.0x`), a `+25 pts/day` daily trust gain cap to preserve tier prestige, streak milestones (`3·7·14·30 days`) granting free submission tickets, **Yesterday's Top Trap** recap, and a **Top 5 Leaderboard (`/my`)**.
   - **Mobile-First UX & Global Onboarding**: Financial-app-inspired 4-menu action hub (`/`), rotating **Photo Challenge** teaser, full-screen **Image Zoom Viewer** during verification, and automatic `EN` locale detection for international Pioneers.
5. **Content Risk, Moderation & Operations (`/admin`)**:
   - Mandatory copyright & excerpt warranty on submission, automatic client-side image resizing & EXIF metadata removal, an in-game **Report** button (auto-hides after 2 reports), and a protected **`/admin` dashboard** for real-time metrics and moderation.

#### Tech Stack & Roadmap
- **Frontend / API**: Next.js 14 (App Router), TypeScript, Tailwind CSS (Pi Browser-native White & Plum Purple UI, auto-detected `EN/KO` bilingual support)
- **Database**: Supabase (PostgreSQL with RLS & unique ledger indexes preventing double-rewards / double-claims) via Repository Pattern
- **Pi Integration**: Pi SDK 2.0, Pi Platform REST API (server-side `/approve`, `/complete`, `/incomplete`), PiNet (`verilens1759.pinet.com`)
- **Phase 2 Roadmap (B2B & OUSD)**: Dual-currency (`PI` / `OUSD`) settlement so enterprise clients can pay predictable USD-pegged rates in **Open USD (OUSD)** while Pioneers earn Pi rewards.

---

## 2. 국문 요약 소개문

**VeriLens**는 Pi Ecosystem Summit에서 제시된 **'AI 시대의 인간 참여(Human-in-the-Loop)'**, **'Proof of Humanity(PiVerify)'**, **'유동성에서 실사용(Utility)으로'** 비전을 구현한 인간 진위 검증 플랫폼입니다. AI 합성물과 가짜 콘텐츠가 넘쳐나는 시대에 **Pi Network의 실명 인증(KYC) 인간 네트워크**를 활용해 '진짜 인간 원본 데이터'를 판별·생산합니다.

- **Pi Testnet 실연동**: Pi Browser 로그인(`Pi.authenticate`), 1.0 Test-Pi 의뢰 결제(`Pi.createPayment`), PiNet(`verilens1759.pinet.com`) 및 도메인 인증 완료
- **B2C + B2B 양방향 의뢰**: 개인용 **단일 감별(1개)**과 기업용 **A/B 비교(2개)**, 출처별 예시 문장 채우기, 해외 유저 자동 영문(`EN`) 시작, **85종(텍스트 70 + 시각·실사 이미지 15, Gold Standard 17 포함)** 양언어 데이터셋 내장
- **이중 품질 방어 & 게이미피케이션**: 3단계 PiVerify 세션 보안 + 숨김 기준 문항(Gold Standard) + **10인 다수결 합의**, 1,000점 6단계 등급(보상 `1.0x~2.0x` · 일일 상한 `+25점`), 데일리 챌린지(`🟩`/`🟥` 공유 · `?ref=` 초대 보너스), 모바일 이미지 확대 뷰어
- **모바일 허브 UI & 운영**: 핵심 4대 메뉴 허브(`/`) + 실사 맛보기 + 어제 오답 1위, 마이페이지·TOP 5 랭킹(`/my`), 신고 2회 자동 비공개 및 관리자 전용 **`/admin`** 대시보드 제공
- **Phase 2 확장**: B2B 기업용 **OUSD(Open USD) 스테이블코인 결제** + Pioneer Pi 보상 하이브리드 정산 로드맵

---

## 3. 90초 데모 시연 영상 대본

> **촬영 팁**: 휴대폰 **Pi Browser**로 **`https://verilens1759.pinet.com`** 에 접속해 화면 녹화를 켜세요. (글로벌 심사용으로 상단 **`EN`** 버튼을 눌러 영어로 전환한 상태로 찍는 것을 추천합니다!)

| 시간 | 화면 조작 | 내레이션 (영어 자막/음성용) |
|---|---|---|
| **0:00 ~ 0:12** | **홈 (`/`)** 화면 보여주기 (`EN` 모드, `@psk7522` 로그인 상태) | "Hi, this is VeriLens—built on Pi Network's Proof of Humanity and Human-in-the-Loop AI vision to fight AI fakes and Model Collapse." |
| **0:12 ~ 0:22** | **`Start Human Session (1h)`** 클릭 → PiVerify 스캔 모달 통과 | "To block bots, verifiers pass a quick Stage-1 PiVerify check, unlocking a signed 1-hour session token." |
| **0:22 ~ 0:48** | **판별하기 (`/verify`)**: 실사 이미지·텍스트 5문항을 보며 선택(상단 `Hints` / 하단 `Report` 잠깐 비추기) → **결과 화면 (`/verify/result`)** 스크롤 | "Users verify real-world scenes and text in seconds—with AI detection hints and an in-game Report button. Hidden Gold Standard checks stop random clicking, and every set ends with an AI Tell Report." |
| **0:48 ~ 1:15** | **의뢰하기 (`/submit`)**: `Single Check (1)` / `A/B Compare (2)` 전환 후 **`Fill Sample Text`** 버튼 1번 터치 → 저작권 동의 체크 → **`Pay 1 Test-Pi & Submit`** → Pi Testnet 지갑 서명 → 결제 성공 | "In Submit, anyone can ask 'Human or AI?' or run A/B comparisons, confirm copyright rights, and pay 1 Test-Pi on Pi Testnet to publish live into the 10-human consensus pool." |
| **1:15 ~ 1:30** | **내 지갑 (`/wallet`)**: 잔액·정산 내역 확인 → **`Claim Rewards`** 클릭 → 3단계 재검증 후 청구 완료 | "Once rewards reach 0.01 Pi, users pass a final Stage-3 check to claim. Built live with Next.js, Supabase, and Pi Testnet—thank you!" |
