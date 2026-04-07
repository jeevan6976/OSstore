"""GitHub fetcher — pulls repos from the GitHub Search API + detects APK releases."""

import httpx
import json
from datetime import datetime, timezone
from worker.config import get_settings

settings = get_settings()

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if settings.GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"


def _parse_dt(val: str | None) -> datetime | None:
    if not val:
        return None
    return datetime.fromisoformat(val.replace("Z", "+00:00"))


def search_github_repos(query: str = "stars:>100", sort: str = "stars", per_page: int = 30, page: int = 1) -> list[dict]:
    """Search GitHub repos and return normalized dicts."""
    url = f"{GITHUB_API}/search/repositories"
    params = {"q": query, "sort": sort, "order": "desc", "per_page": per_page, "page": page}

    resp = httpx.get(url, headers=HEADERS, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    tools = []
    for repo in data.get("items", []):
        tools.append(normalize_repo(repo))
    return tools


def fetch_repo(full_name: str) -> dict | None:
    """Fetch a single repo by owner/name."""
    url = f"{GITHUB_API}/repos/{full_name}"
    resp = httpx.get(url, headers=HEADERS, timeout=30)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return normalize_repo(resp.json())


def fetch_latest_release_apk(full_name: str) -> dict | None:
    """Check the latest GitHub release for .apk assets.
    Returns {apk_url, download_url, latest_version} or None.
    """
    url = f"{GITHUB_API}/repos/{full_name}/releases/latest"
    try:
        resp = httpx.get(url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            return None
        release = resp.json()

        version = release.get("tag_name", "")
        download_page = release.get("html_url", "")

        # Look for .apk assets
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


def normalize_repo(repo: dict) -> dict:
    """Normalize GitHub API response to our tool schema."""
    license_info = repo.get("license") or {}
    topics = repo.get("topics", [])

    # Detect if this is likely an Android app
    is_android_app = any(t in topics for t in [
        "android", "android-app", "apk", "mobile", "mobile-app", "fdroid",
        "android-application", "material-design", "kotlin-android",
    ]) or repo.get("language", "").lower() in ("kotlin", "java") and "android" in repo.get("description", "").lower()

    app_type = "app" if is_android_app else "tool"

    return {
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
        "created_at": _parse_dt(repo.get("created_at")) or datetime.now(timezone.utc),
        "updated_at": _parse_dt(repo.get("updated_at")) or datetime.now(timezone.utc),
        # App-store fields
        "package_name": None,
        "apk_url": None,
        "download_url": None,
        "app_type": app_type,
        "icon_url": repo.get("owner", {}).get("avatar_url", ""),
        "latest_version": None,
    }
