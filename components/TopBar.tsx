'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { NAV_LABELS } from '@/lib/i18n';
import { useApp } from './AppProvider';

/**
 * 상단 고정 내비게이션 + KO/EN 언어 전환 바
 * - 화이트 + 보라색(#6D28D9) 포인트, 넉넉한 폰트
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-3 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-[15px] font-black tracking-tight text-slate-900">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <span>VeriLens</span>
        </Link>

        <nav aria-label="상단 빠른 이동" className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'rounded-lg px-2 py-1 text-xs font-semibold transition',
                l.active ? 'bg-brand-soft text-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
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
          className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
        >
          <Globe className="h-3.5 w-3.5 text-brand" />
          {lang === 'ko' ? 'EN' : 'KO'}
        </button>
      </div>
    </header>
  );
}
