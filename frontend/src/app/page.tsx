import SearchBar from '@/components/SearchBar';
import ToolCard from '@/components/ToolCard';
import { getTrending } from '@/lib/api';

const CATEGORIES = [
  { name: 'Android Apps', icon: '📱', query: '/apps', desc: 'F-Droid & GitHub APKs' },
  { name: 'Developer Tools', icon: '🛠', query: '/search?q=developer+tools', desc: 'CLI, editors, debuggers' },
  { name: 'Privacy & Security', icon: '🔒', query: '/search?q=privacy+security', desc: 'VPNs, encryption, firewalls' },
  { name: 'Self-Hosted', icon: '🏠', query: '/search?q=self-hosted', desc: 'Run your own services' },
  { name: 'Frameworks', icon: '⚡', query: '/search?q=framework', desc: 'Web, mobile, backend' },
  { name: 'AI & ML', icon: '🤖', query: '/search?q=machine+learning+AI', desc: 'Models, tools, platforms' },
];

export default async function HomePage() {
  let trending = null;
  try {
    trending = await getTrending();
  } catch (e) {
    console.error('Failed to fetch trending:', e);
    // GitHub API might be rate limited — show page without trending
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-28 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Open-Source App Store
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Install Open-Source<br />Software You Can Trust
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Discover apps from F-Droid &amp; GitHub with trust scores. Download APKs for Android, find tools for Mac, Windows &amp; Linux.
          </p>
          <div className="mt-10 flex justify-center">
            <SearchBar placeholder="Search apps, tools, libraries..." />
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
        <div className="mx-auto max-w-5xl px-4 py-6 flex flex-wrap justify-center gap-4">
          {[
            { icon: '🤖', label: 'Android APK', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { icon: '🍎', label: 'macOS', color: 'bg-gray-50 text-gray-700 border-gray-200' },
            { icon: '🪟', label: 'Windows', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { icon: '🐧', label: 'Linux', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { icon: '🌐', label: 'Web App', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          ].map((p) => (
            <div key={p.label} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${p.color}`}>
              <span>{p.icon}</span> {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
          <a href="/apps" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.name}
              href={cat.query}
              className="card-hover group rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                {cat.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{cat.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Trending Repos */}
      {trending && trending.tools.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Repos</h2>
              <p className="mt-1 text-sm text-gray-500">Popular open-source projects right now</p>
            </div>
            <a href="/search?q=stars%3A%3E1000" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all →
            </a>
          </div>
          <div className="space-y-4">
            {trending.tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">How It Works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">�</div>
              <h3 className="font-semibold text-gray-900">Search & Discover</h3>
              <p className="mt-2 text-sm text-gray-500">Find apps from F-Droid, GitHub, and more with powerful full-text search.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">🛡️</div>
              <h3 className="font-semibold text-gray-900">Verify Trust</h3>
              <p className="mt-2 text-sm text-gray-500">Check trust scores based on activity, community, and maintenance health.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-2xl">⬇️</div>
              <h3 className="font-semibold text-gray-900">Install</h3>
              <p className="mt-2 text-sm text-gray-500">Download APKs directly, or get install instructions for Mac, Windows &amp; Linux.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
