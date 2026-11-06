"""Download publicly available Stonestorm static art listed in manifest.json."""
import argparse
import csv
import json
import pathlib
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
BASE_URL = "https://stonestorm.gg/art"


def main():
    parser = argparse.ArgumentParser(description="Public Stonestorm image manifest downloader")
    parser.add_argument("--category", help="Example: weapons, icons, pets")
    parser.add_argument("--all", action="store_true", help="Try all available categories")
    parser.add_argument("--delay", type=float, default=0.5, help="Seconds between downloads (default: 0.5)")
    args = parser.parse_args()
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    categories = {k: v for k, v in manifest.items() if isinstance(v, list)}
    if not args.all and args.category not in categories:
        parser.error("Choose --all or --category from: " + ", ".join(categories))
    if args.delay < 0.25:
        parser.error("Minimum delay is 0.25 seconds")
    chosen = categories if args.all else {args.category: categories[args.category]}
    rows = []
    failures = 0
    blocked = False
    for category, names in chosen.items():
        target = ROOT / "downloaded" / category
        target.mkdir(parents=True, exist_ok=True)
        for name in names:
            if not isinstance(name, str) or not name or "/" in name or "\\" in name or name in (".", ".."):
                continue
            url = f"{BASE_URL}/{category}/{name}.webp"
            dest = target / f"{name}.webp"
            if dest.exists() and dest.stat().st_size:
                status = "already_exists"
            else:
                req = urllib.request.Request(url, headers={"User-Agent": "StonestormAtlasResearch/1.0"})
                try:
                    with urllib.request.urlopen(req, timeout=20) as response:
                        data = response.read(10 * 1024 * 1024 + 1)
                        if len(data) > 10 * 1024 * 1024 or not data.startswith(b"RIFF") or data[8:12] != b"WEBP":
                            raise ValueError("Unexpected response: not a WebP image or too large")
                        dest.write_bytes(data)
                    status = "downloaded"
                except urllib.error.HTTPError as exc:
                    status = f"HTTP_{exc.code}"
                    failures += 1
                    if exc.code in (403, 429):
                        blocked = True
                except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
                    status = type(exc).__name__
                    failures += 1
                time.sleep(args.delay)
            rows.append((category, name, url, status))
            print(f"{category}/{name}: {status}")
            if blocked:
                print("Server restricted requests; stopping immediately.")
                break
        if blocked:
            break
    with (ROOT / "results.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(("category", "name", "url", "status"))
        writer.writerows(rows)
    print(f"Finished: {len(rows)} checked, {failures} failures. See results.csv")


if __name__ == "__main__":
    main()
