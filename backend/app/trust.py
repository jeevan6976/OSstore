"""Trust Score + Risk Flags — pure computation, no I/O."""

import math
from datetime import datetime, timedelta, timezone


def _clamp(val: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, val))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _make_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _days_since(dt) -> float:
    """Accept datetime or ISO string or None."""
    if dt is None:
        return 365 * 5
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except Exception:
            return 365 * 5
    delta = _now_utc() - _make_aware(dt)
    return max(delta.total_seconds() / 86400, 0)


def compute_trust_score(
    stars: int,
    forks: int,
    watchers: int,
    open_issues: int,
    last_pushed_at,
    last_commit_at,
) -> dict:
    activity = round(_activity(last_pushed_at, last_commit_at), 2)
    community = round(_community(forks, watchers), 2)
    maintenance = round(_maintenance(open_issues, stars, last_pushed_at), 2)
    popularity = round(_popularity(stars), 2)

    overall = round(
        activity * 0.30 + community * 0.25 + maintenance * 0.20 + popularity * 0.25, 2
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
    last_pushed_at,
) -> list[dict]:
    flags = []
    days = _days_since(last_pushed_at)

    if not license_name:
        flags.append({"flag_type": "no_license", "severity": "high", "message": "No license detected — usage rights unclear."})

    if days > 365:
        sev = "high" if days > 730 else "medium"
        flags.append({"flag_type": "stale", "severity": sev, "message": f"Last activity was {int(days)} days ago."})

    if forks < 2 and stars < 10:
        flags.append({"flag_type": "low_adoption", "severity": "medium", "message": "Very few forks and stars — low community adoption."})

    if open_issues > stars * 0.5 and stars > 0:
        flags.append({"flag_type": "high_issue_ratio", "severity": "medium", "message": f"Open issues ({open_issues}) are >50% of stars ({stars})."})

    return flags


# ── internal helpers ────────────────────────────────────────

def _activity(last_pushed_at, last_commit_at) -> float:
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


def _community(forks: int, watchers: int) -> float:
    f = _clamp(math.log2(forks + 1) * 10, 0, 100)
    w = _clamp(math.log2(watchers + 1) * 12, 0, 100)
    return round(f * 0.6 + w * 0.4, 2)


def _maintenance(open_issues: int, stars: int, last_pushed_at) -> float:
    ratio_score = 50.0 if stars == 0 else _clamp(100 - (open_issues / stars) * 500, 0, 100)
    recency = _activity(last_pushed_at, None) * 0.5
    return round(ratio_score * 0.6 + recency * 0.4, 2)


def _popularity(stars: int) -> float:
    if stars <= 0:
        return 0.0
    return _clamp(math.log10(stars) * 25, 0, 100)
