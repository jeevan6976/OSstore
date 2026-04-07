"""F-Droid fetcher — pulls apps from the F-Droid repository index."""

import httpx
import json
from datetime import datetime, timezone

FDROID_INDEX_URL = "https://f-droid.org/repo/index-v2.json"
FDROID_REPO_BASE = "https://f-droid.org/repo"
FDROID_PAGE_URL = "https://f-droid.org/packages"


def fetch_fdroid_index(limit: int = 500) -> list[dict]:
    """
    Fetch the F-Droid index-v2.json and return normalised tool dicts.
    The index is ~30 MB, so we stream it.
    """
    print(f"[F-Droid] Downloading index from {FDROID_INDEX_URL} …")

    try:
        resp = httpx.get(FDROID_INDEX_URL, timeout=120, follow_redirects=True)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[F-Droid] Failed to download index: {e}")
        # Fallback: try the v1 index which is smaller
        return _fetch_fdroid_v1(limit)

    packages = data.get("packages", {})
    print(f"[F-Droid] Index contains {len(packages)} packages")

    apps: list[dict] = []
    count = 0

    for package_name, pkg_data in packages.items():
        if count >= limit:
            break

        try:
            metadata = pkg_data.get("metadata", {})
            versions = pkg_data.get("versions", {})

            name_dict = metadata.get("name", {})
            name = name_dict.get("en-US", name_dict.get("en", ""))
            if not name:
                # Try to get a name from any locale
                name = next(iter(name_dict.values()), package_name.split(".")[-1])

            desc_dict = metadata.get("description", {})
            description = desc_dict.get("en-US", desc_dict.get("en", ""))
            if not description:
                summary_dict = metadata.get("summary", {})
                description = summary_dict.get("en-US", summary_dict.get("en", ""))

            # Get latest version info
            latest_version_code = None
            latest_version_name = ""
            apk_name = ""

            if versions:
                # versions is a dict of versionCode -> versionInfo
                sorted_versions = sorted(versions.items(), key=lambda x: x[0], reverse=True)
                if sorted_versions:
                    vc, version_info = sorted_versions[0]
                    latest_version_code = vc
                    manifest = version_info.get("manifest", {})
                    latest_version_name = manifest.get("versionName", "")
                    file_info = version_info.get("file", {})
                    apk_name = file_info.get("name", "")

            # Build APK download URL
            apk_url = f"{FDROID_REPO_BASE}/{apk_name}" if apk_name else ""

            # Icon URL
            icon_dict = metadata.get("icon", {})
            icon_name = ""
            if icon_dict:
                icon_locale = icon_dict.get("en-US", icon_dict.get("en", {}))
                if isinstance(icon_locale, dict):
                    icon_name = icon_locale.get("name", "")
                elif isinstance(icon_locale, str):
                    icon_name = icon_locale
            icon_url = f"{FDROID_REPO_BASE}/{package_name}/{icon_name}" if icon_name else ""

            # License
            license_name = metadata.get("license", "")

            # Source code URL
            source_url = metadata.get("sourceCode", "")

            # Categories as topics
            categories = metadata.get("categories", [])

            # Added / last updated timestamps
            added_ts = metadata.get("added", 0)
            last_updated_ts = metadata.get("lastUpdated", 0)

            created_at = (
                datetime.fromtimestamp(added_ts / 1000, tz=timezone.utc)
                if added_ts else datetime.now(timezone.utc)
            )
            updated_at = (
                datetime.fromtimestamp(last_updated_ts / 1000, tz=timezone.utc)
                if last_updated_ts else datetime.now(timezone.utc)
            )

            app = {
                "name": name or package_name.split(".")[-1],
                "full_name": f"fdroid/{package_name}",
                "description": description[:2000] if description else "",
                "url": f"{FDROID_PAGE_URL}/{package_name}",
                "homepage": metadata.get("webSite", ""),
                "language": "Android",
                "stars": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "license": license_name,
                "topics": json.dumps(categories) if categories else "[]",
                "source": "fdroid",
                "owner_avatar": icon_url,
                "last_pushed_at": updated_at,
                "last_commit_at": updated_at,
                "created_at": created_at,
                "updated_at": updated_at,
                # App-store fields
                "package_name": package_name,
                "apk_url": apk_url,
                "download_url": f"{FDROID_PAGE_URL}/{package_name}",
                "app_type": "app",
                "icon_url": icon_url,
                "latest_version": latest_version_name,
            }

            apps.append(app)
            count += 1

        except Exception as e:
            print(f"[F-Droid] Error processing {package_name}: {e}")
            continue

    print(f"[F-Droid] Processed {len(apps)} apps")
    return apps


def _fetch_fdroid_v1(limit: int = 500) -> list[dict]:
    """Fallback: fetch from F-Droid v1 index (JSON array format)."""
    V1_URL = "https://f-droid.org/repo/index-v1.json"
    print(f"[F-Droid] Trying v1 index from {V1_URL} …")

    try:
        resp = httpx.get(V1_URL, timeout=120, follow_redirects=True)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[F-Droid] v1 index also failed: {e}")
        return []

    raw_apps = data.get("apps", [])
    raw_packages = data.get("packages", {})
    print(f"[F-Droid v1] Index contains {len(raw_apps)} apps")

    apps: list[dict] = []

    for app_info in raw_apps[:limit]:
        try:
            package_name = app_info.get("packageName", "")
            if not package_name:
                continue

            name = app_info.get("name", "") or app_info.get("localized", {}).get("en-US", {}).get("name", package_name)
            description = (
                app_info.get("summary", "")
                or app_info.get("localized", {}).get("en-US", {}).get("summary", "")
            )

            # Latest package/version
            pkg_versions = raw_packages.get(package_name, [])
            latest_version = ""
            apk_name = ""
            if pkg_versions:
                latest = pkg_versions[0]  # already sorted desc
                latest_version = latest.get("versionName", "")
                apk_name = latest.get("apkName", "")

            apk_url = f"{FDROID_REPO_BASE}/{apk_name}" if apk_name else ""
            icon_name = app_info.get("icon", "")
            icon_url = f"{FDROID_REPO_BASE}/icons-640/{icon_name}" if icon_name else ""

            categories = app_info.get("categories", [])
            license_name = app_info.get("license", "")

            added_ts = app_info.get("added", 0)
            last_updated_ts = app_info.get("lastUpdated", 0)

            created_at = (
                datetime.fromtimestamp(added_ts / 1000, tz=timezone.utc)
                if added_ts and added_ts > 1000000
                else datetime.now(timezone.utc)
            )
            updated_at = (
                datetime.fromtimestamp(last_updated_ts / 1000, tz=timezone.utc)
                if last_updated_ts and last_updated_ts > 1000000
                else datetime.now(timezone.utc)
            )

            app = {
                "name": name or package_name.split(".")[-1],
                "full_name": f"fdroid/{package_name}",
                "description": str(description)[:2000] if description else "",
                "url": f"{FDROID_PAGE_URL}/{package_name}",
                "homepage": app_info.get("webSite", ""),
                "language": "Android",
                "stars": 0,
                "forks": 0,
                "open_issues": 0,
                "watchers": 0,
                "license": license_name,
                "topics": json.dumps(categories) if categories else "[]",
                "source": "fdroid",
                "owner_avatar": icon_url,
                "last_pushed_at": updated_at,
                "last_commit_at": updated_at,
                "created_at": created_at,
                "updated_at": updated_at,
                "package_name": package_name,
                "apk_url": apk_url,
                "download_url": f"{FDROID_PAGE_URL}/{package_name}",
                "app_type": "app",
                "icon_url": icon_url,
                "latest_version": latest_version,
            }

            apps.append(app)

        except Exception as e:
            print(f"[F-Droid v1] Error processing app: {e}")
            continue

    print(f"[F-Droid v1] Processed {len(apps)} apps")
    return apps
