'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { LOCALE_OPTIONS, NAV_LABELS_6 } from '@/lib/i18n';
import { useApp } from './AppProvider';

/**
 * 상단 고정 내비게이션 + 6개 언어(KO/EN/VI/ID/ZH/ES) 선택 바
 */
export function TopBar() {
  const pathname = usePathname() ?? '/';
  const { locale, setLocale } = useApp();
  const [open, setOpen] = useState(false);
  const labels = NAV_LABELS_6[locale];
  const currentCode = LOCALE_OPTIONS.find((o) => o.id === locale)?.code ?? 'EN';

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

        <nav aria-label="Primary navigation" className="flex items-center gap-0.5">
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

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Language"
            aria-expanded={open}
            className="flex items-center gap-1 whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-white/20"
          >
            <Globe className="h-3 w-3 text-pi" />
            {currentCode}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-9 z-50 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 text-slate-800 shadow-xl">
                {LOCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setLocale(opt.id);
                      setOpen(false);
                    }}
                    className={clsx(
                      'flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold transition hover:bg-slate-50',
                      locale === opt.id ? 'bg-brand-soft/70 font-bold text-brand' : 'text-slate-700',
                    )}
                  >
                    <span>{opt.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{opt.code}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
