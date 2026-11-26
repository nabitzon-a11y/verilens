# VeriLens

인간 직관 기반 AI 합성·딥페이크 진위 판별 플랫폼 (Pi Next 해커톤 MVP)

> KYC 인증된 진짜 인간이 '실제 원본 vs AI 생성 가짜'를 5초 만에 판별하고,
> 숨김 기준 문항 + 5인 다수결로 검증된 '청정 인간 라벨'을 생산해 Pi 로 보상받습니다.

## 빠른 실행

```powershell
# Node.js 18.18 이상 (현재 개발 환경: v26.13.1)
npm install
Copy-Item .env.example .env.local   # 값은 비워둬도 Demo/Mock 모드로 동작
npm run dev                          # http://localhost:3000
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 운영 빌드 / 실행 (`SESSION_SECRET` 32자 이상 필수) |
| `npm run typecheck` · `npm run lint` | 타입 / 린트 검사 |

## 동작 모드

| 환경변수 | 비어 있을 때 | 설정했을 때 |
|---|---|---|
| `PI_API_KEY` | 결제 Mock Approval (`mock_*` 결제) | Pi Platform 실결제 승인/완료 |
| `PI_WALLET_PRIVATE_SEED` | Claim = Mock A2U 정산 | (A2U 연동은 MVP 이후 구현 예정) |
| `NEXT_PUBLIC_ALLOW_DEMO_MODE` | `true` → 일반 브라우저에서 데모 계정 자동 로그인 | `false` → Pi Browser 로그인만 허용 |
| `DATA_STORE` | `json` → `.data/verilens.json` | `memory` → 재시작 시 초기화 / `supabase` → 배포용 영구 저장 |
| `PI_VALIDATION_KEY` | `/validation-key.txt` 404 | Pi Developer Portal 도메인 인증 키 제공 |

PiVerify 는 현재 `MockPiVerifyAdapter` 로 동작합니다. (공식 API 공개 후 `LivePiVerifyAdapter` 로 교체)

> 배포(Vercel + Supabase)와 Pi Developer Portal 연동 절차는 **[DEPLOY.md](./DEPLOY.md)** 를 참고하세요.

## 심사위원 데모 시나리오 (약 2분)

1. **홈** — 일반 브라우저로 접속하면 Demo Pioneer 자동 로그인 (상단 Demo Sandbox Mode 배너)
2. **인간 판별 세션 시작** — PiVerify 1단계 스캔 → 1시간 세션 토큰
3. **판별하기** — 5문항 A/B 판별 (숨김 기준 문항 1개 포함). 0.3초 미만으로 연타하면 2단계 매크로 경고 → 재검증
4. **결과** — 적중률·상위 %, 보상, 문항별 'AI가 남긴 흔적' 해설, 도전장 공유
5. **의뢰하기** — 텍스트/이미지 A·B 등록 → 1 Test-Pi 결제 → 다음 세트에 즉시 노출 → 내 의뢰 현황에서 실제 응답 집계
6. **내 지갑** — 0.01 π 이상이면 Claim → PiVerify 3단계 재검증 → 정산 내역 기록

## 폴더 구조

```
verilens/
├─ app/
│  ├─ layout.tsx · globals.css     # AppProvider (자동 EN 감지) + Demo 배너 + TopBar
│  ├─ page.tsx                     # 홈 핵심 4메뉴 허브 + 실사 맛보기 + 어제 오답 1위 + 데일리 챌린지
│  ├─ my/page.tsx                  # 마이페이지 (신뢰도 1,000점 · TOP 5 랭킹 · 이용 가이드)
│  ├─ verify/page.tsx              # 5문항 판별(단일/비교 · 이미지 확대 뷰어) + 2단계 행동 감시
│  ├─ verify/result/page.tsx       # 결과 & AI 흔적 리포트 & 데일리 이모지/초대(?ref=) 공유
│  ├─ submit/page.tsx              # 의뢰자 문항 등록 + U2A 결제/체험권 + 내 의뢰 현황
│  ├─ wallet/page.tsx              # 지갑/정산 + 3단계 Claim 재검증
│  └─ api/
│     ├─ auth/{signin,demo,me,signout}
│     ├─ home/overview/            # 홈/마이 통합 데이터 (리더보드, 어제 오답 1위, 퀘스트)
│     ├─ payments/{approve,complete,cancel,incomplete}
│     ├─ verify/{session,recheck,claim}
│     ├─ missions/{set,submit,draft,ticket,community,live,mine,close,report}
│     └─ wallet/ · wallet/claim
├─ components/                     # AppProvider, TopBar, DemoBanner, ScanModal, MissionCard, TierBadge, WarningModal, LoginPanel
├─ lib/
│  ├─ constants.ts                 # 게임·신뢰도(1,000점, 일일 +25점 상한, 1.0~2.0x 배율)·보안·지갑 규칙
│  ├─ apiClient.ts · piSdk.ts · piVerifyClient.ts · image.ts · resultStore.ts · hooks.ts   # 클라이언트
│  ├─ behavior.ts · format.ts      # 클라/서버 공용
│  └─ 🔒 서버 전용: piPlatform.ts · payments.ts · piVerify.ts · auth.ts · users.ts · crypto.ts
│        http.ts · lock.ts · consensus.ts · missionSets.ts · requests.ts · wallet.ts · repository/
├─ data/missions.ts · missions.extra.ts · missions.en.ts   # 시드 미션 85문항 (Gold 17, 100% KO/EN)
├─ public/missions/                # 로컬 시각·실사 문항 (v01~v08 SVG, v09~v11 · v13~v16 JPG)
├─ supabase/schema.sql             # Supabase 테이블 + 중복 지급 방지 유니크 인덱스 + RLS
├─ app/validation-key.txt/         # Pi Developer Portal 도메인 인증 (PI_VALIDATION_KEY)
└─ types/index.ts                  # 핵심 타입 + window.Pi 타입
```

## 보안 원칙

- `PI_API_KEY` · `SESSION_SECRET` · `PI_WALLET_PRIVATE_SEED` 는 서버 전용 (`server-only` 로 클라이언트 번들 차단)
- 정답(`humanSide`)·기준문항 여부(`isGold`)·가상 응답(`priorVotes`)은 클라이언트에 전달하지 않음. 결과 화면에서도 어떤 문항이 기준 문항이었는지는 비공개
- 결제는 클라이언트 값을 신뢰하지 않고 Pi 서버에서 재조회해 사용자·금액·방향·메타데이터·txid 검증. 동일 결제/Claim 동시 요청은 키 단위 잠금으로 1회만 처리
- 보상·신뢰도·합의 판정은 모두 서버에서 재계산. 클라이언트 반응시간은 서버 경과시간과 대조
- Claim 은 2분 유효 1회성 재검증 토큰 필수
- 매크로 의심·기준 문항 실패 세트, 본인 의뢰 문항 응답은 실제 라벨 집계에서 제외

## 알려진 한계 (MVP)

- 시드 문항 85개(Gold 17개) — 운영 확장 시 공개용/비공개용 풀 분리 및 DB 시드 지속 확충 가능
- JSON/메모리 저장소와 프로세스 내 잠금은 단일 서버 기준. Supabase 저장소는 금전 관련 중복(Claim·세트 보상·결제 원장)만 DB 유니크 인덱스로 차단
- Supabase 저장소는 코드 작성만 완료, **실제 Supabase 연결 테스트는 미실시** (DEPLOY.md 2단계 후 진행)
- PiVerify·A2U 는 Mock (실제 API 연동 지점은 `lib/piVerify.ts`, `lib/wallet.ts` 의 TODO 참고)

## 향후 로드맵 (Phase 2: B2B & OUSD 하이브리드 결제)

1. **Dual-Currency 원장 추상화 (`PI` / `OUSD`)**
   - `PaymentRecord` 와 `LedgerEntry` 에 `currency: 'PI' | 'OUSD'` 를 추가하고 결제 어댑터(`PiPaymentAdapter` / `OusdPaymentAdapter`)를 분리하여, 기존 `draft → 결제 승인 → active` 플로우를 그대로 유지한 채 멀티 통화 결제를 지원합니다.
2. **B2B 기업용 OUSD(Open USD) 스테이블코인 정산**
   - 기업 고객은 Pi 변동성 부담 없이 **`1 OUSD = $1`** 기준 정가(예: 대량 검수 패키지·월 구독)로 결제하고, 파이 네트워크 내 판별자(Pioneer)에게는 **Pi 또는 OUSD**로 보상을 지급하는 하이브리드 정산 구조를 구축합니다.
   - Pi Browser 내 공식 OUSD 지원 및 PC 웹 B2B 체크아웃(OUSD 지원 멀티체인 / Stripe 연동)을 모두 수용할 수 있도록 설계합니다.
