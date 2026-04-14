"""Stateless API routes — live GitHub + F-Droid lookups, no database.
Uses asyncio.gather for parallel requests."""

import asyncio
from fastapi import APIRouter, HTTPException, Query

from app.schemas import ToolOut, SearchResult, TrustScoreOut, RiskFlagOut, VersionOut
from app import github_service, fdroid_service
from app.trust import compute_trust_score, compute_risk_flags

router = APIRouter()


def _enrich(tool: dict) -> ToolOut:
    """Attach trust score + risk flags to a raw tool dict."""
    ts = compute_trust_score(
        stars=tool.get("stars", 0),
        forks=tool.get("forks", 0),
        watchers=tool.get("watchers", 0),
        open_issues=tool.get("open_issues", 0),
        last_pushed_at=tool.get("last_pushed_at"),
        last_commit_at=tool.get("last_commit_at"),
        license_name=tool.get("license"),
        description=tool.get("description"),
        has_topics=bool(tool.get("topics")),
        created_at=tool.get("created_at"),
    )
    rf = compute_risk_flags(
        stars=tool.get("stars", 0),
        forks=tool.get("forks", 0),
        open_issues=tool.get("open_issues", 0),
        license_name=tool.get("license"),
        last_pushed_at=tool.get("last_pushed_at"),
        description=tool.get("description"),
        created_at=tool.get("created_at"),
    )
    tool["trust_score"] = TrustScoreOut(**ts)
    tool["risk_flags"] = [RiskFlagOut(**f) for f in rf]
    return ToolOut(**tool)


# ────────────────────────────────────────────────────────────────
# GET /api/search?q=...
# ────────────────────────────────────────────────────────────────

@router.get("/search", response_model=SearchResult)
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    source: str | None = Query(None, description="Filter by source: github, fdroid"),
):
    """Search GitHub + F-Droid live."""
    tools: list[ToolOut] = []
    total = 0

    # Run GitHub + F-Droid searches in parallel
    gh_task = None
    fd_task = None

    if source != "fdroid":
        gh_task = asyncio.create_task(
            github_service.search_repos(query=q, per_page=per_page, page=page)
        )
    if source != "github":
        fd_task = asyncio.create_task(
            fdroid_service.search_fdroid(q, limit=per_page)
        )

    if gh_task:
        gh_tools, gh_total = await gh_task
        # Parallel APK detection for android repos (top 5)
        android_repos = [(i, t) for i, t in enumerate(gh_tools) if t.get("app_type") == "app"][:5]
        if android_repos:
            apk_results = await asyncio.gather(
                *[github_service.fetch_latest_release_apk(t["full_name"]) for _, t in android_repos],
                return_exceptions=True,
            )
            for (idx, t), apk in zip(android_repos, apk_results):
                if apk and not isinstance(apk, Exception):
                    gh_tools[idx].update(apk)
        for t in gh_tools:
            tools.append(_enrich(t))
        total += gh_total

    if fd_task:
        fd_tools = await fd_task
        for t in fd_tools:
            tools.append(_enrich(t))
        total += len(fd_tools)

    return SearchResult(tools=tools[:per_page], total=total, query=q, page=page, per_page=per_page)


# ────────────────────────────────────────────────────────────────
# GET /api/apps?q=...&source=...
# ────────────────────────────────────────────────────────────────

@router.get("/apps", response_model=SearchResult)
async def browse_apps(
    q: str = Query("", description="Optional search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    source: str | None = Query(None, description="Filter: github, fdroid"),
):
    """Browse / search installable apps."""
    tools: list[ToolOut] = []
    total = 0

    # Run F-Droid + GitHub in parallel
    fd_task = None
    gh_task = None

    if source != "github":
        if q:
            fd_task = asyncio.create_task(fdroid_service.search_fdroid(q, limit=per_page))
        else:
            fd_task = asyncio.create_task(fdroid_service.get_fdroid_apps())

    if source != "fdroid":
        gh_query = f"{q} " if q else ""
        gh_query += "topic:android topic:apk"
        gh_task = asyncio.create_task(
            github_service.search_repos(query=gh_query, per_page=per_page, page=page)
        )

    if fd_task:
        fd_result = await fd_task
        if q:
            fd = fd_result
            total += len(fd)
        else:
            offset = (page - 1) * per_page
            fd = fd_result[offset : offset + per_page]
            total += len(fd_result)
        for t in fd:
            tools.append(_enrich(t))

    if gh_task:
        gh_tools, gh_total = await gh_task
        # Parallel APK detection
        apk_results = await asyncio.gather(
            *[github_service.fetch_latest_release_apk(t["full_name"]) for t in gh_tools],
            return_exceptions=True,
        )
        for t, apk in zip(gh_tools, apk_results):
            if apk and not isinstance(apk, Exception):
                t.update(apk)
            tools.append(_enrich(t))
        total += gh_total

    return SearchResult(
        tools=tools[:per_page], total=total, query=q or "apps", page=page, per_page=per_page
    )


# ────────────────────────────────────────────────────────────────
# GET /api/trending — popular repos for the homepage
# ────────────────────────────────────────────────────────────────

@router.get("/trending", response_model=SearchResult)
async def trending(
    per_page: int = Query(12, ge=1, le=50),
):
    """Return trending/popular repos (stars > 1000)."""
    # Run GitHub search + F-Droid fetch in parallel
    gh_task = github_service.search_repos(
        query="stars:>1000", sort="stars", per_page=per_page, page=1
    )
    fd_task = fdroid_service.get_fdroid_apps(limit=6)
    (gh_tools, gh_total), fd_tools = await asyncio.gather(gh_task, fd_task)

    tools: list[ToolOut] = []
    # Parallel APK detection for android repos
    android_repos = [(i, t) for i, t in enumerate(gh_tools) if t.get("app_type") == "app"]
    if android_repos:
        apk_results = await asyncio.gather(
            *[github_service.fetch_latest_release_apk(t["full_name"]) for _, t in android_repos],
            return_exceptions=True,
        )
        for (idx, t), apk in zip(android_repos, apk_results):
            if apk and not isinstance(apk, Exception):
                gh_tools[idx].update(apk)

    for t in gh_tools:
        tools.append(_enrich(t))
    for t in fd_tools:
        tools.append(_enrich(t))

    return SearchResult(
        tools=tools[:per_page], total=len(tools), query="trending", page=1, per_page=per_page
    )


# ────────────────────────────────────────────────────────────────
# GET /api/tool/{tool_id}
# ────────────────────────────────────────────────────────────────

@router.get("/tool/{tool_id:path}", response_model=ToolOut)
async def get_tool(tool_id: str):
    """Fetch a single tool by ID.
    ID format:  owner/repo  (GitHub)  or  fdroid/com.example.app  (F-Droid)
    """
    if tool_id.startswith("fdroid/"):
        pkg = tool_id.removeprefix("fdroid/")
        app = await fdroid_service.get_fdroid_app(pkg)
        if not app:
            raise HTTPException(status_code=404, detail="F-Droid app not found")
        # F-Droid apps already have versions from the index
        return _enrich(app)

    # Treat as GitHub full_name (owner/repo)
    # Fetch repo, APK, releases, README all in parallel
    repo_task = github_service.fetch_repo(tool_id)
    apk_task = github_service.fetch_latest_release_apk(tool_id)
    releases_task = github_service.fetch_releases(tool_id)
    readme_task = github_service.fetch_readme(tool_id)

    repo, apk, releases, readme = await asyncio.gather(
        repo_task, apk_task, releases_task, readme_task,
        return_exceptions=True,
    )

    if not repo or isinstance(repo, Exception):
        raise HTTPException(status_code=404, detail="GitHub repo not found")

    if apk and not isinstance(apk, Exception):
        repo.update(apk)

    if releases and not isinstance(releases, Exception):
        repo["versions"] = releases
    else:
        repo["versions"] = []

    if readme and not isinstance(readme, Exception):
        repo["readme_html"] = readme

    return _enrich(repo)
