import json
from pathlib import Path

# --- Paths (run this from your project root) ---
INPUT_PATH = Path("data/news.sample.json")
OUTPUT_PATH = Path("data/news.sample.tagged.json")

# --- Tag categories + trigger keywords ---
TAG_RULES = {
    "tech": [
        "tech", "technology", "ai", "artificial intelligence",
        "software", "digital", "semiconductor", "chip",
        "cybersecurity", "cloud"
    ],
    "climate": [
        "climate", "emissions", "carbon", "co2",
        "environment", "sustainability", "renewable",
        "solar", "wind", "net-zero"
    ],
    "policy": [
        "policy", "bill", "regulation", "regulatory",
        "federal", "law", "legislation", "congress",
        "government", "mandate"
    ],
    "economy": [
        "economy", "economic", "market", "inflation",
        "supply chain", "trade", "growth", "recession",
        "industry", "production"
    ],
    "science": [
        "research", "study", "scientist", "laboratory",
        "experiment", "peer-reviewed", "findings"
    ],
    "transit": [
        "transit", "transportation", "subway", "rail",
        "bus", "infrastructure", "traffic", "mobility",
        "commute"
    ],
    "data": [
        "data", "analytics", "dashboard", "open data",
        "dataset", "metrics", "algorithm"
    ],
    "health": [
        "health", "healthcare", "hospital", "medical",
        "public health", "epidemic", "pandemic"
    ],
    "education": [
        "school", "university", "college", "education",
        "classroom", "students", "curriculum"
    ],
}


def infer_tags_from_text(text: str) -> set[str]:
    """
    Given a big text string, return a set of tag names
    whose trigger words appear in the text.
    """
    text_lower = text.lower()
    matched_tags: set[str] = set()

    for tag_name, triggers in TAG_RULES.items():
        for keyword in triggers:
            if keyword in text_lower:
                matched_tags.add(tag_name)
                break  # no need to check more triggers for this tag

    return matched_tags


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_PATH}")

    with INPUT_PATH.open("r", encoding="utf-8") as f:
        articles = json.load(f)

    updated_count = 0

    for article in articles:
        title = article.get("title", "")
        abstract = article.get("abstract", "")
        source = article.get("source", "")
        existing_tags = article.get("tags", [])

        # Build one big text blob to search in
        combined_text = " ".join([
            title,
            abstract,
            " ".join(existing_tags),
            source,
        ])

        auto_tags = infer_tags_from_text(combined_text)

        # Merge existing tags + new auto tags, keep unique
        all_tags = list(dict.fromkeys(list(existing_tags) + sorted(auto_tags)))

        if set(all_tags) != set(existing_tags):
            updated_count += 1

        # --- If the article still has 3 or fewer tags, add extra fallback tags ---
        if len(all_tags) <= 3:
            fallback_tags = ["general", "news", "current-events", "world", "analysis"]

            # Add missing fallback tags until we reach ~5 total
            for tag in fallback_tags:
                if len(all_tags) >= 5:
                    break
                all_tags.append(tag)

        article["tags"] = all_tags

    # Write out to a new file so we don't destroy the original
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"Processed {len(articles)} articles.")
    print(f"Updated tags for {updated_count} articles.")
    print(f"Saved updated dataset to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
