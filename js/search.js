// js/search.js

const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const queryInput = document.getElementById("query");
const resultsDiv = document.getElementById("results");
const statsDiv = document.getElementById("stats");

let dataset = [];

// Load dataset
async function loadDataset() {
  const res = await fetch("data/news.sample.json");
  dataset = await res.json();
}

// Basic keyword search
function searchArticles(query) {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

  const results = dataset.filter(article => {
    const content = `${article.title} ${article.abstract} ${article.tags} ${article.source}`.toLowerCase();
    return keywords.every(kw => content.includes(kw));
  });

  return results;
}

// Display results
function renderResults(results, query) {
  resultsDiv.innerHTML = "";
  statsDiv.innerHTML = `<p>${results.length} results found for "<strong>${query}</strong>"</p>`;

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No articles found.</p>";
    return;
  }

  results.forEach(article => {
    const el = document.createElement("div");
    el.classList.add("card");
    el.innerHTML = `
      <h3><a href="article.html?id=${article.id}">${article.title}</a></h3>
      <p><em>${article.date}</em> • ${article.source}</p>
      <p>${article.abstract}</p>
      <div class="tags">${article.tags.map(t => `<span class="badge">${t}</span>`).join('')}</div>
    `;
    resultsDiv.appendChild(el);
  });
}

// Button listeners
searchBtn.addEventListener("click", () => {
  const query = queryInput.value.trim();
  if (!query) return;
  const results = searchArticles(query);
  renderResults(results, query);
});

resetBtn.addEventListener("click", () => {
  queryInput.value = "";
  resultsDiv.innerHTML = "";
  statsDiv.innerHTML = "";
});

// Initialize
loadDataset();
