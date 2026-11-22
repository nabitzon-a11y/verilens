'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FilePlus2, Home, ScanFace, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { NAV_LABELS } from '@/lib/i18n';
import { useApp } from './AppProvider';

export function TabBar() {
  const pathname = usePathname() ?? '/';
  const { lang } = useApp();
  const labels = NAV_LABELS[lang];
  const [extraBottomPad, setExtraBottomPad] = useState(false);

  // Android Pi Browser(URL 모드)에서 하단 시스템 내비게이션 바가 TabBar 를 덮는 현상 방지
  useEffect(() => {
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent) && /PiBrowser/i.test(navigator.userAgent)) {
      setExtraBottomPad(true);
    }
  }, []);

  const tabs = [
    { href: '/', label: labels.home, icon: Home, match: (p: string) => p === '/' },
    { href: '/verify', label: labels.verify, icon: ScanFace, match: (p: string) => p.startsWith('/verify') },
    { href: '/submit', label: labels.submit, icon: FilePlus2, match: (p: string) => p.startsWith('/submit') },
    { href: '/wallet', label: labels.wallet, icon: Wallet, match: (p: string) => p.startsWith('/wallet') },
  ];

  return (
    <nav
      className={clsx(
        'fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-safe',
        extraBottomPad && 'pb-12',
      )}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-col items-center gap-1 py-2.5 text-xs font-semibold transition',
                  active ? 'text-brand' : 'text-slate-400 hover:text-slate-700',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
