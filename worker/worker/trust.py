"""Trust Score + Risk Flags — pure computation, no I/O.

Scoring is intentionally strict. A high trust score must be *earned*
across multiple independent signals — popularity alone is not enough.

Dimensions (each 0-100, then weighted):
  activity_score    (25%) — recency of pushes/commits, penalises stale repos
  community_score   (20%) — fork-to-star health, watchers, contributor signal
  maintenance_score (25%) — issue ratio, recency, description, topics, license
  popularity_score  (15%) — stars with aggressive diminishing returns
  maturity_score    (15%) — repo age, consistent history, not brand-new
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


def _days_since(dt: datetime | str | None) -> float:
    if dt is None:
        return 365 * 5  # treat unknown as very old
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except Exception:
            return 365 * 5
    delta = _now_utc() - _make_aware(dt)
    return max(delta.total_seconds() / 86400, 0)


# ── Dimension scorers (public for individual use) ──────────

def compute_activity_score(last_pushed_at, last_commit_at) -> float:
    """More recent = higher score. Caps at 95 — perfection is suspicious."""
    best = min(_days_since(last_pushed_at), _days_since(last_commit_at))
    if best <= 7:
        return 95.0
    if best <= 30:
        return 85.0
    if best <= 90:
        return 65.0
    if best <= 180:
        return 45.0
    if best <= 365:
        return 25.0
    return max(5.0, 25.0 - (best - 365) / 25)


def compute_community_score(stars: int, forks: int, watchers: int) -> float:
    """Healthy community = meaningful forks relative to stars + watchers."""
    f = _clamp(math.log2(forks + 1) * 8, 0, 70)
    w = _clamp(math.log2(watchers + 1) * 10, 0, 60)

    # Fork-to-star health
    if stars > 50:
        ratio = forks / max(stars, 1)
        health = _clamp(ratio * 300, 0, 100)
    else:
        health = 50.0

    return round(f * 0.35 + w * 0.25 + health * 0.40, 2)


def compute_maintenance_score(
    open_issues: int,
    stars: int,
    last_pushed_at,
    license_name: str | None = None,
    description: str | None = None,
    has_topics: bool = False,
) -> float:
    """Multi-factor maintenance: issue ratio, recency, license, description, topics."""
    if stars == 0:
        ratio_score = 40.0
    else:
        ratio = open_issues / stars
        ratio_score = _clamp(100 - ratio * 600, 0, 100)

    recency = compute_activity_score(last_pushed_at, None) * 0.4

    license_score = 80.0 if license_name else 10.0

    desc_score = 60.0
    if description and len(description.strip()) >= 30:
        desc_score = 90.0
    elif description and len(description.strip()) >= 10:
        desc_score = 70.0
    elif not description or len(description.strip()) < 3:
        desc_score = 20.0

    topic_score = 75.0 if has_topics else 35.0

    return round(
        ratio_score * 0.30
        + recency * 0.25
        + license_score * 0.25
        + desc_score * 0.10
        + topic_score * 0.10,
        2,
    )


def compute_popularity_score(stars: int) -> float:
    """Aggressive diminishing returns — 10k stars ≈ 80, not 100."""
    if stars <= 0:
        return 0.0
    return _clamp(math.log10(stars) * 20, 0, 85)


def compute_maturity_score(created_at, last_pushed_at, stars: int, forks: int) -> float:
    """Older repos with sustained activity score higher."""
    age_days = _days_since(created_at)
    active_days = _days_since(last_pushed_at)

    if age_days < 30:
        age_score = 10.0
    elif age_days < 90:
        age_score = 25.0
    elif age_days < 365:
        age_score = 50.0
    elif age_days < 730:
        age_score = 70.0
    else:
        age_score = min(90.0, 70.0 + math.log2(age_days / 730) * 10)

    if age_days > 365 and active_days < 180:
        sustained_bonus = 20.0
    elif age_days > 180 and active_days < 90:
        sustained_bonus = 10.0
    else:
        sustained_bonus = 0.0

    if stars < 3 and forks < 1:
        age_score *= 0.5

    return _clamp(age_score + sustained_bonus, 0, 100)


# ── Combined trust score ───────────────────────────────────

def compute_trust_score(
    stars: int,
    forks: int,
    watchers: int,
    open_issues: int,
    last_pushed_at,
    last_commit_at,
    *,
    license_name: str | None = None,
    description: str | None = None,
    has_topics: bool = False,
    created_at=None,
) -> dict:
    activity = round(compute_activity_score(last_pushed_at, last_commit_at), 2)
    community = round(compute_community_score(stars, forks, watchers), 2)
    maintenance = round(compute_maintenance_score(open_issues, stars, last_pushed_at, license_name, description, has_topics), 2)
    popularity = round(compute_popularity_score(stars), 2)
    maturity = round(compute_maturity_score(created_at, last_pushed_at, stars, forks), 2)

    overall = round(
        activity * 0.25
        + community * 0.20
        + maintenance * 0.25
        + popularity * 0.15
        + maturity * 0.15,
        2,
    )

    # Hard ceilings
    if not license_name and overall > 60:
        overall = 60.0
    if stars < 5 and overall > 50:
        overall = 50.0
    if forks < 1 and overall > 55:
        overall = 55.0

    return {
        "overall": round(overall, 2),
        "activity_score": activity,
        "community_score": community,
        "maintenance_score": maintenance,
        "popularity_score": popularity,
        "maturity_score": maturity,
    }


def compute_risk_flags(
    stars: int,
    forks: int,
    open_issues: int,
    license_name: str | None,
    last_pushed_at,
    *,
    description: str | None = None,
    created_at=None,
) -> list[dict]:
    flags = []
    days = _days_since(last_pushed_at)
    age_days = _days_since(created_at)

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
            "message": f"Open issues ({open_issues}) are >50 % of stars ({stars}).",
        })

    if age_days < 90:
        flags.append({
            "flag_type": "very_new",
            "severity": "medium",
            "message": f"Repository is only {int(age_days)} days old — limited track record.",
        })

    if not description or len(description.strip()) < 10:
        flags.append({
            "flag_type": "no_description",
            "severity": "low",
            "message": "Missing or very short description.",
        })

    if stars > 100 and forks < stars * 0.01:
        flags.append({
            "flag_type": "suspicious_stars",
            "severity": "medium",
            "message": f"Star-to-fork ratio is unusually low ({forks} forks / {stars} stars).",
        })

    return flags
