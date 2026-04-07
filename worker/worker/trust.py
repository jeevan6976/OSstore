"""Trust Score computation logic.

Scoring dimensions (each 0–100, then weighted):
  - activity_score  (30%): Based on recency of pushes and commits
  - community_score (25%): Based on contributors (forks as proxy), watchers
  - maintenance_score (20%): Based on open issues ratio, recent updates
  - popularity_score (25%): Based on stars
"""

import math
from datetime import datetime, timedelta, timezone


def _clamp(val: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, val))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _make_aware(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware (UTC)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _days_since(dt: datetime | None) -> float:
    if dt is None:
        return 365 * 5  # treat unknown as very old
    delta = _now_utc() - _make_aware(dt)
    return max(delta.total_seconds() / 86400, 0)


def compute_activity_score(last_pushed_at: datetime | None, last_commit_at: datetime | None) -> float:
    """More recent = higher score. Decays over 1 year."""
    best = min(_days_since(last_pushed_at), _days_since(last_commit_at))
    if best <= 7:
        return 100.0
    if best <= 30:
        return 90.0
    if best <= 90:
        return 70.0
    if best <= 180:
        return 50.0
    if best <= 365:
        return 30.0
    return max(10.0, 30.0 - (best - 365) / 30)


def compute_community_score(forks: int, watchers: int) -> float:
    """Logarithmic scaling — diminishing returns."""
    fork_score = _clamp(math.log2(forks + 1) * 10, 0, 100)
    watch_score = _clamp(math.log2(watchers + 1) * 12, 0, 100)
    return round((fork_score * 0.6 + watch_score * 0.4), 2)


def compute_maintenance_score(open_issues: int, stars: int, last_pushed_at: datetime | None) -> float:
    """Lower issue-to-star ratio = better. Recent push = better."""
    if stars == 0:
        ratio_score = 50.0
    else:
        ratio = open_issues / stars
        ratio_score = _clamp(100 - ratio * 500, 0, 100)

    recency_score = compute_activity_score(last_pushed_at, None) * 0.5
    return round((ratio_score * 0.6 + recency_score * 0.4), 2)


def compute_popularity_score(stars: int) -> float:
    """Logarithmic scale. 10k stars ≈ 100."""
    if stars <= 0:
        return 0.0
    return _clamp(math.log10(stars) * 25, 0, 100)


def compute_trust_score(
    stars: int,
    forks: int,
    watchers: int,
    open_issues: int,
    last_pushed_at: datetime | None,
    last_commit_at: datetime | None,
) -> dict:
    activity = round(compute_activity_score(last_pushed_at, last_commit_at), 2)
    community = round(compute_community_score(forks, watchers), 2)
    maintenance = round(compute_maintenance_score(open_issues, stars, last_pushed_at), 2)
    popularity = round(compute_popularity_score(stars), 2)

    overall = round(
        activity * 0.30 +
        community * 0.25 +
        maintenance * 0.20 +
        popularity * 0.25,
        2,
    )

    return {
        "overall": overall,
        "activity_score": activity,
        "community_score": community,
        "maintenance_score": maintenance,
        "popularity_score": popularity,
    }


def compute_risk_flags(
    stars: int,
    forks: int,
    open_issues: int,
    license_name: str | None,
    last_pushed_at: datetime | None,
) -> list[dict]:
    flags = []
    days = _days_since(last_pushed_at)

    if not license_name:
        flags.append({
            "flag_type": "no_license",
            "severity": "high",
            "message": "No license detected — usage rights unclear.",
        })

    if days > 365:
        flags.append({
            "flag_type": "stale",
            "severity": "high" if days > 730 else "medium",
            "message": f"Last activity was {int(days)} days ago.",
        })

    if forks < 2 and stars < 10:
        flags.append({
            "flag_type": "low_adoption",
            "severity": "medium",
            "message": "Very few forks and stars — low community adoption.",
        })

    if open_issues > stars * 0.5 and stars > 0:
        flags.append({
            "flag_type": "high_issue_ratio",
            "severity": "medium",
            "message": f"Open issues ({open_issues}) are >50% of stars ({stars}).",
        })

    return flags
