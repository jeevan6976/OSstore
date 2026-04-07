from pydantic import BaseModel
from datetime import datetime


class TrustScoreOut(BaseModel):
    overall: float
    activity_score: float
    community_score: float
    maintenance_score: float
    popularity_score: float
    computed_at: datetime

    class Config:
        from_attributes = True


class RiskFlagOut(BaseModel):
    flag_type: str
    severity: str
    message: str
    detected_at: datetime

    class Config:
        from_attributes = True


class ToolOut(BaseModel):
    id: str
    name: str
    full_name: str
    description: str | None
    url: str
    homepage: str | None
    language: str | None
    stars: int
    forks: int
    open_issues: int
    watchers: int
    license: str | None
    topics: str | None
    source: str
    owner_avatar: str | None
    last_pushed_at: datetime | None
    last_commit_at: datetime | None
    created_at: datetime
    updated_at: datetime
    package_name: str | None = None
    apk_url: str | None = None
    download_url: str | None = None
    app_type: str | None = None
    icon_url: str | None = None
    latest_version: str | None = None
    trust_score: TrustScoreOut | None = None
    risk_flags: list[RiskFlagOut] = []

    class Config:
        from_attributes = True


class SearchResult(BaseModel):
    tools: list[ToolOut]
    total: int
    query: str
    page: int
    per_page: int
