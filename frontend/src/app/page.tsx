import AISearchBar from '@/components/AISearchBar';
import ToolCard from '@/components/ToolCard';
import { getTrending } from '@/lib/api';

const CATEGORIES = [
  { name: 'Android Apps', icon: '📱', query: '/apps?source=fdroid', desc: 'F-Droid & GitHub APKs' },
  { name: 'Developer Tools', icon: '🛠️', query: '/search?q=developer+tools', desc: 'CLI, editors, debuggers' },
  { name: 'Privacy & Security', icon: '🔒', query: '/search?q=privacy+security', desc: 'VPNs, encryption, firewalls' },
  { name: 'Self-Hosted', icon: '🏠', query: '/search?q=self-hosted', desc: 'Run your own services' },
  { name: 'APIs & Libraries', icon: '📦', query: '/search?q=api+library', desc: 'SDKs, clients, frameworks' },
  { name: 'AI & ML', icon: '🤖', query: '/search?q=machine+learning+AI', desc: 'Models, tools, platforms' },
];

const AI_EXAMPLES = [
  'lightweight Python web framework',
  'self-hosted password manager',
  'fast key-value cache database',
  'private messaging Android app',
];

export default async function HomePage() {
  let trending = null;
  try {
    trending = await getTrending();
  } catch {
    // GitHub API rate limited — show page without trending
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-40" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-28 text-center">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white">
            <img src="/logo.ico" alt="OSstore" className="h-10 w-10 rounded-xl object-contain" />
            Open-Source App Store
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Open-Source Apps, Tools<br />&amp; APIs — All in One Place
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Discover and install open-source software from F-Droid &amp; GitHub — with trust scores, security scanning, and AI-powered search.
          </p>
          <div className="mt-10 flex justify-center">
            <AISearchBar placeholder="Search apps, tools, libraries..." />
          </div>

          {/* Quick stats */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">1000+</span> F-Droid Apps
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">5000+</span> GitHub Projects
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">100%</span> Open Source
            </div>
          </div>
        </div>
      </section>

      {/* Platform badges */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 flex flex-wrap justify-center gap-3">
          {[
            { icon: '🤖', label: 'Android APK', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { icon: '🍎', label: 'macOS', color: 'bg-gray-50 text-gray-700 border-gray-200' },
            { icon: '🪟', label: 'Windows', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { icon: '🐧', label: 'Linux', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { icon: '🌐', label: 'Web App', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          ].map((p) => (
            <span key={p.label} className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${p.color}`}>
              {p.icon} {p.label}
            </span>
          ))}
        </div>
      </section>

      {/* AI Search CTA */}
      <section className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">Not sure what to search for?</p>
              <p className="text-sm text-gray-500">Describe what you need — AI finds the best tools for you</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {AI_EXAMPLES.map((ex) => (
              <a
                key={ex}
                href={`/ai-search?q=${encodeURIComponent(ex)}`}
                className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors whitespace-nowrap"
              >
                {ex}
              </a>
            ))}
            <a
              href="/ai-search"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all whitespace-nowrap"
            >
              Try AI Search →
            </a>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
          <a href="/apps" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
            View all →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.name}
              href={cat.query}
              className="card-hover group rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/50"
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors text-sm sm:text-base">
                {cat.name}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">{cat.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Trending */}
      {trending && trending.tools.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/60">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Repos</h2>
                <p className="mt-1 text-sm text-gray-500">Popular open-source projects right now</p>
              </div>
              <a href="/search?q=stars%3A%3E1000" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                View all →
              </a>
            </div>
            <div className="space-y-3">
              {trending.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">How It Works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                🔍
              </div>
              <h3 className="font-semibold text-gray-900">Search &amp; Discover</h3>
              <p className="mt-2 text-sm text-gray-500">Find apps from F-Droid, GitHub, and more — or let AI pick the best tool for your need.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                🛡️
              </div>
              <h3 className="font-semibold text-gray-900">Verify Trust &amp; Security</h3>
              <p className="mt-2 text-sm text-gray-500">Check trust scores, OpenSSF security ratings, and known CVEs before installing.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-2xl">
                ⬇️
              </div>
              <h3 className="font-semibold text-gray-900">Install</h3>
              <p className="mt-2 text-sm text-gray-500">Download APKs directly, or get install instructions for Mac, Windows &amp; Linux.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
