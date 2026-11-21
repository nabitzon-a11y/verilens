-- =====================================================================
-- VeriLens Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 하세요. (여러 번 실행해도 안전)
-- =====================================================================

-- 문서 저장 테이블 (users / missions / sets / ledger / payments)
create table if not exists public.vl_documents (
  collection  text        not null,
  id          text        not null,
  uid         text,
  data        jsonb       not null,
  created_at  timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists vl_documents_collection_uid_idx
  on public.vl_documents (collection, uid);

-- 의뢰자 문항 실제 응답 (append-only)
create table if not exists public.vl_votes (
  id          bigserial   primary key,
  mission_id  text        not null,
  choice      text        not null check (choice in ('A', 'B')),
  created_at  timestamptz not null default now()
);

create index if not exists vl_votes_mission_idx on public.vl_votes (mission_id, id);

-- ---------------------------------------------------------------------
-- 금전 관련 중복 방지 (여러 서버 인스턴스가 동시에 처리해도 DB가 1회만 허용)
-- ---------------------------------------------------------------------
-- 같은 Claim 재검증 토큰으로 두 번 출금 불가
create unique index if not exists vl_ledger_claim_ref_uniq
  on public.vl_documents ((data->>'ref'))
  where collection = 'ledger' and data->>'ref' is not null;

-- 같은 판별 세트에 보상 두 번 지급 불가
create unique index if not exists vl_ledger_reward_set_uniq
  on public.vl_documents ((data->>'setId'))
  where collection = 'ledger' and data->>'type' = 'reward';

-- 같은 결제를 원장에 두 번 기록 불가
create unique index if not exists vl_ledger_payment_uniq
  on public.vl_documents ((data->>'paymentId'))
  where collection = 'ledger' and data->>'type' = 'submission_payment';

-- ---------------------------------------------------------------------
-- 보안: RLS 활성화 + 정책 없음 → anon/authenticated 키로는 접근 불가
-- 서버는 service_role 키로만 접근합니다 (RLS 우회)
-- ---------------------------------------------------------------------
alter table public.vl_documents enable row level security;
alter table public.vl_votes enable row level security;
