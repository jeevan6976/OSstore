from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
    db: AsyncSession = Depends(get_db),
):
    """Search tools via Meilisearch, then hydrate from DB."""
    meili_result = meili_search(q, page=page, per_page=per_page, language=language)
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

    # Preserve Meilisearch ordering
    tool_map = {t.id: t for t in tools}
    ordered = [tool_map[tid] for tid in hit_ids if tid in tool_map]

    return SearchResult(
        tools=[ToolOut.model_validate(t) for t in ordered],
        total=meili_result.get("estimatedTotalHits", len(ordered)),
        query=q,
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
