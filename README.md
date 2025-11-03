<div align="center">

# **InfoScope**
### *A Mini News Search Engine built on classic IR principles*  
*(HTML • CSS • JavaScript • TF-IDF • BM25)*  

</div>

---

## Overview
**InfoScope** is a lightweight search engine built for my **CIST433: Information Storage & Retrieval** final project.  
It demonstrates how search engines actually *think* — using techniques like tokenization, stopword removal, and term weighting — all applied to a curated dataset of 100 news article summaries.

> 💡 *The goal isn’t to compete with Google — it’s to show that I understand how Google works.*

---

## IR Features

| Concept | What It Does |
|:--|:--|
| **Tokenization** | Splits text into searchable words |
| **Stopword Removal** | Filters out common filler words like *the*, *is*, *of* |
| **Stemming** | Normalizes word forms (*running → run*) |
| **TF-IDF Model** | Classic term-weighting scheme measuring importance |
| **BM25-lite** | Modern ranking model balancing frequency & document length |
| **Field Boosts** | Prioritizes matches in titles and tags |
| **Boolean Logic** | Supports `AND`, `OR`, and quoted phrases |
| **Snippets & Highlights** | Shows keyword context in search results |

---

## Design Choices
- **Dark mode UI** with a clean, centered layout  
- Large search bar with *placeholder text* hints  
- Toggles for retrieval model and filters  
- “Recommended Articles” section under the search bar  

---

## Tech Stack
- **HTML5** → structure  
- **CSS3** → styling (dark theme, responsive layout)  
- **Vanilla JS** → indexing, ranking logic, and rendering results  
- **JSON Dataset** → ~100 curated news article summaries  

---

## Getting Started
```bash
# Clone the repo
git clone https://github.com/yourusername/InfoScope.git
cd InfoScope

# Open in browser
open index.html   # or drag into your browser
