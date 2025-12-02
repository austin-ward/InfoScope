import json
import time
import os
from pathlib import Path
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

INPUT_PATH = Path("data/news.sample.json")
OUTPUT_PATH = Path("data/news.sample.expanded.json")

PROMPT_TEMPLATE = """
Expand the following news abstract into a single, concise paragraph (60–90 words).
Keep it factual, neutral, and tied to the topic. Avoid made-up numbers.

TITLE: {title}
ABSTRACT: {abstract}
TAGS: {tags}

Write a one-paragraph expanded summary:
"""

def safe_expand_article(prompt):
    max_retries = 6
    for i in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You write concise factual news summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=180,     
                temperature=0.4,
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            if "429" in str(e):
                wait = 2 + i * 2
                print(f" Rate limit hit. Waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f" Error: {e}")
                time.sleep(2)
    return None


def main():
    print("Loading dataset...")

    with INPUT_PATH.open("r", encoding="utf-8") as f:
        articles = json.load(f)

    total = len(articles)
    print(f"Found {total} articles.\n")

    expanded_articles = []

    for i, article in enumerate(articles):
        print(f"--- [{i+1}/{total}] Expanding ID {article['id']} ---")

        prompt = PROMPT_TEMPLATE.format(
            title=article["title"],
            abstract=article["abstract"],
            tags=", ".join(article.get("tags", []))
        )

        full_text = safe_expand_article(prompt)

        if full_text:
            article["full_text"] = full_text
        else:
            article["full_text"] = "Expansion failed."

        expanded_articles.append(article)
        
        time.sleep(0.7)

    print("\nSaving...")
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(expanded_articles, f, indent=2, ensure_ascii=False)

    print("🎉 DONE! Saved to:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
