from sqlalchemy import create_engine, Column, String, Text, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker, relationship
from worker.config import get_settings

settings = get_settings()

engine = create_engine(settings.sync_database_url, pool_size=10, max_overflow=5)
SessionLocal = sessionmaker(bind=engine, class_=Session)


class Base(DeclarativeBase):
    pass


class Tool(Base):
    __tablename__ = "tools"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    full_name = Column(String(512), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    url = Column(String(1024), nullable=False)
    homepage = Column(String(1024), nullable=True)
    language = Column(String(64), nullable=True)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    watchers = Column(Integer, default=0)
    license = Column(String(128), nullable=True)
    topics = Column(Text, nullable=True)
    source = Column(String(32), default="github")
    owner_avatar = Column(String(1024), nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    last_pushed_at = Column(DateTime, nullable=True)
    last_commit_at = Column(DateTime, nullable=True)

    trust_score = relationship("TrustScore", back_populates="tool", uselist=False)
    risk_flags = relationship("RiskFlag", back_populates="tool")


class TrustScore(Base):
    __tablename__ = "trust_scores"

    id = Column(String(64), primary_key=True)
    tool_id = Column(String(64), ForeignKey("tools.id", ondelete="CASCADE"), unique=True)
    overall = Column(Float, default=0.0)
    activity_score = Column(Float, default=0.0)
    community_score = Column(Float, default=0.0)
    maintenance_score = Column(Float, default=0.0)
    popularity_score = Column(Float, default=0.0)
    computed_at = Column(DateTime)

    tool = relationship("Tool", back_populates="trust_score")


class RiskFlag(Base):
    __tablename__ = "risk_flags"

    id = Column(String(64), primary_key=True)
    tool_id = Column(String(64), ForeignKey("tools.id", ondelete="CASCADE"))
    flag_type = Column(String(64), nullable=False)
    severity = Column(String(16), default="medium")
    message = Column(Text, nullable=False)
    detected_at = Column(DateTime)

    tool = relationship("Tool", back_populates="risk_flags")


def init_db():
    Base.metadata.create_all(bind=engine)
