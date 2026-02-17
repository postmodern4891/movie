const form = document.getElementById('searchForm');
const titleInput = document.getElementById('titleInput');
const statusBox = document.getElementById('status');
const resultBox = document.getElementById('result');

function renderMovie(data) {
  resultBox.innerHTML = `
    <img class="poster" src="${data.poster || ''}" alt="${data.title} 포스터" onerror="this.style.display='none'" />
    <div class="meta">
      <h2>${data.title} (${data.year})</h2>
      <p>${data.genre || ''}</p>
      <div class="grid">
        <div class="card">
          <div class="label">IMDb</div>
          <div class="value">${data.imdbRating}</div>
        </div>
        <div class="card">
          <div class="label">Metacritic</div>
          <div class="value">${data.metacritic}</div>
        </div>
        <div class="card">
          <div class="label">Rotten Tomatoes</div>
          <div class="value">${data.rottenTomatoes}</div>
        </div>
        <div class="card">
          <div class="label">Rotten Audience</div>
          <div class="value">${data.rottenAudience || 'N/A'}</div>
        </div>
      </div>
      <p>${data.plot || ''}</p>
    </div>
  `;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  if (!title) return;

  statusBox.textContent = '검색 중...';
  resultBox.classList.add('hidden');

  try {
    const res = await fetch(`/api/search?title=${encodeURIComponent(title)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || '검색 실패');
    }

    renderMovie(data);
    resultBox.classList.remove('hidden');
    statusBox.textContent = '';
  } catch (err) {
    statusBox.textContent = err.message;
  }
});
