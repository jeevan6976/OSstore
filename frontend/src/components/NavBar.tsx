'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const NAV = [
  { href: '/apps', label: 'Explore', match: (p: string, s: URLSearchParams) => p === '/apps' && !s.get('source') },
  { href: '/apps?source=fdroid', label: 'F-Droid', match: (p: string, s: URLSearchParams) => p === '/apps' && s.get('source') === 'fdroid' },
  { href: '/search', label: 'Search', match: (p: string) => p === '/search' },
];

function NavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAI = pathname === '/ai-search';

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.ico" alt="OS Store" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-lg font-bold text-gray-900">OS Store</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-0.5">
            {NAV.map((link) => {
              const active = link.match(pathname, searchParams);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <a
              href="/ai-search"
              className={`ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isAI
                  ? 'bg-purple-100 text-purple-700 font-semibold'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              AI Search
            </a>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <a href="/search" className="sm:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </a>
          <a href="/ai-search" className="sm:hidden rounded-lg p-2 text-purple-600 hover:bg-purple-50 transition-all">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </a>
          <a href="/apps" className="sm:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </a>
          <a
            href="https://github.com/jeevan6976/OSstore"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function NavBar() {
  return (
    <Suspense fallback={<nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 h-[57px]" />}>
      <NavInner />
    </Suspense>
  );
}
