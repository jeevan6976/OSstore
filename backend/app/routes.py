from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models import Tool
from app.schemas import ToolOut, SearchResult
from app.search import search_tools as meili_search

router = APIRouter()


@router.get("/search", response_model=SearchResult)
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    language: str | None = Query(None),
    source: str | None = Query(None, description="Filter by source: github, fdroid"),
    app_type: str | None = Query(None, description="Filter by type: app, tool, library"),
    db: AsyncSession = Depends(get_db),
):
    """Search tools via Meilisearch, then hydrate from DB."""
    filters = []
    if language:
        filters.append(f'language = "{language}"')
    if source:
        filters.append(f'source = "{source}"')
    if app_type:
        filters.append(f'app_type = "{app_type}"')

    meili_result = meili_search(q, page=page, per_page=per_page, language=language, filters=filters)
    hit_ids = [hit["id"] for hit in meili_result.get("hits", [])]

    if not hit_ids:
        return SearchResult(tools=[], total=0, query=q, page=page, per_page=per_page)

    stmt = (
        select(Tool)
        .options(joinedload(Tool.trust_score), joinedload(Tool.risk_flags))
        .where(Tool.id.in_(hit_ids))
    )
    result = await db.execute(stmt)
    tools = result.unique().scalars().all()

    tool_map = {t.id: t for t in tools}
    ordered = [tool_map[tid] for tid in hit_ids if tid in tool_map]

    return SearchResult(
        tools=[ToolOut.model_validate(t) for t in ordered],
        total=meili_result.get("estimatedTotalHits", len(ordered)),
        query=q,
        page=page,
        per_page=per_page,
    )


@router.get("/apps", response_model=SearchResult)
async def browse_apps(
    q: str = Query("", description="Optional search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    source: str | None = Query(None, description="Filter by source: github, fdroid"),
    db: AsyncSession = Depends(get_db),
):
    """Browse apps that have APK downloads available."""
    if q:
        filters = ['app_type = "app"']
        if source:
            filters.append(f'source = "{source}"')
        meili_result = meili_search(q, page=page, per_page=per_page, filters=filters)
        hit_ids = [hit["id"] for hit in meili_result.get("hits", [])]

        if not hit_ids:
            return SearchResult(tools=[], total=0, query=q, page=page, per_page=per_page)

        stmt = (
            select(Tool)
            .options(joinedload(Tool.trust_score), joinedload(Tool.risk_flags))
            .where(Tool.id.in_(hit_ids))
        )
        result = await db.execute(stmt)
        tools = result.unique().scalars().all()

        tool_map = {t.id: t for t in tools}
        ordered = [tool_map[tid] for tid in hit_ids if tid in tool_map]
        total = meili_result.get("estimatedTotalHits", len(ordered))
    else:
        # Browse mode: just list apps with APK URLs
        offset = (page - 1) * per_page
        stmt = (
            select(Tool)
            .options(joinedload(Tool.trust_score), joinedload(Tool.risk_flags))
            .where(Tool.app_type == "app")
        )
        if source:
            stmt = stmt.where(Tool.source == source)
        stmt = stmt.order_by(Tool.stars.desc()).offset(offset).limit(per_page)

        result = await db.execute(stmt)
        ordered = result.unique().scalars().all()

        count_stmt = select(func.count(Tool.id)).where(Tool.app_type == "app")
        if source:
            count_stmt = count_stmt.where(Tool.source == source)
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0

    return SearchResult(
        tools=[ToolOut.model_validate(t) for t in ordered],
        total=total,
        query=q or "apps",
        page=page,
        per_page=per_page,
    )


@router.get("/tool/{tool_id}", response_model=ToolOut)
async def get_tool(tool_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single tool by ID."""
    stmt = (
        select(Tool)
        .options(joinedload(Tool.trust_score), joinedload(Tool.risk_flags))
        .where(Tool.id == tool_id)
    )
    result = await db.execute(stmt)
    tool = result.unique().scalar_one_or_none()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    return ToolOut.model_validate(tool)
