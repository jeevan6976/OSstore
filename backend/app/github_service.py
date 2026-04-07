"""Async GitHub API client — search repos, fetch single repo, detect APKs."""

import json
import httpx
from datetime import datetime, timezone
from app.config import get_settings

settings = get_settings()

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if settings.GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"


def _parse_dt(val: str | None) -> str | None:
    """Return ISO string or None."""
    if not val:
        return None
    return val.replace("Z", "+00:00")


def _parse_dt_obj(val: str | None) -> datetime | None:
    """Return datetime object or None (for trust score computation)."""
    if not val:
        return None
    return datetime.fromisoformat(val.replace("Z", "+00:00"))


async def search_repos(
    query: str,
    sort: str = "stars",
    per_page: int = 20,
    page: int = 1,
) -> tuple[list[dict], int]:
    """Search GitHub repos. Returns (tools_list, total_count)."""
    url = f"{GITHUB_API}/search/repositories"
    params = {
        "q": query,
        "sort": sort,
        "order": "desc",
        "per_page": per_page,
        "page": page,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=HEADERS, params=params)
        resp.raise_for_status()
        data = resp.json()

    total = data.get("total_count", 0)
    tools = [_normalize_repo(repo) for repo in data.get("items", [])]
    return tools, total


async def fetch_repo(full_name: str) -> dict | None:
    """Fetch a single repo by owner/name."""
    url = f"{GITHUB_API}/repos/{full_name}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=HEADERS)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return _normalize_repo(resp.json())


async def fetch_latest_release_apk(full_name: str) -> dict | None:
    """Check the latest GitHub release for .apk assets."""
    url = f"{GITHUB_API}/repos/{full_name}/releases/latest"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers=HEADERS)
            if resp.status_code != 200:
                return None
            release = resp.json()

        version = release.get("tag_name", "")
        download_page = release.get("html_url", "")

        for asset in release.get("assets", []):
            name = asset.get("name", "").lower()
            if name.endswith(".apk"):
                return {
                    "apk_url": asset.get("browser_download_url", ""),
                    "download_url": download_page,
                    "latest_version": version,
                }
        return None
    except Exception:
        return None


async def fetch_readme(full_name: str) -> str | None:
    """Fetch rendered README HTML for a GitHub repo."""
    url = f"{GITHUB_API}/repos/{full_name}/readme"
    headers = {**HEADERS, "Accept": "application/vnd.github.html+json"}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                return None
            return resp.text
    except Exception:
        return None


async def fetch_releases(full_name: str, limit: int = 10) -> list[dict]:
    """Fetch recent releases for a GitHub repo."""
    url = f"{GITHUB_API}/repos/{full_name}/releases"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers=HEADERS, params={"per_page": limit})
            if resp.status_code != 200:
                return []
            releases = resp.json()

        versions = []
        for r in releases:
            tag = r.get("tag_name", "")
            published = r.get("published_at", "")
            # Find APK or first asset
            apk_url = ""
            size = 0
            for asset in r.get("assets", []):
                if asset.get("name", "").lower().endswith(".apk"):
                    apk_url = asset.get("browser_download_url", "")
                    size = asset.get("size", 0)
                    break
            versions.append({
                "version": tag,
                "code": "",
                "apk_url": apk_url,
                "size": size,
                "added": published.replace("Z", "+00:00") if published else None,
                "download_url": r.get("html_url", ""),
            })
        return versions
    except Exception:
        return []


def _normalize_repo(repo: dict) -> dict:
    """Normalize GitHub API response to our tool schema."""
    license_info = repo.get("license") or {}
    topics = repo.get("topics", [])

    is_android = any(
        t in topics
        for t in [
            "android", "android-app", "apk", "mobile", "mobile-app",
            "fdroid", "android-application", "material-design", "kotlin-android",
        ]
    ) or (
        repo.get("language", "").lower() in ("kotlin", "java")
        and "android" in (repo.get("description") or "").lower()
    )

    return {
        "id": repo["full_name"],  # use full_name as unique ID
        "name": repo["name"],
        "full_name": repo["full_name"],
        "description": repo.get("description", ""),
        "url": repo["html_url"],
        "homepage": repo.get("homepage", ""),
        "language": repo.get("language", ""),
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "open_issues": repo.get("open_issues_count", 0),
        "watchers": repo.get("watchers_count", 0),
        "license": license_info.get("spdx_id"),
        "topics": json.dumps(topics),
        "source": "github",
        "owner_avatar": repo.get("owner", {}).get("avatar_url", ""),
        "last_pushed_at": _parse_dt(repo.get("pushed_at")),
        "last_commit_at": _parse_dt(repo.get("updated_at")),
        "package_name": None,
        "apk_url": None,
        "download_url": None,
        "app_type": "app" if is_android else "tool",
        "icon_url": repo.get("owner", {}).get("avatar_url", ""),
        "latest_version": None,
    }
