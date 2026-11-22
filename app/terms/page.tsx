'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { useApp } from '@/components/AppProvider';

export default function TermsPage() {
  const { lang } = useApp();
  const en = lang === 'en';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-1">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          {en ? 'Back' : '돌아가기'}
        </Link>
        <Link href="/privacy" className="text-xs font-semibold text-brand hover:underline">
          {en ? 'Privacy Policy →' : '개인정보처리방침 →'}
        </Link>
      </div>

      <article className="card space-y-4 text-sm leading-relaxed text-slate-700">
        <header className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <FileText className="h-5 w-5 text-brand" />
          <div>
            <h1 className="text-lg font-black text-slate-900">{en ? 'Terms of Service' : 'VeriLens 이용약관'}</h1>
            <p className="text-xs text-slate-500">VeriLens · Last updated: 2026-11-22</p>
          </div>
        </header>

        {en ? (
          <>
            <Section title="1. Service Overview">
              VeriLens is a human-intuition verification platform on Pi Network where KYC-verified Pioneers distinguish authentic human-created content from AI-generated or synthetic content.
            </Section>
            <Section title="2. Testnet & Demo Mode">
              During the Pi Next Hackathon phase, payments run on Pi Testnet (Test-Pi) and/or Demo Sandbox Mode. Test-Pi and mock rewards have no real-world monetary value.
            </Section>
            <Section title="3. Requester Content & Copyright Responsibility">
              Requesters who submit text or images for verification warrant that they hold all necessary copyrights, licenses, and portrait rights. Submitting full copyrighted articles, unlawful material, or infringing images is prohibited, and all legal responsibility rests solely with the submitting requester. VeriLens may remove reported content immediately.
            </Section>
            <Section title="4. Fair Participation & Anti-Bot Rules">
              Automated macros, multiple accounts, or random clicking are prohibited. Failing hidden Gold Standard checks or triggering Stage-2 behavior flags withholds set rewards and lowers Trust Score.
            </Section>
          </>
        ) : (
          <>
            <Section title="1. 서비스 개요">
              VeriLens는 Pi Network 기반의 인간 직관 검증 플랫폼으로, 인증된 파이오니어가 실제 인간 원본과 AI 합성·생성물을 판별하고 합의 기반 보상을 받는 서비스입니다.
            </Section>
            <Section title="2. 테스트넷 및 데모 모드 안내">
              Pi Next 해커톤 기간 중 결제는 Pi Testnet(Test-Pi) 또는 Demo Sandbox Mode(Mock)로 동작하며, 테스트넷 자산 및 모의 정산 내역은 실제 금전적 가치를 갖지 않습니다.
            </Section>
            <Section title="3. 의뢰 콘텐츠 저작권 및 법적 책임">
              판별 의뢰자(`/submit`)는 본인이 등록하는 텍스트·이미지에 대한 저작권, 사용권 및 초상권 등 적법한 권리를 보유하고 있음을 보증해야 합니다. 뉴스 기사 전문 복제, 무단 도용, 불법·유해물 등록을 금지하며, 권리 침해로 발생하는 모든 법적 책임은 의뢰자 본인에게 있습니다. 신고된 문항은 즉시 비공개 처리될 수 있습니다.
            </Section>
            <Section title="4. 공정 참여 및 어뷰징 제한">
              매크로·자동화 봇 사용 및 무작위 클릭은 금지됩니다. 숨김 기준 문항(Gold Standard) 오답 또는 2단계 행동 감시 적발 시 해당 세트 보상은 지급되지 않으며 신뢰도(Trust Score)가 하락할 수 있습니다.
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
      <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
      <p className="text-[13px] leading-relaxed text-slate-600">{children}</p>
    </section>
  );
}
