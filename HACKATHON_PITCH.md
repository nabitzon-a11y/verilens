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
> A human-intuition verification platform powered by Pi Network, enabling KYC-verified Pioneers to spot AI-generated fakes, prevent Model Collapse, and earn Pi via 5-human consensus.

### Project Description (Full)

#### The Problem: AI Model Collapse & Bot Pollution
As AI-generated text, deepfakes, and synthetic images flood the internet, AI models increasingly retrain on synthetic outputs—causing **Model Collapse**. Traditional crowdsourcing platforms struggle with automated bots and click-farms that poison human-labeled datasets.

#### The Solution: VeriLens
**VeriLens** leverages Pi Network's verified human community to create a bot-resistant **Human Reality Filter**. In fast, 5-second A/B comparisons, verified Pioneers distinguish authentic human-created content from AI fakes and earn Pi rewards when their intuition aligns with a 5-human consensus.

#### Key Features & Pi Infrastructure Integration
1. **Pi Sign-In & Live Testnet Payments (`Pi SDK v2.0`)**:
   - Seamless authentication inside Pi Browser (`Pi.authenticate`) with automatic incomplete-payment recovery (`onIncompletePaymentFound`).
   - **B2B / Requester Portal (`/submit`)**: Requesters submit text or compressed, EXIF-stripped image pairs, confirm copyright warranty, and pay **1 Test-Pi** on Pi Testnet (`Pi.createPayment`) to publish directly into the live verification pool.
   - **Demo Sandbox Mode**: Automatically enabled in regular web browsers so judges without Pi Browser can test the full end-to-end flow immediately.
2. **3-Stage Session-Based Human Proof (`PiVerifyAdapter` Architecture)**:
   - **Stage 1 (Session Entry)**: Quick human liveness/uniqueness check issuing a signed 1-hour session token.
   - **Stage 2 (Passive Behavior Monitor)**: Tracks per-item reaction latency (ms) on both client and server; consecutive ultra-fast clicks (<300ms) trigger a mandatory re-check modal.
   - **Stage 3 (Claim Re-verify)**: One-time 2-minute re-verification token required before claiming rewards.
   - *(Note: Built with a clean `PiVerifyAdapter` interface; currently running `MockPiVerifyAdapter` for hackathon demo until official PiVerify API endpoints are released, while token signing & server timing integrity checks are live.)*
3. **Dual Quality Assurance (Hidden Gold Standard + 5-Human Consensus)**:
   - Every 5-item set hides 1 ground-truth **Gold Standard** anchor item. Failing the anchor withholds set rewards and lowers the user's Trust Score, stopping random clicking.
   - Remaining items use 5-human majority consensus, followed by an engaging **AI Tell Report** explaining the subtle AI artifacts—driving high retention alongside **PiNet challenge link sharing**.
4. **Content Risk & Copyright Safeguards**:
   - Mandatory copyright & excerpt warranty on submission, automatic client-side image resizing & EXIF metadata removal, and an in-game **Report** button that automatically hides user-submitted items after 2 reports.

#### Tech Stack
- **Frontend / API**: Next.js 14 (App Router), TypeScript, Tailwind CSS (Mobile-first Dark Navy UI, KO/EN bilingual toggle)
- **Database**: Supabase (PostgreSQL with RLS & unique ledger indexes preventing double-rewards / double-claims) via Repository Pattern
- **Pi Integration**: Pi SDK 2.0, Pi Platform REST API (server-side `/approve`, `/complete`, `/incomplete`), PiNet (`verilens1759.pinet.com`)

---

## 2. 국문 요약 소개문

**VeriLens**는 AI 합성물과 가짜 콘텐츠가 넘쳐나는 시대에 **Pi Network의 실명 인증(KYC) 인간 네트워크**를 활용해 '진짜 인간 원본 데이터'를 판별·생산하는 크라우드 검증 플랫폼입니다.

- **Pi Testnet 실연동**: Pi Browser 로그인(`Pi.authenticate`), 1.0 Test-Pi 의뢰 결제(`Pi.createPayment`), PiNet(`verilens1759.pinet.com`) 및 도메인 인증 완료
- **이중 품질 방어**: 3단계 PiVerify 세션 보안(모의 어댑터 + 실서명 토큰·행동 감시) + 숨김 기준 문항(Gold Standard) + 5인 다수결 합의
- **콘텐츠 안전장치**: 의뢰 시 저작권 보증 동의, 이미지 자동 압축·EXIF 제거, 판별 중 신고 2회 누적 시 즉시 비공개

---

## 3. 90초 데모 시연 영상 대본

> **촬영 팁**: 휴대폰 **Pi Browser**로 `https://verilens-chi.vercel.app` (또는 PC 크롬에서 `https://verilens1759.pinet.com`)에 접속해 화면 녹화를 켜세요. (글로벌 심사용으로 상단 **`EN`** 버튼을 눌러 영어로 전환한 상태로 찍는 것을 추천합니다!)

| 시간 | 화면 조작 | 내레이션 (영어 자막/음성용) |
|---|---|---|
| **0:00 ~ 0:12** | **홈 (`/`)** 화면 보여주기 (`EN` 모드) | "Hi, this is VeriLens—a human-intuition verification platform on Pi Network built to fight AI fakes and Model Collapse." |
| **0:12 ~ 0:25** | **`Start Human Session (1h)`** 클릭 → PiVerify 스캔 모달 통과 | "To block bots, verifiers pass a quick Stage-1 PiVerify check, unlocking a signed 1-hour session token." |
| **0:25 ~ 0:50** | **판별하기 (`/verify`)**: 실사 이미지(카페/과일) 포함 5문항을 1.5~2초씩 보며 선택 → **결과 화면 (`/verify/result`)** 스크롤 | "Users compare A vs B in seconds—including real-world style scenes and text. Hidden Gold Standard checks stop random clicking, and every set ends with an AI Tell Report showing why AI failed." |
| **0:50 ~ 1:15** | **의뢰하기 (`/submit`)**: 텍스트 입력 + 저작권 동의 체크 → **`Pay 1 Test-Pi & Submit`** → Pi Testnet 지갑 서명 → 결제 성공 | "Requesters can submit their own text or EXIF-stripped images, confirm copyright rights, and pay 1 Test-Pi on Pi Testnet to publish directly into the live pool." |
| **1:15 ~ 1:30** | **내 지갑 (`/wallet`)**: 잔액·정산 내역 확인 → **`Claim Rewards`** 클릭 → 3단계 재검증 후 청구 완료 | "Once rewards reach 0.01 Pi, users pass a final Stage-3 check to claim. Built live with Next.js, Supabase, and Pi Testnet—thank you!" |
