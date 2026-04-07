import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OS Store — Open-Source App Store',
  description: 'Discover, explore, and install trusted open-source software for every platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] antialiased">
        <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20">
                  OS
                </div>
                <span className="text-xl font-bold text-gray-900">Store</span>
              </a>
              <div className="hidden sm:flex items-center gap-1">
                <a href="/search?q=tool" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
                  Discover
                </a>
                <a href="/apps" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
                  Apps
                </a>
                <a href="/apps?source=fdroid" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
                  F-Droid
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/apps" className="sm:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </a>
              <a
                href="https://github.com/jeevan6976/OSstore"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                ⭐ GitHub
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
