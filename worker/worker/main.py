"""Main worker loop — fetches repos, computes scores, indexes to Meilisearch."""

import uuid
import time
import json
import traceback
from datetime import datetime, timezone

import meilisearch
import redis

from worker.config import get_settings
from worker.db import SessionLocal, Tool, TrustScore, RiskFlag, init_db
from worker.github_fetcher import search_github_repos
from worker.trust import compute_trust_score, compute_risk_flags

settings = get_settings()

SEARCH_QUERIES = [
    "stars:>500 language:python",
    "stars:>500 language:javascript",
    "stars:>500 language:typescript",
    "stars:>500 language:rust",
    "stars:>500 language:go",
    "stars:>200 topic:cli",
    "stars:>200 topic:api",
    "stars:>200 topic:framework",
    "stars:>200 topic:library",
    "stars:>100 topic:privacy",
    "stars:>100 topic:open-source",
    "stars:>100 topic:self-hosted",
]


def get_meili_client() -> meilisearch.Client:
    return meilisearch.Client(settings.MEILI_URL, settings.MEILI_MASTER_KEY)


def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_URL)


def upsert_tool(session, tool_data: dict) -> Tool:
    """Insert or update a tool in the database."""
    existing = session.query(Tool).filter_by(full_name=tool_data["full_name"]).first()

    if existing:
        for key, val in tool_data.items():
            if key != "id":
                setattr(existing, key, val)
        existing.updated_at = datetime.now(timezone.utc)
        session.flush()
        return existing
    else:
        tool = Tool(id=uuid.uuid4().hex, **tool_data)
        session.add(tool)
        session.flush()
        return tool


def upsert_trust_score(session, tool: Tool, scores: dict):
    """Insert or update trust score."""
    existing = session.query(TrustScore).filter_by(tool_id=tool.id).first()
    if existing:
        for key, val in scores.items():
            setattr(existing, key, val)
        existing.computed_at = datetime.now(timezone.utc)
    else:
        ts = TrustScore(id=uuid.uuid4().hex, tool_id=tool.id, computed_at=datetime.now(timezone.utc), **scores)
        session.add(ts)


def replace_risk_flags(session, tool: Tool, flags: list[dict]):
    """Replace all risk flags for a tool."""
    session.query(RiskFlag).filter_by(tool_id=tool.id).delete()
    for flag in flags:
        rf = RiskFlag(id=uuid.uuid4().hex, tool_id=tool.id, detected_at=datetime.now(timezone.utc), **flag)
        session.add(rf)


def index_tool_to_meili(meili: meilisearch.Client, tool: Tool, scores: dict):
    """Index a tool document to Meilisearch."""
    doc = {
        "id": tool.id,
        "name": tool.name,
        "full_name": tool.full_name,
        "description": tool.description or "",
        "url": tool.url,
        "language": tool.language or "",
        "stars": tool.stars,
        "forks": tool.forks,
        "source": tool.source,
        "topics": tool.topics or "[]",
        "owner_avatar": tool.owner_avatar or "",
        "trust_overall": scores.get("overall", 0),
        "updated_at": tool.updated_at.isoformat() if tool.updated_at else "",
    }
    meili.index("tools").add_documents([doc], primary_key="id")


def run_fetch_cycle():
    """One full fetch cycle: pull repos, score them, index them."""
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting fetch cycle...")
    session = SessionLocal()
    meili = get_meili_client()

    # Ensure Meili index exists with settings
    try:
        meili.index("tools").update_settings({
            "searchableAttributes": ["name", "full_name", "description", "language", "topics"],
            "filterableAttributes": ["language", "source", "stars"],
            "sortableAttributes": ["stars", "trust_overall", "updated_at"],
        })
    except Exception as e:
        print(f"[WARN] Meili settings update: {e}")

    total_processed = 0

    for query in SEARCH_QUERIES:
        try:
            repos = search_github_repos(query=query, per_page=30, page=1)
            print(f"  Fetched {len(repos)} repos for query: {query}")

            for repo_data in repos:
                try:
                    tool = upsert_tool(session, repo_data)

                    scores = compute_trust_score(
                        stars=tool.stars,
                        forks=tool.forks,
                        watchers=tool.watchers,
                        open_issues=tool.open_issues,
                        last_pushed_at=tool.last_pushed_at,
                        last_commit_at=tool.last_commit_at,
                    )
                    upsert_trust_score(session, tool, scores)

                    flags = compute_risk_flags(
                        stars=tool.stars,
                        forks=tool.forks,
                        open_issues=tool.open_issues,
                        license_name=tool.license,
                        last_pushed_at=tool.last_pushed_at,
                    )
                    replace_risk_flags(session, tool, flags)

                    session.commit()

                    index_tool_to_meili(meili, tool, scores)
                    total_processed += 1

                except Exception as e:
                    session.rollback()
                    print(f"  [ERROR] Processing {repo_data.get('full_name')}: {e}")

            # Be kind to GitHub API
            time.sleep(2)

        except Exception as e:
            print(f"  [ERROR] Query '{query}': {e}")
            traceback.print_exc()
            time.sleep(5)

    session.close()
    print(f"[{datetime.now(timezone.utc).isoformat()}] Fetch cycle complete. Processed {total_processed} tools.")


def main():
    print("=" * 60)
    print("  OS Store Worker — GitHub Repository Fetcher")
    print("=" * 60)

    init_db()

    # Run an initial cycle immediately
    run_fetch_cycle()

    # Then loop every 6 hours
    interval = 6 * 60 * 60  # 6 hours
    while True:
        print(f"\nSleeping for {interval // 3600} hours...")
        time.sleep(interval)
        run_fetch_cycle()


if __name__ == "__main__":
    main()
