const searchBtn = document.getElementById("searchBtn");
const resetBtn  = document.getElementById("resetBtn");
const queryInput = document.getElementById("query");
const resultsDiv = document.getElementById("results");
const statsDiv   = document.getElementById("stats");

let dataset = []; // all the articles
let DF = {};   // document frequencies
let N = 0; // the number of articles

// This Fetches the JSON file containing all articles, stores them in a dataset, and counts how many times each word appears across the full dataset (that’s what computeDF() does)
async function loadDataset() {
  const res = await fetch("data/news.sample.json");
  dataset = await res.json();
  N = dataset.length;
  computeDF();
}
// This makes everything lowercase, chops text into pieces, and removes tiny words like “a”, “is”, “to”
function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t && t.length > 2);
}
// this scans every article once and creates a dictionary like 
// word    |    # of articles containing it
// ---------------------------------------
// climate |   43
// ai      |   28
// chip    |   12
// this is how the engine decides what's rare and what's common 
// rare = more important
// common = less important
function computeDF() {
  const df = {};
  dataset.forEach(article => {
    const text = tokenize(
      article.title + " " +
      article.abstract + " " +
      article.tags.join(" ")
    );
    const seen = new Set(text);
    seen.forEach(t => df[t] = (df[t] || 0) + 1);
  });
  DF = df;
}


// This is a small built-in thesaurus, basically to make the search have a larger reach
const SYNONYMS = {
  tech: ["tech", "technology", "ai", "semiconductor", "digital", "innovation"],
  semiconductor: ["semiconductor", "chip", "supply chain"],
  climate: ["climate", "emissions", "carbon", "environment"],
  policy: ["policy", "regulation", "law", "bill", "legislation"],
  transit: ["transit", "transportation", "infrastructure"]
};

function expand(term) {
  return SYNONYMS[term.toLowerCase()] || [term.toLowerCase()];
}


// Parse Query (Phrases, Tokens, AND/OR)
// This detects quoted phrases, removes AND / OR words if typed, and expands synonyms
// and returns all phrases, search terms, and which mode the user is using
function parseQuery(query) {
  let raw = query.trim();

  const phrases = [...raw.matchAll(/"([^"]+)"/g)].map(m => m[1].toLowerCase());
  raw = raw.replace(/"([^"]+)"/g, "");

  let tokens = raw.split(/\s+/).filter(Boolean).map(t => t.toLowerCase());

  let mode = "OR";
  if (tokens.includes("and")) mode = "AND";

  tokens = tokens.filter(t => t !== "and" && t !== "or");

  let expanded = [];
  tokens.forEach(t => expanded.push(...expand(t)));

  return { phrases, expanded, mode };
}


// TF-IDF Scoring
// Checks how many times a search term appears in an article and then gives more points if the word is rare
// it then adds up all the points
function tfidfScore(article, terms) {
  const words = tokenize(
    article.title + " " +
    article.abstract + " " +
    article.tags.join(" ")
  );

  const tf = {};
  words.forEach(t => tf[t] = (tf[t] || 0) + 1);

  let score = 0;

  terms.forEach(term => {
    if (!DF[term]) return;
    const termTF = tf[term] || 0;
    const idf = Math.log(N / (1 + DF[term]));
    score += termTF * idf;
  });

  return score;
}


// BM25-lite Scoring
function bm25Score(article, terms) {
  const words = tokenize(
    article.title + " " +
    article.abstract + " " +
    article.tags.join(" ")
  );

  const tf = {};
  words.forEach(t => tf[t] = (tf[t] || 0) + 1);

  let score = 0;

  terms.forEach(term => {
    if (!DF[term]) return;

    const termTF = tf[term] || 0;
    const idf = Math.log((N - DF[term] + 0.5) / (DF[term] + 0.5) + 1);

    score += (termTF / (termTF + 1.5)) * idf;
  });

  return score;
}

// FIELD BOOSTS (Multiplicative)
function applyFieldBoosts(article, term, baseScore) {
  let boost = 1;

  const title = article.title.toLowerCase();
  const abstract = article.abstract.toLowerCase();
  const tags = article.tags.join(" ").toLowerCase();

  if (title.includes(term)) boost *= 3.0;    // BIG boost (title)
  if (tags.includes(term)) boost *= 1.8;     // medium boost (tags)
  if (abstract.includes(term)) boost *= 1.2; // small boost (abstract)

  return baseScore * boost;
}


// Main Search Logic
function searchArticles(query) {
  const t0 = performance.now();

  const model = document.querySelector('input[name="model"]:checked').value;
  const useBoosts = document.getElementById("fieldBoosts").checked;

  const { phrases, expanded, mode } = parseQuery(query);

  let results = [];

  dataset.forEach(article => {
    const text = (
      article.title +
      " " +
      article.abstract +
      " " +
      article.tags.join(" ")
    ).toLowerCase();

    // must match all phrases
    const phrasePass = phrases.every(p => text.includes(p));

    // AND/OR logic
    const termMatches = expanded.map(t => text.includes(t));
    const termPass =
      mode === "AND"
        ? termMatches.every(Boolean)
        : termMatches.some(Boolean);

    if (!phrasePass || !termPass) return;

    // BASE SCORE (TF-IDF or BM25)
    let score =
      model === "tfidf"
        ? tfidfScore(article, expanded)
        : bm25Score(article, expanded);

    // APPLY FIELD BOOSTS
    if (useBoosts) {
      expanded.forEach(term => {
        score = applyFieldBoosts(article, term, score);
      });
    }

    results.push({ article, score });
  });

  results.sort((a, b) => b.score - a.score);

  const list = results.map(r => r.article);
  const timeMs = (performance.now() - t0).toFixed(1);

  return { list, timeMs };
}


// Rendering
function renderResults(list, query, time) {
  resultsDiv.innerHTML = "";
  statsDiv.innerHTML = `<p>${list.length} results in ${time} ms for "<strong>${query}</strong>"</p>`;

  if (list.length === 0) {
    resultsDiv.innerHTML = "<p>No articles found.</p>";
    return;
  }

  list.forEach(article => {
    const el = document.createElement("div");
    el.classList.add("card");

    el.innerHTML = `
      <h3><a href="article.html?id=${article.id}">${article.title}</a></h3>
      <p><em>${article.date}</em> • ${article.source}</p>
      <p>${article.abstract}</p>
      <div class="tags">
        ${article.tags.map(t => `<span class="badge">${t}</span>`).join("")}
      </div>
    `;

    resultsDiv.appendChild(el);
  });
}


// Button Listeners
searchBtn.addEventListener("click", () => {
  const query = queryInput.value.trim();
  if (!query) return;

  const { list, timeMs } = searchArticles(query);
  renderResults(list, query, timeMs);
});

resetBtn.addEventListener("click", () => {
  queryInput.value = "";
  resultsDiv.innerHTML = "";
  statsDiv.innerHTML = "";
});

loadDataset();
