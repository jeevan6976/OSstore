export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2.5 mb-3">
              <img src="/logo.ico" alt="OS Store" className="h-8 w-8 rounded-xl object-contain" />
              <span className="font-bold text-gray-900">OS Store</span>
            </a>
            <p className="text-sm text-gray-500 leading-relaxed">
              Discover and install open-source apps, tools, APIs and libraries — with trust scores, security scanning, and AI-powered search.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/apps" className="text-gray-600 hover:text-brand-600 transition-colors">All Projects</a></li>
              <li><a href="/apps?source=fdroid" className="text-gray-600 hover:text-brand-600 transition-colors">F-Droid Apps</a></li>
              <li><a href="/search?q=developer+tools" className="text-gray-600 hover:text-brand-600 transition-colors">Developer Tools</a></li>
              <li><a href="/search?q=self-hosted" className="text-gray-600 hover:text-brand-600 transition-colors">Self-Hosted</a></li>
            </ul>
          </div>

          {/* Search */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Search</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/ai-search" className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-medium transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  AI Search
                </a>
              </li>
              <li><a href="/search" className="text-gray-600 hover:text-brand-600 transition-colors">Keyword Search</a></li>
              <li><a href="/search?q=privacy+security" className="text-gray-600 hover:text-brand-600 transition-colors">Privacy & Security</a></li>
              <li><a href="/search?q=api+library" className="text-gray-600 hover:text-brand-600 transition-colors">APIs & Libraries</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} OS Store. Open source, built with Next.js.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Powered by GitHub API &amp; F-Droid</span>
            <a
              href="https://github.com/jeevan6976/OSstore"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              View source →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
