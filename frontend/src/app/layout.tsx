import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OS Store — Open-Source Discovery & App Store',
  description: 'Discover trusted open-source tools, libraries, APIs, and apps with trust scores, risk indicators, and APK downloads.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] antialiased">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
                  OS
                </div>
                <span className="text-xl font-bold text-gray-900">OS Store</span>
              </a>
              <div className="hidden sm:flex items-center gap-4">
                <a href="/search?q=tool" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                  🔍 Search
                </a>
                <a href="/apps" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                  📱 Apps
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/apps"
                className="sm:hidden text-sm font-medium text-gray-600 hover:text-brand-600"
              >
                📱
              </a>
              <a
                href="https://github.com/jeevan6976/OSstore"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
