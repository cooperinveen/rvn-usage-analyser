// ── State ──────────────────────────────────────────────────────────────────
const state = {
    allStories: [],
    filteredStories: [],
    currentPage: 1,
    pageSize: 50,
    sortKey: 'airings',
    sortDir: 'desc',
    searchQuery: '',
    regionFilter: 'all',
    minAirings: 1,
    summary: null,
    topChannels: [],
    topMarkets: [],
    dateRange: {},
};

// ── DOM refs ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const uploadScreen = $('upload-screen');
const dashboardScreen = $('dashboard-screen');
const uploadZone = $('upload-zone');
const fileInput = $('file-input');
const uploadProgress = $('upload-progress');
const progressBar = $('progress-bar');
const progressText = $('progress-text');
const uploadError = $('upload-error');
const loadingOverlay = $('loading-overlay');
const loadingText = $('loading-text');
const storiesTbody = $('stories-tbody');
const searchInput = $('search-input');
const searchClear = $('search-clear');
const storyModal = $('story-modal');
const modalSlug = $('modal-slug');
const modalStoryId = $('modal-story-id');
const modalBody = $('modal-body');
const headerStatus = $('header-status');
const dataBadge = $('data-badge');

// ── Upload ──────────────────────────────────────────────────────────────────
uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});
uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) {
        showUploadError('Please upload a .csv or .xlsx file exported from Teletrax.');
        return;
    }
    uploadFile(file);
}

async function uploadFile(file) {
    hideUploadError();
    showLoading('Uploading…', 'Sending file to server');

    try {
        // Step 1: upload directly to Vercel Blob (no 4.5 MB limit)
        showLoading('Uploading…', 'Transferring file — large files may take a moment');
        const blobResult = await uploadToBlob(file);

        // Step 2: ask Flask to fetch from blob, parse, and return aggregated data
        showLoading('Analysing your data…', 'Processing — this may take a moment for large files');
        const res = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: blobResult.url, filename: file.name }),
        });
        const data = await res.json();

        if (!res.ok) {
            hideLoading();
            showUploadError(data.error || 'Processing failed. Please try again.');
            return;
        }

        loadData(data);
        showDashboard();
        showToast(`Loaded ${data.summary.total_stories.toLocaleString()} stories from ${data.summary.total_airings.toLocaleString()} airings`);
    } catch (err) {
        hideLoading();
        showUploadError(err.message || 'Could not connect to the server. Please try again.');
    }
}

async function uploadToBlob(file) {
    // Step 1: get a client token from our server-side handler
    const callbackUrl = window.location.origin + '/api/blob-upload';
    const tokenRes = await fetch('/api/blob-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'blob.generate-client-token',
            payload: { pathname: file.name, callbackUrl, multipart: false },
        }),
    });
    if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.error || 'Could not get upload token');
    }
    const tokenData = await tokenRes.json();
    const clientToken = tokenData.clientToken;
    if (!clientToken) throw new Error('Invalid upload token response');

    // Step 2: PUT the file directly to Vercel Blob (no 4.5 MB limit)
    // access=public is required for browser-side PUT uploads (CORS)
    const uploadRes = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(file.name)}`, {
        method: 'PUT',
        headers: {
            'authorization': `Bearer ${clientToken}`,
            'x-api-version': '9',
            'x-content-length': String(file.size),
            'x-access': 'public',
        },
        body: file,
    });
    if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => '');
        throw new Error(`File upload to storage failed (${uploadRes.status}). ${errText}`);
    }
    return await uploadRes.json();
}

function loadData(data) {
    state.allStories = data.stories;
    state.summary = data.summary;
    state.topChannels = data.top_channels;
    state.topMarkets = data.top_markets;
    state.dateRange = data.date_range;
    state.currentPage = 1;
    state.searchQuery = '';
    state.regionFilter = 'all';
    state.minAirings = 1;
    searchInput.value = '';
    $('min-airings-input').value = 1;
    setActivePill('all');
}

// ── Show/hide screens ────────────────────────────────────────────────────────
function showDashboard() {
    hideLoading();
    uploadScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    headerStatus.style.display = 'flex';
    renderSummaryBar();
    renderInsights();
    applyFilters();
}

function showUploadScreen() {
    dashboardScreen.style.display = 'none';
    uploadScreen.style.display = 'block';
    headerStatus.style.display = 'none';
    fileInput.value = '';
    hideUploadError();
}

$('btn-new-upload').addEventListener('click', showUploadScreen);

// ── Summary Bar ─────────────────────────────────────────────────────────────
function renderSummaryBar() {
    const s = state.summary;
    $('stat-stories').textContent = s.total_stories.toLocaleString();
    $('stat-airings').textContent = s.total_airings.toLocaleString();
    $('stat-channels').textContent = s.total_channels.toLocaleString();
    $('stat-countries').textContent = s.total_countries.toLocaleString();
    $('stat-airtime').textContent = s.total_air_time;
    dataBadge.textContent = `${state.dateRange.from} – ${state.dateRange.to}`;
}

// ── Insights Panel ───────────────────────────────────────────────────────────
function renderInsights() {
    const topStories = state.allStories.slice(0, 10);
    const maxAirings = topStories[0]?.airings || 1;

    $('top-stories-list').innerHTML = topStories.map((s, i) => `
        <div class="insight-item" onclick="openStoryModal('${escHtml(s.slug)}')">
            <span class="insight-rank">${i + 1}</span>
            <div style="flex:1; min-width:0">
                <div class="insight-name">${slugDisplay(s.slug)}</div>
                <div class="insight-bar-wrap"><div class="insight-bar" style="width:${Math.round(s.airings/maxAirings*100)}%"></div></div>
            </div>
            <span class="insight-count">${s.airings}</span>
        </div>
    `).join('');

    const maxChAirings = state.topChannels[0]?.airings || 1;
    $('top-channels-list').innerHTML = state.topChannels.map((c, i) => `
        <div class="insight-item">
            <span class="insight-rank">${i + 1}</span>
            <div style="flex:1; min-width:0">
                <div class="insight-name">${escHtml(c.channel)}</div>
                <div style="font-size:11px; color:var(--tr-text-light)">${escHtml(c.country || '')}</div>
                <div class="insight-bar-wrap"><div class="insight-bar" style="width:${Math.round(c.airings/maxChAirings*100)}%"></div></div>
            </div>
            <span class="insight-count">${c.airings}</span>
        </div>
    `).join('');

    const maxMktAirings = state.topMarkets[0]?.airings || 1;
    $('top-markets-list').innerHTML = state.topMarkets.map((m, i) => `
        <div class="insight-item">
            <span class="insight-rank">${i + 1}</span>
            <div style="flex:1; min-width:0">
                <div class="insight-name">${escHtml(m.market)}</div>
                <div class="insight-bar-wrap"><div class="insight-bar" style="width:${Math.round(m.airings/maxMktAirings*100)}%"></div></div>
            </div>
            <span class="insight-count">${m.airings}</span>
        </div>
    `).join('');
}

// ── Filtering & Search ───────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value.trim().toLowerCase();
    searchClear.style.display = state.searchQuery ? 'block' : 'none';
    state.currentPage = 1;
    applyFilters();
});
searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.style.display = 'none';
    state.currentPage = 1;
    applyFilters();
});

document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        state.regionFilter = pill.dataset.region;
        setActivePill(pill.dataset.region);
        state.currentPage = 1;
        applyFilters();
    });
});

$('min-airings-input').addEventListener('input', () => {
    state.minAirings = parseInt($('min-airings-input').value) || 1;
    state.currentPage = 1;
    applyFilters();
});

function setActivePill(region) {
    document.querySelectorAll('.filter-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.region === region);
    });
}

function applyFilters() {
    let filtered = state.allStories;

    if (state.searchQuery) {
        const q = state.searchQuery;
        filtered = filtered.filter(s =>
            s.slug.toLowerCase().includes(q) ||
            (s.story_id && s.story_id.toLowerCase().includes(q))
        );
    }

    if (state.regionFilter !== 'all') {
        filtered = filtered.filter(s =>
            s.regions && s.regions[state.regionFilter] > 0
        );
    }

    if (state.minAirings > 1) {
        filtered = filtered.filter(s => s.airings >= state.minAirings);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
        let av = a[state.sortKey], bv = b[state.sortKey];
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
        if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    state.filteredStories = filtered;
    $('results-count').textContent = `${filtered.length.toLocaleString()} stor${filtered.length === 1 ? 'y' : 'ies'}`;
    renderTable();
    renderPagination();
}

// ── Table Rendering ──────────────────────────────────────────────────────────
function renderTable() {
    const start = (state.currentPage - 1) * state.pageSize;
    const page = state.filteredStories.slice(start, start + state.pageSize);
    const maxAirings = state.filteredStories[0]?.airings || 1;

    if (page.length === 0) {
        storiesTbody.innerHTML = `
            <tr><td colspan="7">
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p class="empty-state-text">No stories match your search</p>
                    <p class="empty-state-sub">Try a different keyword or clear your filters</p>
                </div>
            </td></tr>`;
        return;
    }

    storiesTbody.innerHTML = page.map(s => {
        const [topic, subtopic] = s.slug.split('/');
        const barWidth = Math.max(2, Math.round(s.airings / maxAirings * 60));
        return `
        <tr>
            <td class="slug-cell">
                <div class="slug-topic">${escHtml(topic)}</div>
                <div class="slug-main">${escHtml(subtopic || topic)}</div>
            </td>
            <td class="col-num">
                <div class="airing-bar-wrap">
                    <div class="airing-bar" style="width:${barWidth}px"></div>
                    <span>${s.airings.toLocaleString()}</span>
                </div>
            </td>
            <td class="col-num">${s.channels}</td>
            <td class="col-num">${s.countries}</td>
            <td class="col-time">${escHtml(s.total_air_time)}</td>
            <td class="col-date">${escHtml(s.last_seen)}</td>
            <td class="col-action">
                <button class="btn btn-ghost btn-sm" onclick="openStoryModal('${escHtml(s.slug)}')">View</button>
            </td>
        </tr>`;
    }).join('');
}

// ── Sorting ──────────────────────────────────────────────────────────────────
document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) {
            state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
        } else {
            state.sortKey = key;
            state.sortDir = 'desc';
        }
        document.querySelectorAll('th.sortable').forEach(t => {
            t.classList.remove('sorted');
            t.querySelector('.sort-indicator').textContent = '';
        });
        th.classList.add('sorted');
        th.querySelector('.sort-indicator').textContent = state.sortDir === 'desc' ? '▼' : '▲';
        state.currentPage = 1;
        applyFilters();
    });
});

// ── Pagination ────────────────────────────────────────────────────────────────
function renderPagination() {
    const total = state.filteredStories.length;
    const pages = Math.ceil(total / state.pageSize);
    const bar = $('pagination-bar');

    if (pages <= 1) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';

    $('page-info').textContent = `Page ${state.currentPage} of ${pages}`;
    $('btn-prev').disabled = state.currentPage === 1;
    $('btn-next').disabled = state.currentPage === pages;
}

$('btn-prev').addEventListener('click', () => {
    if (state.currentPage > 1) { state.currentPage--; renderTable(); renderPagination(); window.scrollTo(0, 0); }
});
$('btn-next').addEventListener('click', () => {
    const pages = Math.ceil(state.filteredStories.length / state.pageSize);
    if (state.currentPage < pages) { state.currentPage++; renderTable(); renderPagination(); window.scrollTo(0, 0); }
});

// ── Story Detail Modal ────────────────────────────────────────────────────────
function openStoryModal(slug) {
    const story = state.allStories.find(s => s.slug === slug);
    if (!story) return;

    modalSlug.textContent = slug;
    modalStoryId.textContent = story.story_id || '';
    storyModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderModalBody(story);
}

function renderModalBody(s) {
    const clipNote = s.asset_secs > 0
        ? `Clients used an average of <strong>${escHtml(s.avg_clip)}</strong> from a <strong>${escHtml(s.asset_length)}</strong> story.`
        : `Average clip used: <strong>${escHtml(s.avg_clip)}</strong>`;

    const allChannelRows = s.all_channels.map(c => `
        <tr>
            <td>${escHtml(c.channel || '')}</td>
            <td>${escHtml(c.country || '')}</td>
            <td class="num">${c.airings}</td>
            <td class="num">${escHtml(c.air_time)}</td>
        </tr>`).join('');

    const countryRows = s.all_markets.map(m => `
        <tr>
            <td>${escHtml(m.market)}</td>
            <td class="num">${m.airings}</td>
        </tr>`).join('');

    modalBody.innerHTML = `
        <!-- 1. Headline Stats -->
        <div class="modal-section">
            <p class="modal-section-title">Performance Summary</p>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-card-value">${s.airings.toLocaleString()}</span>
                    <span class="stat-card-label">Airings</span>
                </div>
                <div class="stat-card">
                    <span class="stat-card-value">${s.channels}</span>
                    <span class="stat-card-label">Channels</span>
                </div>
                <div class="stat-card">
                    <span class="stat-card-value">${s.countries}</span>
                    <span class="stat-card-label">Countries</span>
                </div>
                <div class="stat-card">
                    <span class="stat-card-value">${s.days_in_rotation}</span>
                    <span class="stat-card-label">Days in rotation</span>
                </div>
                <div class="stat-card">
                    <span class="stat-card-value">${escHtml(s.total_air_time)}</span>
                    <span class="stat-card-label">Total air time</span>
                </div>
            </div>
            <div class="clip-insight">${clipNote}</div>
            <p style="font-size:12px; color:var(--tr-text-light); margin:8px 0 0">
                First aired: <strong>${escHtml(s.first_seen)}</strong> &nbsp;·&nbsp; Last aired: <strong>${escHtml(s.last_seen)}</strong>
            </p>
        </div>

        <!-- 2. Channel Breakdown -->
        <div class="modal-section">
            <p class="modal-section-title">Channel Breakdown (${s.all_channels.length} channel${s.all_channels.length === 1 ? '' : 's'})</p>
            <div class="modal-table-wrap">
                <table class="modal-table">
                    <thead><tr><th>Channel</th><th>Country</th><th>Airings</th><th>Air Time</th></tr></thead>
                    <tbody>${allChannelRows}</tbody>
                </table>
            </div>
        </div>

        <!-- 3. Country Breakdown -->
        <div class="modal-section">
            <p class="modal-section-title">Country Breakdown (${s.all_markets.length} countr${s.all_markets.length === 1 ? 'y' : 'ies'})</p>
            <div class="modal-table-wrap">
                <table class="modal-table">
                    <thead><tr><th>Country</th><th>Airings</th></tr></thead>
                    <tbody>${countryRows}</tbody>
                </table>
            </div>
        </div>
    `;
}

// Close modal
$('modal-close').addEventListener('click', closeModal);
storyModal.addEventListener('click', e => { if (e.target === storyModal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
    storyModal.style.display = 'none';
    document.body.style.overflow = '';
}

// ── Export ───────────────────────────────────────────────────────────────────
$('btn-export').addEventListener('click', () => {
    window.location.href = '/api/export';
    showToast('Downloading summary…');
});

// ── Loading helpers ──────────────────────────────────────────────────────────
function showLoading(text, sub) {
    loadingText.textContent = text || 'Loading…';
    $('loading-sub').textContent = sub || '';
    loadingOverlay.style.display = 'flex';
}
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// ── Upload error helpers ─────────────────────────────────────────────────────
function showUploadError(msg) {
    uploadError.textContent = msg;
    uploadError.style.display = 'block';
}
function hideUploadError() {
    uploadError.style.display = 'none';
    uploadError.textContent = '';
}

// ── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
    const wrap = $('toast-wrap');
    $('toast-msg').textContent = msg;
    wrap.style.display = 'flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { wrap.style.display = 'none'; }, 3000);
}

// ── Utility ──────────────────────────────────────────────────────────────────
function escHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function slugDisplay(slug) {
    const [topic, sub] = slug.split('/');
    if (sub) return `<span style="color:var(--tr-text-light);font-size:11px">${escHtml(topic)}/</span>${escHtml(sub)}`;
    return escHtml(topic);
}

function secsToHms(secs) {
    secs = Math.round(secs || 0);
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) { const m = Math.floor(secs/60), s = secs%60; return `${m}m ${s}s`; }
    const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60);
    return `${h}h ${m}m`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
(async function init() {
    // Nothing to restore — this is a stateless, upload-first tool
})();
