'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { NAV_LABELS } from '@/lib/i18n';
import { useApp } from './AppProvider';

/**
 * 상단 고정 내비게이션 + KO/EN 언어 전환 바
 * - Android Pi Browser 등에서 하단 시스템 바가 TabBar 를 가리더라도 모든 탭으로 즉시 이동 가능
 * - 글로벌 심사위원을 위한 한국어/영어 원터치 전환 제공
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
    <header className="sticky top-0 z-30 border-b border-white/5 bg-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-3 py-2">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-sm font-black tracking-tight text-white">
          <ShieldCheck className="h-4 w-4 text-human" />
          <span>VeriLens</span>
        </Link>

        <nav aria-label="상단 빠른 이동" className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'rounded-lg px-2 py-1 text-[11px] font-semibold transition',
                l.active ? 'bg-human/15 text-human' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div
          role="group"
          aria-label="언어 전환 (KO/EN)"
          className="flex shrink-0 items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-[10px] font-bold"
        >
          <Globe className="mx-1 h-3 w-3 text-slate-400" />
          {(['ko', 'en'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={clsx(
                'rounded-full px-1.5 py-0.5 uppercase transition',
                lang === code ? 'bg-human text-navy' : 'text-slate-400 hover:text-white',
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
