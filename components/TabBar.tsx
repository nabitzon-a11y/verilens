'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FilePlus2, Home, ScanFace, Wallet } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { href: '/', label: '홈', icon: Home, match: (p: string) => p === '/' },
  { href: '/verify', label: '판별하기', icon: ScanFace, match: (p: string) => p.startsWith('/verify') },
  { href: '/submit', label: '의뢰하기', icon: FilePlus2, match: (p: string) => p.startsWith('/submit') },
  { href: '/wallet', label: '내 지갑', icon: Wallet, match: (p: string) => p.startsWith('/wallet') },
];

export function TabBar() {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-navy/95 backdrop-blur pb-safe">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition',
                  active ? 'text-human' : 'text-slate-500 hover:text-slate-300',
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
