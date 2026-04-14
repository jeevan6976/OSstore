/**
 * Trust Score + Risk Flags — pure computation in TypeScript.
 * Port of backend/app/trust.py
 *
 * Scoring is intentionally strict. A high trust score must be *earned*
 * across multiple independent signals — popularity alone is not enough.
 *
 * Dimensions (each 0-100, then weighted):
 *   activity_score    (25%) — recency of pushes/commits
 *   community_score   (20%) — fork-to-star health, watchers
 *   maintenance_score (25%) — issue ratio, recency, license, desc, topics
 *   popularity_score  (15%) — stars with aggressive diminishing returns
 *   maturity_score    (15%) — repo age, sustained history
 */

export interface TrustScore {
  overall: number;
  activity_score: number;
  community_score: number;
  maintenance_score: number;
  popularity_score: number;
  maturity_score: number;
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

function r2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ── Dimension scorers ───────────────────────────────────────

function activityScore(lastPushed: string | null, lastCommit: string | null): number {
  const best = Math.min(daysSince(lastPushed), daysSince(lastCommit));
  if (best <= 7) return 95;
  if (best <= 30) return 85;
  if (best <= 90) return 65;
  if (best <= 180) return 45;
  if (best <= 365) return 25;
  return Math.max(5, 25 - (best - 365) / 25);
}

function communityScore(stars: number, forks: number, watchers: number): number {
  const f = clamp(Math.log2(forks + 1) * 8, 0, 70);
  const w = clamp(Math.log2(watchers + 1) * 10, 0, 60);

  let health: number;
  if (stars > 50) {
    const ratio = forks / Math.max(stars, 1);
    health = clamp(ratio * 300, 0, 100);
  } else {
    health = 50;
  }

  return r2(f * 0.35 + w * 0.25 + health * 0.40);
}

function maintenanceScore(
  openIssues: number,
  stars: number,
  lastPushed: string | null,
  licenseName: string | null,
  description: string | null,
  hasTopics: boolean,
): number {
  const ratioScore = stars === 0 ? 40 : clamp(100 - (openIssues / stars) * 600, 0, 100);
  const recency = activityScore(lastPushed, null) * 0.4;
  const licenseScore = licenseName ? 80 : 10;

  let descScore = 60;
  if (description && description.trim().length >= 30) descScore = 90;
  else if (description && description.trim().length >= 10) descScore = 70;
  else if (!description || description.trim().length < 3) descScore = 20;

  const topicScore = hasTopics ? 75 : 35;

  return r2(
    ratioScore * 0.30 +
    recency * 0.25 +
    licenseScore * 0.25 +
    descScore * 0.10 +
    topicScore * 0.10,
  );
}

function popularityScore(stars: number): number {
  if (stars <= 0) return 0;
  return clamp(Math.log10(stars) * 20, 0, 85);
}

function maturityScore(
  createdAt: string | null,
  lastPushed: string | null,
  stars: number,
  forks: number,
): number {
  const ageDays = daysSince(createdAt);
  const activeDays = daysSince(lastPushed);

  let ageScore: number;
  if (ageDays < 30) ageScore = 10;
  else if (ageDays < 90) ageScore = 25;
  else if (ageDays < 365) ageScore = 50;
  else if (ageDays < 730) ageScore = 70;
  else ageScore = Math.min(90, 70 + Math.log2(ageDays / 730) * 10);

  let sustainedBonus = 0;
  if (ageDays > 365 && activeDays < 180) sustainedBonus = 20;
  else if (ageDays > 180 && activeDays < 90) sustainedBonus = 10;

  if (stars < 3 && forks < 1) ageScore *= 0.5;

  return clamp(ageScore + sustainedBonus, 0, 100);
}

// ── Combined trust score ────────────────────────────────────

export function computeTrustScore(
  stars: number,
  forks: number,
  watchers: number,
  openIssues: number,
  lastPushed: string | null,
  lastCommit: string | null,
  opts: {
    licenseName?: string | null;
    description?: string | null;
    hasTopics?: boolean;
    createdAt?: string | null;
  } = {},
): TrustScore {
  const licenseName = opts.licenseName ?? null;
  const description = opts.description ?? null;
  const hasTopics = opts.hasTopics ?? false;
  const createdAt = opts.createdAt ?? null;

  const activity = r2(activityScore(lastPushed, lastCommit));
  const community = communityScore(stars, forks, watchers);
  const maintenance = maintenanceScore(openIssues, stars, lastPushed, licenseName, description, hasTopics);
  const popularity = r2(popularityScore(stars));
  const maturity = r2(maturityScore(createdAt, lastPushed, stars, forks));

  let overall = r2(
    activity * 0.25 +
    community * 0.20 +
    maintenance * 0.25 +
    popularity * 0.15 +
    maturity * 0.15,
  );

  // Hard ceilings — can't bluff past these
  if (!licenseName && overall > 60) overall = 60;
  if (stars < 5 && overall > 50) overall = 50;
  if (forks < 1 && overall > 55) overall = 55;

  return {
    overall: r2(overall),
    activity_score: activity,
    community_score: community,
    maintenance_score: maintenance,
    popularity_score: popularity,
    maturity_score: maturity,
  };
}

export function computeRiskFlags(
  stars: number,
  forks: number,
  openIssues: number,
  licenseName: string | null,
  lastPushed: string | null,
  opts: {
    description?: string | null;
    createdAt?: string | null;
  } = {},
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const days = daysSince(lastPushed);
  const ageDays = daysSince(opts.createdAt);

  if (!licenseName) {
    flags.push({
      flag_type: 'no_license',
      severity: 'high',
      message: 'No license detected — usage rights unclear.',
    });
  }

  if (days > 365) {
    flags.push({
      flag_type: 'stale',
      severity: days > 730 ? 'high' : 'medium',
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

  if (ageDays < 90) {
    flags.push({
      flag_type: 'very_new',
      severity: 'medium',
      message: `Repository is only ${Math.floor(ageDays)} days old — limited track record.`,
    });
  }

  if (!opts.description || opts.description.trim().length < 10) {
    flags.push({
      flag_type: 'no_description',
      severity: 'low',
      message: 'Missing or very short description.',
    });
  }

  if (stars > 100 && forks < stars * 0.01) {
    flags.push({
      flag_type: 'suspicious_stars',
      severity: 'medium',
      message: `Star-to-fork ratio is unusually low (${forks} forks / ${stars} stars).`,
    });
  }

  return flags;
}
