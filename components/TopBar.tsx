'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { NAV_LABELS } from '@/lib/i18n';
import { useApp } from './AppProvider';

/**
 * 상단 고정 내비게이션 + KO/EN 언어 전환 바
 * - Pi Browser 스타일 플럼 퍼플(#703C90) 헤더 + 화이트/골드 포인트
 */
export function TopBar() {
  const pathname = usePathname() ?? '/';
  const { lang, setLang } = useApp();
  const labels = NAV_LABELS[lang];

  const links = [
    { href: '/', label: labels.home, active: pathname === '/' },
    { href: '/verify', label: labels.verify, active: pathname.startsWith('/verify') },
    { href: '/submit', label: labels.submit, active: pathname.startsWith('/submit') },
    { href: '/wallet', label: labels.wallet, active: pathname.startsWith('/wallet') },
  ];

  return (
    <header className="sticky top-0 z-30 bg-brand text-white shadow-sm">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1.5 px-2.5 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[15px] font-black tracking-tight text-white">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-pi/90 bg-white/10 shadow-inner">
            <ShieldCheck className="h-3.5 w-3.5 text-pi" />
          </span>
          <span>VeriLens</span>
        </Link>

        <nav aria-label="상단 빠른 이동" className="flex items-center gap-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'whitespace-nowrap rounded-lg px-1.5 py-1 text-[11px] font-semibold transition',
                l.active ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          aria-label="언어 전환 (KO/EN)"
          className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-white/20"
        >
          <Globe className="h-3 w-3 text-pi" />
          {lang === 'ko' ? 'EN' : 'KO'}
        </button>
      </div>
    </header>
  );
}
