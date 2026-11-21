import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/components/AppProvider';
import { DemoBanner } from '@/components/DemoBanner';
import { TabBar } from '@/components/TabBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'VeriLens — 인간 직관 기반 AI 진위 판별',
  description: '검증된 인간의 직관으로 AI 합성물과 딥페이크를 가려내고 Pi 로 보상받는 크라우드 판별 플랫폼',
  applicationName: 'VeriLens',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B1120',
};

/**
 * Pi SDK(pi-sdk.js)는 lib/piSdk.ts 의 loadPiSdk() 가 Pi 환경에서만 동적으로 로드합니다.
 * (일반 웹 데모 시 불필요한 외부 스크립트 로드를 피하기 위함)
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <AppProvider>
          <DemoBanner />
          <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
          <TabBar />
        </AppProvider>
      </body>
    </html>
  );
}
