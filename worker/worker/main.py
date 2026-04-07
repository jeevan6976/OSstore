"""Main worker loop — fetches repos + F-Droid apps, computes scores, indexes to Meilisearch."""

import uuid
import time
import json
import traceback
from datetime import datetime, timezone

import meilisearch
import redis

from worker.config import get_settings
from worker.db import SessionLocal, Tool, TrustScore, RiskFlag, init_db
from worker.github_fetcher import search_github_repos, fetch_latest_release_apk
from worker.fdroid_fetcher import fetch_fdroid_index
from worker.trust import compute_trust_score, compute_risk_flags

settings = get_settings()

# GitHub search queries — tools, libraries, APIs
SEARCH_QUERIES = [
    "stars:>500 language:python",
    "stars:>500 language:javascript",
    "stars:>500 language:typescript",
    "stars:>500 language:rust",
    "stars:>500 language:go",
    "stars:>500 language:java",
    "stars:>500 language:kotlin",
    "stars:>500 language:c",
    "stars:>500 language:c++",
    "stars:>500 language:swift",
    "stars:>200 topic:cli",
    "stars:>200 topic:api",
    "stars:>200 topic:framework",
    "stars:>200 topic:library",
    "stars:>100 topic:privacy",
    "stars:>100 topic:open-source",
    "stars:>100 topic:self-hosted",
    "stars:>100 topic:security",
    "stars:>100 topic:devtools",
    "stars:>100 topic:database",
    "stars:>50 topic:linux",
    "stars:>50 topic:terminal",
]

# Android / mobile app queries — to find APKs on GitHub
ANDROID_QUERIES = [
    "stars:>100 topic:android",
    "stars:>100 topic:android-app",
    "stars:>50 topic:apk",
    "stars:>50 topic:fdroid",
    "stars:>100 topic:mobile-app",
    "stars:>50 topic:kotlin-android",
    "stars:>100 topic:material-design language:kotlin",
    "stars:>100 topic:material-design language:java",
    "stars:>50 topic:open-source-android",
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
        # App-store fields
        "package_name": tool.package_name or "",
        "apk_url": tool.apk_url or "",
        "download_url": tool.download_url or "",
        "app_type": tool.app_type or "tool",
        "icon_url": tool.icon_url or "",
        "latest_version": tool.latest_version or "",
    }
    meili.index("tools").add_documents([doc], primary_key="id")


def run_fetch_cycle():
    """One full fetch cycle: pull repos + F-Droid apps, score them, index them."""
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting fetch cycle...")
    session = SessionLocal()
    meili = get_meili_client()

    # Ensure Meili index exists with settings
    try:
        meili.index("tools").update_settings({
            "searchableAttributes": ["name", "full_name", "description", "language", "topics", "package_name"],
            "filterableAttributes": ["language", "source", "stars", "app_type"],
            "sortableAttributes": ["stars", "trust_overall", "updated_at"],
        })
    except Exception as e:
        print(f"[WARN] Meili settings update: {e}")

    total_processed = 0

    # ─── Phase 1: GitHub repos (tools + libraries) ───
    print("\n=== Phase 1: GitHub Tools & Libraries ===")
    for query in SEARCH_QUERIES:
        total_processed += _fetch_github_query(session, meili, query)
        time.sleep(2)

    # ─── Phase 2: GitHub Android apps (APK detection) ───
    print("\n=== Phase 2: GitHub Android Apps ===")
    for query in ANDROID_QUERIES:
        total_processed += _fetch_github_query(session, meili, query, check_apk=True)
        time.sleep(2)

    # ─── Phase 3: F-Droid apps ───
    print("\n=== Phase 3: F-Droid Apps ===")
    total_processed += _fetch_fdroid_apps(session, meili)

    session.close()
    print(f"[{datetime.now(timezone.utc).isoformat()}] Fetch cycle complete. Processed {total_processed} tools/apps.")


def _fetch_github_query(session, meili, query: str, check_apk: bool = False) -> int:
    """Fetch one GitHub query, upsert tools, optionally check for APK releases."""
    count = 0
    try:
        # Fetch multiple pages to get more results
        for page in range(1, 4):  # pages 1-3 = up to 90 results per query
            repos = search_github_repos(query=query, per_page=30, page=page)
            if not repos:
                break

            print(f"  Fetched {len(repos)} repos for query: {query} (page {page})")

            for repo_data in repos:
                try:
                    # If this is an Android query, check for APK in releases
                    if check_apk and repo_data.get("app_type") == "app":
                        apk_info = fetch_latest_release_apk(repo_data["full_name"])
                        if apk_info:
                            repo_data["apk_url"] = apk_info["apk_url"]
                            repo_data["download_url"] = apk_info["download_url"]
                            repo_data["latest_version"] = apk_info["latest_version"]
                            print(f"    Found APK: {repo_data['full_name']} → {apk_info['latest_version']}")
                        time.sleep(0.5)  # rate-limit releases API

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
                    count += 1

                except Exception as e:
                    session.rollback()
                    print(f"  [ERROR] Processing {repo_data.get('full_name')}: {e}")

            time.sleep(2)  # Between pages

    except Exception as e:
        print(f"  [ERROR] Query '{query}': {e}")
        traceback.print_exc()
        time.sleep(5)

    return count


def _fetch_fdroid_apps(session, meili) -> int:
    """Fetch F-Droid index and upsert all apps."""
    count = 0
    try:
        fdroid_apps = fetch_fdroid_index(limit=1000)
        print(f"  Fetched {len(fdroid_apps)} apps from F-Droid")

        for app_data in fdroid_apps:
            try:
                tool = upsert_tool(session, app_data)

                # F-Droid apps get a basic trust score based on available info
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
                count += 1

            except Exception as e:
                session.rollback()
                print(f"  [ERROR] F-Droid {app_data.get('full_name')}: {e}")

    except Exception as e:
        print(f"  [ERROR] F-Droid fetch: {e}")
        traceback.print_exc()

    return count


def main():
    print("=" * 60)
    print("  OS Store Worker — GitHub + F-Droid Fetcher")
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
