"""Async F-Droid index fetcher with Redis caching."""

import json
import httpx
import redis.asyncio as aioredis
from datetime import datetime, timezone
from app.config import get_settings

settings = get_settings()

FDROID_INDEX_URL = "https://f-droid.org/repo/index-v2.json"
FDROID_V1_URL = "https://f-droid.org/repo/index-v1.json"
FDROID_REPO_BASE = "https://f-droid.org/repo"
FDROID_PAGE_URL = "https://f-droid.org/packages"

CACHE_KEY = "fdroid:index"
CACHE_TTL = 60 * 60 * 6  # 6 hours


async def _get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_fdroid_apps(limit: int = 800) -> list[dict]:
    """Return cached F-Droid app list, refreshing from remote if stale."""
    r = await _get_redis()
    try:
        cached = await r.get(CACHE_KEY)
        if cached:
            return json.loads(cached)[:limit]
    except Exception:
        pass

    apps = await _fetch_index(limit)

    try:
        await r.set(CACHE_KEY, json.dumps(apps), ex=CACHE_TTL)
    except Exception:
        pass
    finally:
        await r.aclose()

    return apps


async def search_fdroid(query: str, limit: int = 50) -> list[dict]:
    """Search the cached F-Droid index by name / description / package_name."""
    all_apps = await get_fdroid_apps()
    q = query.lower()
    results = []
    for app in all_apps:
        if (
            q in app.get("name", "").lower()
            or q in app.get("description", "").lower()
            or q in app.get("package_name", "").lower()
        ):
            results.append(app)
            if len(results) >= limit:
                break
    return results


async def get_fdroid_app(package_name: str) -> dict | None:
    """Find a single F-Droid app by package name."""
    all_apps = await get_fdroid_apps()
    for app in all_apps:
        if app.get("package_name") == package_name:
            return app
    return None


# ── internal fetchers ──────────────────────────────────────────


async def _fetch_index(limit: int) -> list[dict]:
    """Try v2, fall back to v1."""
    try:
        return await _fetch_v2(limit)
    except Exception as e:
        print(f"[F-Droid] v2 failed ({e}), trying v1…")
        return await _fetch_v1(limit)


async def _fetch_v2(limit: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        resp = await client.get(FDROID_INDEX_URL)
        resp.raise_for_status()
        data = resp.json()

    packages = data.get("packages", {})
    apps: list[dict] = []

    for pkg_name, pkg_data in packages.items():
        if len(apps) >= limit:
            break
        try:
            meta = pkg_data.get("metadata", {})
            versions = pkg_data.get("versions", {})

            name_d = meta.get("name", {})
            name = name_d.get("en-US", name_d.get("en", "")) or next(
                iter(name_d.values()), pkg_name.split(".")[-1]
            )

            desc_d = meta.get("description", {})
            description = desc_d.get("en-US", desc_d.get("en", ""))
            if not description:
                s = meta.get("summary", {})
                description = s.get("en-US", s.get("en", ""))

            latest_version = ""
            apk_name = ""
            if versions:
                _, vi = sorted(versions.items(), key=lambda x: x[0], reverse=True)[0]
                latest_version = vi.get("manifest", {}).get("versionName", "")
                apk_name = vi.get("file", {}).get("name", "")

            apk_url = f"{FDROID_REPO_BASE}/{apk_name}" if apk_name else ""

            icon_d = meta.get("icon", {})
            icon_name = ""
            if icon_d:
                loc = icon_d.get("en-US", icon_d.get("en", {}))
                icon_name = loc.get("name", "") if isinstance(loc, dict) else (loc or "")
            icon_url = f"{FDROID_REPO_BASE}/{pkg_name}/{icon_name}" if icon_name else ""

            categories = meta.get("categories", [])
            license_name = meta.get("license", "")
            added = meta.get("added", 0)
            updated = meta.get("lastUpdated", 0)

            apps.append(
                _build_app(
                    name=name or pkg_name.split(".")[-1],
                    pkg_name=pkg_name,
                    description=description,
                    homepage=meta.get("webSite", ""),
                    license_name=license_name,
                    categories=categories,
                    apk_url=apk_url,
                    icon_url=icon_url,
                    latest_version=latest_version,
                    added=added,
                    updated=updated,
                )
            )
        except Exception:
            continue

    return apps


async def _fetch_v1(limit: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        resp = await client.get(FDROID_V1_URL)
        resp.raise_for_status()
        data = resp.json()

    raw_apps = data.get("apps", [])
    raw_pkgs = data.get("packages", {})
    apps: list[dict] = []

    for ai in raw_apps[:limit]:
        try:
            pkg_name = ai.get("packageName", "")
            if not pkg_name:
                continue

            name = ai.get("name", "") or ai.get("localized", {}).get("en-US", {}).get("name", pkg_name)
            description = ai.get("summary", "") or ai.get("localized", {}).get("en-US", {}).get("summary", "")

            pkg_versions = raw_pkgs.get(pkg_name, [])
            latest_version = ""
            apk_name = ""
            if pkg_versions:
                latest_version = pkg_versions[0].get("versionName", "")
                apk_name = pkg_versions[0].get("apkName", "")

            apk_url = f"{FDROID_REPO_BASE}/{apk_name}" if apk_name else ""
            icon_n = ai.get("icon", "")
            icon_url = f"{FDROID_REPO_BASE}/icons-640/{icon_n}" if icon_n else ""

            categories = ai.get("categories", [])
            license_name = ai.get("license", "")

            apps.append(
                _build_app(
                    name=name or pkg_name.split(".")[-1],
                    pkg_name=pkg_name,
                    description=str(description)[:2000] if description else "",
                    homepage=ai.get("webSite", ""),
                    license_name=license_name,
                    categories=categories,
                    apk_url=apk_url,
                    icon_url=icon_url,
                    latest_version=latest_version,
                    added=ai.get("added", 0),
                    updated=ai.get("lastUpdated", 0),
                )
            )
        except Exception:
            continue

    return apps


def _build_app(
    *,
    name: str,
    pkg_name: str,
    description: str,
    homepage: str,
    license_name: str,
    categories: list,
    apk_url: str,
    icon_url: str,
    latest_version: str,
    added: int,
    updated: int,
) -> dict:
    last_updated = (
        datetime.fromtimestamp(updated / 1000, tz=timezone.utc).isoformat()
        if updated
        else None
    )

    return {
        "id": f"fdroid/{pkg_name}",
        "name": name,
        "full_name": f"fdroid/{pkg_name}",
        "description": (description[:2000] if description else ""),
        "url": f"{FDROID_PAGE_URL}/{pkg_name}",
        "homepage": homepage,
        "language": "Android",
        "stars": 0,
        "forks": 0,
        "open_issues": 0,
        "watchers": 0,
        "license": license_name,
        "topics": json.dumps(categories) if categories else "[]",
        "source": "fdroid",
        "owner_avatar": icon_url,
        "last_pushed_at": last_updated,
        "last_commit_at": last_updated,
        "package_name": pkg_name,
        "apk_url": apk_url,
        "download_url": f"{FDROID_PAGE_URL}/{pkg_name}",
        "app_type": "app",
        "icon_url": icon_url,
        "latest_version": latest_version,
    }
