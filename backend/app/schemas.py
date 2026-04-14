from pydantic import BaseModel


class TrustScoreOut(BaseModel):
    overall: float
    activity_score: float
    community_score: float
    maintenance_score: float
    popularity_score: float
    maturity_score: float = 0.0


class RiskFlagOut(BaseModel):
    flag_type: str
    severity: str
    message: str


class VersionOut(BaseModel):
    version: str
    code: str = ""
    apk_url: str = ""
    size: int = 0
    added: str | None = None
    download_url: str = ""


class ToolOut(BaseModel):
    id: str
    name: str
    full_name: str
    description: str | None = None
    url: str
    homepage: str | None = None
    language: str | None = None
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    watchers: int = 0
    license: str | None = None
    topics: str | None = None
    source: str = "github"
    owner_avatar: str | None = None
    last_pushed_at: str | None = None
    last_commit_at: str | None = None
    package_name: str | None = None
    apk_url: str | None = None
    download_url: str | None = None
    app_type: str | None = None
    icon_url: str | None = None
    latest_version: str | None = None
    readme_html: str | None = None
    trust_score: TrustScoreOut | None = None
    risk_flags: list[RiskFlagOut] = []
    versions: list[VersionOut] = []


class SearchResult(BaseModel):
    tools: list[ToolOut]
    total: int
    query: str
    page: int
    per_page: int
