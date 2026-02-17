const form = document.getElementById('searchForm');
const titleInput = document.getElementById('titleInput');
const statusBox = document.getElementById('status');
const resultBox = document.getElementById('result');
const suggestionsBox = document.getElementById('suggestions');

let debounceTimer;
let currentSuggestionRequestId = 0;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderOtt(ott) {
  if (!ott) return '';

  if (!ott.supported) {
    return `
      <div class="ott-box">
        <h3>한국 OTT</h3>
        <p class="ott-message">${escapeHtml(ott.message || 'OTT 정보를 표시할 수 없습니다.')}</p>
      </div>
    `;
  }

  const category = (label, items) => {
    if (!items || !items.length) return '';
    return `
      <div class="ott-row">
        <div class="ott-label">${label}</div>
        <div class="ott-list">${items.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')}</div>
      </div>
    `;
  };

  const content = [category('구독', ott.flatrate), category('대여', ott.rent), category('구매', ott.buy)].join('');

  const fallback = !content
    ? `<p class="ott-message">${escapeHtml(ott.message || '한국 기준 OTT 제공 정보가 없습니다.')}</p>`
    : '';

  const link = ott.link
    ? `<a class="ott-link" href="${escapeHtml(ott.link)}" target="_blank" rel="noreferrer">상세 링크</a>`
    : '';

  return `
    <div class="ott-box">
      <h3>한국 OTT</h3>
      ${content}
      ${fallback}
      ${link}
    </div>
  `;
}

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
      ${renderOtt(data.ott)}
    </div>
  `;
}

function hideSuggestions() {
  suggestionsBox.classList.add('hidden');
  suggestionsBox.innerHTML = '';
}

function showSuggestions(items) {
  if (!items.length) {
    hideSuggestions();
    return;
  }

  suggestionsBox.innerHTML = items
    .map(
      (item) =>
        `<li><button type="button" class="suggestion-btn" data-title="${escapeHtml(item.title)}">${escapeHtml(item.title)} <span>(${escapeHtml(item.year)})</span></button></li>`
    )
    .join('');
  suggestionsBox.classList.remove('hidden');
}

async function fetchSuggestions(query) {
  const requestId = ++currentSuggestionRequestId;

  try {
    const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (requestId !== currentSuggestionRequestId) return;

    if (!res.ok) {
      hideSuggestions();
      return;
    }

    showSuggestions(data.suggestions || []);
  } catch (error) {
    hideSuggestions();
  }
}

titleInput.addEventListener('input', () => {
  const query = titleInput.value.trim();
  clearTimeout(debounceTimer);

  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions(query);
  }, 220);
});

suggestionsBox.addEventListener('click', (e) => {
  const button = e.target.closest('.suggestion-btn');
  if (!button) return;

  titleInput.value = button.dataset.title || '';
  hideSuggestions();
  form.requestSubmit();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) {
    hideSuggestions();
  }
});

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
    hideSuggestions();
  } catch (err) {
    statusBox.textContent = err.message;
  }
});
