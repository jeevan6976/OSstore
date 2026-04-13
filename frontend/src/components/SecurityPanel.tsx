import type { SecurityScan, Vulnerability } from '@/lib/api';

// ── Helpers ─────────────────────────────────────────────────

function statusConfig(status: SecurityScan['status']) {
  switch (status) {
    case 'clean':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        label: 'No threats detected',
        icon: (
          <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5Zm0 15a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V17.25A.75.75 0 0 1 12 16.5ZM12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm0 1.5a8.25 8.25 0 1 1 0 16.5 8.25 8.25 0 0 1 0-16.5Zm3.97 5.03a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 1 1 1.06-1.06l1.72 1.72 3.97-3.97a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        ),
      };
    case 'warnings':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        label: 'Some concerns found',
        icon: (
          <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
          </svg>
        ),
      };
    case 'danger':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        label: 'Security issues found',
        icon: (
          <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.5a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 12 1.5ZM5.636 4.136a.75.75 0 0 1 1.06 0l1.592 1.591a.75.75 0 0 1-1.061 1.06L5.636 5.197a.75.75 0 0 1 0-1.06Zm12.728 0a.75.75 0 0 1 0 1.06l-1.591 1.592a.75.75 0 0 1-1.061-1.061l1.591-1.591a.75.75 0 0 1 1.061 0Zm-6.816 4.496a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.678ZM3 10.5a.75.75 0 0 1 .75-.75H6a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10.5Zm14.25 0a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H18a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
        ),
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-500',
        label: 'Not yet scanned',
        icon: (
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5A.75.75 0 0 0 12 9Z" clipRule="evenodd" />
          </svg>
        ),
      };
  }
}

function checkDot(score: number) {
  if (score === -1) return <span className="h-2 w-2 rounded-full bg-gray-200 flex-shrink-0" title="N/A" />;
  if (score >= 7) return <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" title={`Score: ${score}/10`} />;
  if (score >= 4) return <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" title={`Score: ${score}/10`} />;
  return <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" title={`Score: ${score}/10`} />;
}

function severityBadge(sev: Vulnerability['severity']) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border border-red-200',
    high: 'bg-orange-100 text-orange-800 border border-orange-200',
    medium: 'bg-amber-100 text-amber-800 border border-amber-200',
    low: 'bg-blue-100 text-blue-700 border border-blue-200',
    unknown: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return map[sev] || map.unknown;
}

function scorecardColor(score: number | null) {
  if (score === null) return 'text-gray-400';
  if (score >= 7) return 'text-emerald-600';
  if (score >= 4) return 'text-amber-600';
  return 'text-red-600';
}

// ── Component ────────────────────────────────────────────────

export default function SecurityPanel({ scan }: { scan: SecurityScan }) {
  const cfg = statusConfig(scan.status);
  const hasChecks = scan.scorecard_checks.length > 0;
  const hasVulns = scan.vulnerabilities.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M12 1.5a.75.75 0 0 1 .55.24l4.95 5.25A.75.75 0 0 1 18 7.5v7.5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7.5a.75.75 0 0 1 .2-.51L11.45 1.74A.75.75 0 0 1 12 1.5ZM9.75 7.5h4.5v-2.2L12 3.06 9.75 5.3V7.5Z" clipRule="evenodd" />
        </svg>
        <h3 className="text-sm font-bold text-gray-700">Security Scan</h3>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${cfg.bg} ${cfg.border}`}>
        {cfg.icon}
        <div>
          <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</p>
          {scan.scorecard_score !== null && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              OpenSSF Score:{' '}
              <span className={`font-bold ${scorecardColor(scan.scorecard_score)}`}>
                {scan.scorecard_score.toFixed(1)}/10
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Scorecard checks */}
      {hasChecks && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Supply Chain Checks
          </p>
          <div className="space-y-1.5">
            {scan.scorecard_checks.map((check) => (
              <div key={check.name} className="flex items-center gap-2" title={check.reason}>
                {checkDot(check.score)}
                <span className="text-xs text-gray-600 flex-1 truncate">{check.name.replace(/-/g, ' ')}</span>
                <span className={`text-[11px] font-mono font-medium tabular-nums ${
                  check.score === -1 ? 'text-gray-300' :
                  check.score >= 7 ? 'text-emerald-600' :
                  check.score >= 4 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {check.score === -1 ? 'N/A' : `${check.score}/10`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Known vulnerabilities */}
      {hasVulns ? (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Known Advisories ({scan.vulnerabilities.length})
          </p>
          <div className="space-y-2">
            {scan.vulnerabilities.map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${severityBadge(v.severity)}`}>
                    {v.severity}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">{v.id}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{v.summary}</p>
              </a>
            ))}
          </div>
        </div>
      ) : scan.status !== 'unknown' ? (
        <p className="text-xs text-gray-400">No known advisories found.</p>
      ) : null}

      {/* Footer */}
      <p className="text-[10px] text-gray-300 border-t border-gray-100 pt-3">
        Powered by OpenSSF Scorecard + GitHub Advisory DB
      </p>
    </div>
  );
}
