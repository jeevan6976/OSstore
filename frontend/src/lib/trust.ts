/**
 * Trust Score + Risk Flags — pure computation in TypeScript.
 * Port of backend/app/trust.py
 */

export interface TrustScore {
  overall: number;
  activity_score: number;
  community_score: number;
  maintenance_score: number;
  popularity_score: number;
}

export interface RiskFlag {
  flag_type: string;
  severity: string;
  message: string;
}

function clamp(val: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, val));
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 365 * 5;
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(diff / 86400_000, 0);
  } catch {
    return 365 * 5;
  }
}

function activityScore(lastPushed: string | null, lastCommit: string | null): number {
  const best = Math.min(daysSince(lastPushed), daysSince(lastCommit));
  if (best <= 7) return 100;
  if (best <= 30) return 90;
  if (best <= 90) return 70;
  if (best <= 180) return 50;
  if (best <= 365) return 30;
  return Math.max(10, 30 - (best - 365) / 30);
}

function communityScore(forks: number, watchers: number): number {
  const f = clamp(Math.log2(forks + 1) * 10, 0, 100);
  const w = clamp(Math.log2(watchers + 1) * 12, 0, 100);
  return Math.round((f * 0.6 + w * 0.4) * 100) / 100;
}

function maintenanceScore(openIssues: number, stars: number, lastPushed: string | null): number {
  const ratioScore = stars === 0 ? 50 : clamp(100 - (openIssues / stars) * 500, 0, 100);
  const recency = activityScore(lastPushed, null) * 0.5;
  return Math.round((ratioScore * 0.6 + recency * 0.4) * 100) / 100;
}

function popularityScore(stars: number): number {
  if (stars <= 0) return 0;
  return clamp(Math.log10(stars) * 25, 0, 100);
}

export function computeTrustScore(
  stars: number,
  forks: number,
  watchers: number,
  openIssues: number,
  lastPushed: string | null,
  lastCommit: string | null,
): TrustScore {
  const activity = Math.round(activityScore(lastPushed, lastCommit) * 100) / 100;
  const community = communityScore(forks, watchers);
  const maintenance = maintenanceScore(openIssues, stars, lastPushed);
  const popularity = Math.round(popularityScore(stars) * 100) / 100;

  const overall =
    Math.round((activity * 0.3 + community * 0.25 + maintenance * 0.2 + popularity * 0.25) * 100) / 100;

  return {
    overall,
    activity_score: activity,
    community_score: community,
    maintenance_score: maintenance,
    popularity_score: popularity,
  };
}

export function computeRiskFlags(
  stars: number,
  forks: number,
  openIssues: number,
  licenseName: string | null,
  lastPushed: string | null,
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const days = daysSince(lastPushed);

  if (!licenseName) {
    flags.push({
      flag_type: 'no_license',
      severity: 'high',
      message: 'No license detected — usage rights unclear.',
    });
  }

  if (days > 365) {
    const sev = days > 730 ? 'high' : 'medium';
    flags.push({
      flag_type: 'stale',
      severity: sev,
      message: `Last activity was ${Math.floor(days)} days ago.`,
    });
  }

  if (forks < 2 && stars < 10) {
    flags.push({
      flag_type: 'low_adoption',
      severity: 'medium',
      message: 'Very few forks and stars — low community adoption.',
    });
  }

  if (openIssues > stars * 0.5 && stars > 0) {
    flags.push({
      flag_type: 'high_issue_ratio',
      severity: 'medium',
      message: `Open issues (${openIssues}) are >50% of stars (${stars}).`,
    });
  }

  return flags;
}
