"""Stateless API routes — live GitHub + F-Droid lookups, no database."""

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
    )
    rf = compute_risk_flags(
        stars=tool.get("stars", 0),
        forks=tool.get("forks", 0),
        open_issues=tool.get("open_issues", 0),
        license_name=tool.get("license"),
        last_pushed_at=tool.get("last_pushed_at"),
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

    if source != "fdroid":
        gh_tools, gh_total = await github_service.search_repos(
            query=q, per_page=per_page, page=page
        )
        # Try to detect APKs for Android-looking repos (top 5 only to save API calls)
        for t in gh_tools:
            if t.get("app_type") == "app":
                apk = await github_service.fetch_latest_release_apk(t["full_name"])
                if apk:
                    t.update(apk)
            tools.append(_enrich(t))
        total += gh_total

    if source != "github":
        fd_tools = await fdroid_service.search_fdroid(q, limit=per_page)
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

    # F-Droid apps
    if source != "github":
        if q:
            fd = await fdroid_service.search_fdroid(q, limit=per_page)
        else:
            all_fd = await fdroid_service.get_fdroid_apps()
            offset = (page - 1) * per_page
            fd = all_fd[offset : offset + per_page]
            total += len(all_fd)
        for t in fd:
            tools.append(_enrich(t))
        if q:
            total += len(fd)

    # GitHub Android apps
    if source != "fdroid":
        gh_query = f"{q} " if q else ""
        gh_query += "topic:android topic:apk"
        gh_tools, gh_total = await github_service.search_repos(
            query=gh_query, per_page=per_page, page=page
        )
        for t in gh_tools:
            apk = await github_service.fetch_latest_release_apk(t["full_name"])
            if apk:
                t.update(apk)
            tools.append(_enrich(t))
        total += gh_total

    return SearchResult(
        tools=tools[:per_page], total=total, query=q or "apps", page=page, per_page=per_page
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
    repo = await github_service.fetch_repo(tool_id)
    if not repo:
        raise HTTPException(status_code=404, detail="GitHub repo not found")

    apk = await github_service.fetch_latest_release_apk(tool_id)
    if apk:
        repo.update(apk)

    # Fetch version history from GitHub releases
    releases = await github_service.fetch_releases(tool_id)
    repo["versions"] = releases

    return _enrich(repo)
