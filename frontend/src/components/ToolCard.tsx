import type { Tool } from '@/lib/api';

function trustColor(score: number): string {
  if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function trustLabel(score: number): string {
  if (score >= 75) return 'Trusted';
  if (score >= 50) return 'Moderate';
  return 'Low';
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function parseTopics(topics: string | null): string[] {
  if (!topics) return [];
  try { return JSON.parse(topics); } catch { return []; }
}

/** Detect platform availability from topics, language, description */
function detectPlatforms(tool: Tool) {
  const text = `${tool.topics || ''} ${tool.description || ''} ${tool.language || ''}`.toLowerCase();
  const platforms: { label: string; icon: string; url: string | null; color: string }[] = [];

  // APK download — direct download available
  if (tool.apk_url || tool.download_url) {
    platforms.push({
      label: 'APK',
      icon: '🤖',
      url: tool.apk_url || tool.download_url,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    });
  }

  // Detect platform hints from metadata
  const hasAndroid = text.includes('android') || text.includes('apk') || tool.app_type === 'app';
  const hasMac = text.includes('macos') || text.includes('mac os') || text.includes('darwin') || text.includes('homebrew');
  const hasWindows = text.includes('windows') || text.includes('win32') || text.includes('exe') || text.includes('.msi');
  const hasLinux = text.includes('linux') || text.includes('flatpak') || text.includes('snap') || text.includes('appimage') || text.includes('deb') || text.includes('apt');
  const hasWeb = text.includes('web app') || text.includes('webapp') || text.includes('pwa') || (tool.homepage && tool.homepage !== tool.url);

  // GitHub releases link (for non-APK platforms)
  const releasesUrl = tool.source === 'github' ? `${tool.url}/releases` : null;
  const fdroidUrl = tool.source === 'fdroid' ? `https://f-droid.org/packages/${tool.package_name || ''}` : null;

  if (hasMac && !platforms.find(p => p.label === 'macOS')) {
    platforms.push({ label: 'macOS', icon: '🍎', url: releasesUrl, color: 'bg-gray-900 hover:bg-gray-800 text-white' });
  }
  if (hasWindows && !platforms.find(p => p.label === 'Windows')) {
    platforms.push({ label: 'Windows', icon: '🪟', url: releasesUrl, color: 'bg-blue-600 hover:bg-blue-700 text-white' });
  }
  if (hasLinux && !platforms.find(p => p.label === 'Linux')) {
    platforms.push({ label: 'Linux', icon: '🐧', url: releasesUrl, color: 'bg-amber-600 hover:bg-amber-700 text-white' });
  }
  if (hasAndroid && !platforms.find(p => p.label === 'APK')) {
    platforms.push({ label: 'Android', icon: '🤖', url: fdroidUrl || releasesUrl, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' });
  }
  if (hasWeb) {
    platforms.push({ label: 'Web', icon: '🌐', url: tool.homepage || tool.url, color: 'bg-purple-600 hover:bg-purple-700 text-white' });
  }

  // If still no platforms, add a generic "Source" link
  if (platforms.length === 0) {
    platforms.push({ label: 'Source', icon: '📦', url: tool.url, color: 'bg-gray-700 hover:bg-gray-800 text-white' });
  }

  return platforms;
}

export default function ToolCard({ tool }: { tool: Tool }) {
  const score = tool.trust_score?.overall ?? 0;
  const topics = parseTopics(tool.topics).slice(0, 4);
  const platforms = detectPlatforms(tool);
  const isApp = tool.app_type === 'app';

  return (
    <div className="card-hover group rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      {/* Top row: icon + info + trust badge */}
      <div className="flex items-start gap-4">
        <a href={`/tool/${tool.id}`} className="flex-shrink-0">
          <div className="relative h-14 w-14 rounded-2xl bg-gray-100 overflow-hidden shadow-sm">
            {(tool.icon_url || tool.owner_avatar) ? (
              <img
                src={tool.icon_url || tool.owner_avatar || ''}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-400">
                {tool.name.charAt(0).toUpperCase()}
              </div>
            )}
            {isApp && (
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-purple-500 p-0.5">
                <span className="text-[8px]">📱</span>
              </div>
            )}
          </div>
        </a>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <a href={`/tool/${tool.id}`} className="min-w-0">
              <h3 className="truncate text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                {tool.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="truncate text-sm text-gray-500">{tool.full_name}</span>
                {tool.source === 'fdroid' && (
                  <span className="flex-shrink-0 rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                    F-Droid
                  </span>
                )}
              </div>
            </a>
            <div className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-center ${trustColor(score)}`}>
              <div className="text-lg font-bold leading-none">{score.toFixed(0)}</div>
              <div className="text-[10px] font-medium mt-0.5">{trustLabel(score)}</div>
            </div>
          </div>

          {tool.description && (
            <a href={`/tool/${tool.id}`}>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600 leading-relaxed">{tool.description}</p>
            </a>
          )}
        </div>
      </div>

      {/* Install buttons row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {platforms.map((p) => (
          <a
            key={p.label}
            href={p.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`install-btn ${p.color} rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm`}
          >
            <span>{p.icon}</span>
            {p.label === 'APK' ? (
              <>⬇ Install APK{tool.latest_version ? ` v${tool.latest_version}` : ''}</>
            ) : p.label === 'Source' ? (
              <>View Source</>
            ) : (
              <>Get for {p.label}</>
            )}
          </a>
        ))}
      </div>

      {/* Meta row: language, stars, topics */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        {tool.language && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            {tool.language}
          </span>
        )}
        {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()}</span>}
        {tool.forks > 0 && <span>🍴 {tool.forks.toLocaleString()}</span>}
        {tool.latest_version && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600">
            v{tool.latest_version}
          </span>
        )}
        <span className="ml-auto text-gray-400">Updated {timeAgo(tool.last_pushed_at)}</span>
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span key={t} className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Risk flags */}
      {tool.risk_flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.risk_flags.map((flag, i) => (
            <span
              key={i}
              className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${
                flag.severity === 'high'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              ⚠ {flag.flag_type.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
