import json
import random
from datetime import datetime, timedelta
from pathlib import Path

INPUT = Path("data/news.sample.json")
OUTPUT = Path("data/news.sample.json")  # overwrite

# Set your date range
start_date = datetime(2020, 1, 1)
end_date   = datetime(2024, 11, 1)

def random_date(start, end):
    delta = end - start
    random_days = random.randrange(delta.days)
    return start + timedelta(days=random_days)

with INPUT.open("r", encoding="utf-8") as f:
    articles = json.load(f)

for article in articles:
    dt = random_date(start_date, end_date)
    article["date"] = dt.strftime("%Y-%m-%d")   # standard format

with OUTPUT.open("w", encoding="utf-8") as f:
    json.dump(articles, f, indent=2, ensure_ascii=False)

print("🎉 Dates randomized successfully!")
