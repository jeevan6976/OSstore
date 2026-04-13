/**
 * Security scanning — OpenSSF Scorecard + GitHub Advisory Database.
 * Both are free public APIs, no extra key needed beyond GITHUB_TOKEN.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

export interface Vulnerability {
  id: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  url: string;
  published: string | null;
}

export interface ScorecardCheck {
  name: string;
  score: number; // 0–10, -1 = not applicable
  reason: string;
}

export interface SecurityScan {
  status: 'clean' | 'warnings' | 'danger' | 'unknown';
  scorecard_score: number | null; // 0–10
  scorecard_checks: ScorecardCheck[];
  vulnerabilities: Vulnerability[];
  scanned_at: string;
}

// Checks we care about — shown in the UI
const KEY_CHECKS = [
  'Maintained',
  'Code-Review',
  'CI-Tests',
  'Branch-Protection',
  'Vulnerabilities',
  'Signed-Releases',
  'Binary-Artifacts',
  'Pinned-Dependencies',
  'Fuzzing',
  'License',
];

// ── Scorecard ───────────────────────────────────────────────

async function fetchScorecard(
  owner: string,
  repo: string,
): Promise<{ score: number; checks: ScorecardCheck[] } | null> {
  try {
    const res = await fetch(
      `https://api.securityscorecards.dev/projects/github.com/${owner}/${repo}`,
      { next: { revalidate: 21600 } }, // 6h cache
    );
    if (!res.ok) return null;
    const data = await res.json();

    const checks: ScorecardCheck[] = (data.checks || [])
      .filter((c: { name: string }) => KEY_CHECKS.includes(c.name))
      .map((c: { name: string; score: number; reason: string }) => ({
        name: c.name,
        score: c.score ?? -1,
        reason: c.reason || '',
      }))
      .sort((a: ScorecardCheck, b: ScorecardCheck) => {
        // Sort: failed first, then by name
        const aFail = a.score >= 0 && a.score < 5;
        const bFail = b.score >= 0 && b.score < 5;
        if (aFail && !bFail) return -1;
        if (!aFail && bFail) return 1;
        return a.name.localeCompare(b.name);
      });

    return { score: data.score ?? null, checks };
  } catch {
    return null;
  }
}

// ── GitHub Advisory Database ─────────────────────────────────

function normalizeSeverity(s: string | null): Vulnerability['severity'] {
  switch (s?.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'medium': case 'moderate': return 'medium';
    case 'low': return 'low';
    default: return 'unknown';
  }
}

async function fetchGitHubAdvisories(
  owner: string,
  repo: string,
): Promise<Vulnerability[]> {
  try {
    const h: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'OSStore/1.0',
    };
    if (GITHUB_TOKEN) h['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch(
      `https://api.github.com/advisories?affects=${encodeURIComponent(`${owner}/${repo}`)}&per_page=10`,
      { headers: h, next: { revalidate: 21600 } },
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((a: {
      ghsa_id?: string;
      cve_id?: string;
      summary?: string;
      severity?: string;
      html_url?: string;
      published_at?: string;
    }) => ({
      id: a.ghsa_id || a.cve_id || 'unknown',
      summary: a.summary || 'Security advisory',
      severity: normalizeSeverity(a.severity ?? null),
      url: a.html_url || `https://github.com/advisories/${a.ghsa_id || ''}`,
      published: a.published_at || null,
    }));
  } catch {
    return [];
  }
}

// ── Combined scan ────────────────────────────────────────────

export async function getSecurityScan(
  owner: string,
  repo: string,
): Promise<SecurityScan> {
  const [scorecard, vulns] = await Promise.all([
    fetchScorecard(owner, repo),
    fetchGitHubAdvisories(owner, repo),
  ]);

  const hasHighCrit = vulns.some(
    (v) => v.severity === 'critical' || v.severity === 'high',
  );
  const hasMedium = vulns.some((v) => v.severity === 'medium');
  const score = scorecard?.score ?? null;
  const hasScorecard = scorecard !== null;

  let status: SecurityScan['status'] = 'unknown';

  if (hasScorecard || vulns.length > 0) {
    if (hasHighCrit || (score !== null && score < 4)) {
      status = 'danger';
    } else if (hasMedium || (score !== null && score < 7)) {
      status = 'warnings';
    } else {
      status = 'clean';
    }
  }

  return {
    status,
    scorecard_score: score,
    scorecard_checks: scorecard?.checks || [],
    vulnerabilities: vulns,
    scanned_at: new Date().toISOString(),
  };
}
