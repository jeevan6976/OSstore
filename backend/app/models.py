import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Tool(Base):
    __tablename__ = "tools"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: uuid.uuid4().hex)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    homepage: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    language: Mapped[str | None] = mapped_column(String(64), nullable=True)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    open_issues: Mapped[int] = mapped_column(Integer, default=0)
    watchers: Mapped[int] = mapped_column(Integer, default=0)
    license: Mapped[str | None] = mapped_column(String(128), nullable=True)
    topics: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string list
    source: Mapped[str] = mapped_column(String(32), default="github")  # github, fdroid
    owner_avatar: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_pushed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_commit_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    trust_score: Mapped["TrustScore | None"] = relationship(back_populates="tool", uselist=False, lazy="joined")
    risk_flags: Mapped[list["RiskFlag"]] = relationship(back_populates="tool", lazy="joined")


class TrustScore(Base):
    __tablename__ = "trust_scores"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: uuid.uuid4().hex)
    tool_id: Mapped[str] = mapped_column(String(64), ForeignKey("tools.id", ondelete="CASCADE"), unique=True)
    overall: Mapped[float] = mapped_column(Float, default=0.0)
    activity_score: Mapped[float] = mapped_column(Float, default=0.0)
    community_score: Mapped[float] = mapped_column(Float, default=0.0)
    maintenance_score: Mapped[float] = mapped_column(Float, default=0.0)
    popularity_score: Mapped[float] = mapped_column(Float, default=0.0)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tool: Mapped["Tool"] = relationship(back_populates="trust_score")


class RiskFlag(Base):
    __tablename__ = "risk_flags"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: uuid.uuid4().hex)
    tool_id: Mapped[str] = mapped_column(String(64), ForeignKey("tools.id", ondelete="CASCADE"))
    flag_type: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g. "no_license", "stale", "few_contributors"
    severity: Mapped[str] = mapped_column(String(16), default="medium")  # low, medium, high
    message: Mapped[str] = mapped_column(Text, nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tool: Mapped["Tool"] = relationship(back_populates="risk_flags")
