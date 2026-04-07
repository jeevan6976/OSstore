import meilisearch
from app.config import get_settings

settings = get_settings()

_client: meilisearch.Client | None = None


def get_meili_client() -> meilisearch.Client:
    global _client
    if _client is None:
        _client = meilisearch.Client(settings.MEILI_URL, settings.MEILI_MASTER_KEY)
    return _client


def init_meili_index():
    client = get_meili_client()
    index = client.index("tools")
    index.update_settings({
        "searchableAttributes": ["name", "full_name", "description", "language", "topics", "package_name"],
        "filterableAttributes": ["language", "source", "stars", "app_type"],
        "sortableAttributes": ["stars", "trust_overall", "updated_at"],
        "rankingRules": [
            "words", "typo", "proximity", "attribute", "sort", "exactness",
            "stars:desc", "trust_overall:desc"
        ]
    })
    return index


def index_tool(tool_dict: dict):
    client = get_meili_client()
    index = client.index("tools")
    index.add_documents([tool_dict], primary_key="id")


def search_tools(query: str, page: int = 1, per_page: int = 20, language: str | None = None, filters: list[str] | None = None):
    client = get_meili_client()
    index = client.index("tools")

    all_filters = list(filters) if filters else []
    if language and not any("language" in f for f in all_filters):
        all_filters.append(f'language = "{language}"')

    result = index.search(
        query,
        {
            "limit": per_page,
            "offset": (page - 1) * per_page,
            "filter": " AND ".join(all_filters) if all_filters else None,
        }
    )
    return result
