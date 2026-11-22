'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useApp } from '@/components/AppProvider';

export default function PrivacyPage() {
  const { lang } = useApp();
  const en = lang === 'en';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-1">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {en ? 'Back' : '돌아가기'}
        </Link>
        <Link href="/terms" className="text-xs font-semibold text-human hover:underline">
          {en ? 'Terms of Service →' : '이용약관 →'}
        </Link>
      </div>

      <article className="card space-y-4 text-sm leading-relaxed text-slate-300">
        <header className="flex items-center gap-2.5 border-b border-white/5 pb-3">
          <ShieldCheck className="h-5 w-5 text-human" />
          <div>
            <h1 className="text-lg font-black text-white">{en ? 'Privacy Policy' : '개인정보처리방침'}</h1>
            <p className="text-[11px] text-slate-500">VeriLens · Last updated: 2026-11-22</p>
          </div>
        </header>

        {en ? (
          <>
            <Section title="1. Information We Collect">
              Through Pi Sign-In (`username`, `payments` scopes), VeriLens receives only your Pi `uid` and `username`. We also store verification votes, reaction timings (ms) for anti-bot protection, reward ledger entries, and user-submitted missions.
            </Section>
            <Section title="2. Biometric & Image Privacy">
              VeriLens does NOT capture, receive, or store facial or biometric images. PiVerify checks only issue a signed temporary session token. Images uploaded by requesters are resized and re-encoded on-device to strip EXIF metadata (such as GPS location) before upload.
            </Section>
            <Section title="3. Purpose & Retention">
              Collected data is used solely to operate consensus verification, prevent bot abuse, and record Test-Pi / reward transactions. Data is stored securely on Supabase with server-only access controls (RLS enabled).
            </Section>
            <Section title="4. Contact & Removal Requests">
              For data deletion or copyright takedown requests, please contact the developer via the VeriLens app listing on Pi Developer Portal.
            </Section>
          </>
        ) : (
          <>
            <Section title="1. 수집하는 정보">
              Pi 로그인(`username`, `payments` 권한)을 통해 Pi 고유 식별자(`uid`)와 사용자 이름(`username`)만 전달받습니다. 서비스 운영을 위해 판별 응답, 봇 방지용 반응 시간(ms), 정산 원장 내역 및 의뢰자가 등록한 문항 데이터가 저장됩니다.
            </Section>
            <Section title="2. 생체정보 및 이미지 메타데이터 비수집">
              VeriLens는 사용자의 얼굴·생체 이미지를 직접 촬영하거나 저장하지 않으며, 검증 결과에 따른 서명된 세션 토큰만 사용합니다. 의뢰자가 올리는 이미지는 전송 전 기기 내에서 리사이즈·재인코딩되어 위치정보(EXIF) 등 메타데이터가 자동 제거됩니다.
            </Section>
            <Section title="3. 이용 목적 및 보관">
              수집된 정보는 5인 다수결 판별, 매크로·봇 차단, 결제 및 보상 내역 관리 목적으로만 사용되며, 서버 전용 접근 제어(RLS)가 적용된 데이터베이스에 보관됩니다.
            </Section>
            <Section title="4. 삭제 및 권리 침해 신고">
              개인정보 삭제 또는 저작권 침해 게시물 중단 요청은 Pi Developer Portal의 VeriLens 앱 정보 채널을 통해 접수할 수 있습니다.
            </Section>
          </>
        )}
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <p className="text-xs leading-relaxed text-slate-400">{children}</p>
    </section>
  );
}
