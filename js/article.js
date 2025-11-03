// article.js
async function loadArticle() {
  const params = new URLSearchParams(window.location.search);
  const articleId = parseInt(params.get("id"));
  const container = document.getElementById("article-container");

  try {
    const res = await fetch("data/news.sample.json");
    const data = await res.json();
    const article = data.find(a => a.id === articleId);

    if (!article) {
      container.innerHTML = `<div class="card"><h2>Article Not Found</h2><p>This article may have been removed or is missing from the dataset.</p></div>`;
      return;
    }

    container.innerHTML = `
      <article class="card article-view">
        <h2 class="title">${article.title}</h2>
        <p class="meta">${article.date} • <span class="badge">${article.source}</span></p>
        <p class="abstract">${article.abstract}</p>
        <div class="tags">${article.tags.map(tag => `<span class="badge">${tag}</span>`).join('')}</div>
      </article>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card error">Error loading article: ${err.message}</div>`;
  }
}

loadArticle();
