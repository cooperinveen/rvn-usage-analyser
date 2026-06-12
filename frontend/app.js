// ── State ──────────────────────────────────────────────────────────────────
const state = {
    view: 'stories',           // 'stories' | 'channels'
    allStories: [],
    filteredStories: [],
    allChannels: [],
    filteredChannels: [],
    currentPage: 1,
    chCurrentPage: 1,
    pageSize: 50,
    sortKey: 'airings',
    sortDir: 'desc',
    chSortKey: 'airings',
    chSortDir: 'desc',
    searchQuery: '',
    regionFilter: 'all',
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
const progressText = $('progress-text');
const uploadError = $('upload-error');
const loadingOverlay = $('loading-overlay');
const loadingText = $('loading-text');
const storiesTbody = $('stories-tbody');
const searchInput = $('search-input');
const searchClear = $('search-clear');
const storyModal = $('story-modal');
const modalSlug = $('modal-slug');
const modalHeadline = $('modal-headline');
const modalFirstAired = $('modal-first-aired');
const modalAssetLength = $('modal-asset-length');
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
    // Sanitize filename — Vercel Blob rejects spaces, em dashes, and non-ASCII chars
    const ext = file.name.split('.').pop().toLowerCase();
    const basename = file.name.replace(/\.[^.]+$/, '');
    const safeBasename = basename.replace(/[^\w\-]/g, '_').replace(/_+/g, '_');
    const pathname = safeBasename + '.' + ext;

    // Step 1: get a client token from our server-side handler
    const callbackUrl = window.location.origin + '/api/blob-upload';
    const tokenRes = await fetch('/api/blob-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'blob.generate-client-token',
            payload: { pathname, callbackUrl, multipart: false },
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
    // Vercel Blob API expects pathname as a query param: /?pathname=<name>
    const uploadRes = await fetch(`https://blob.vercel-storage.com/?pathname=${encodeURIComponent(pathname)}`, {
        method: 'PUT',
        headers: {
            'authorization': `Bearer ${clientToken}`,
            'x-api-version': '9',
            'x-content-length': String(file.size),
        },
        body: file,
    });
    if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => '');
        throw new Error(`File upload to storage failed (${uploadRes.status}). ${errText}`);
    }
    // Vercel Blob may return empty body on overwrite — fall back to constructing URL from known store
    let blobData;
    try { blobData = await uploadRes.json(); } catch {}
    const url = blobData?.url || `https://Wu7t55j7ojJBLHfF.public.blob.vercel-storage.com/${encodeURIComponent(pathname)}`;
    return { url };
}

function loadData(data) {
    state.allStories = data.stories;
    state.allChannels = data.channels || [];
    state.summary = data.summary;
    state.topChannels = data.top_channels;
    state.topMarkets = data.top_markets;
    state.dateRange = data.date_range;
    state.trendLabels = data.trend_labels || [];
    state.trendUnit = data.trend_unit || 'day';
    state.currentPage = 1;
    state.chCurrentPage = 1;
    state.searchQuery = '';
    state.regionFilter = 'all';
    state.view = 'stories';
    searchInput.value = '';
    setActivePill('all');
    setActiveView('stories');
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
        <div class="insight-item" data-slug="${escHtml(s.slug)}">
            <span class="insight-rank">${i + 1}</span>
            <div style="flex:1; min-width:0">
                <div class="insight-name">${slugDisplay(s)}</div>
                ${s.headline ? `<div class="insight-headline">${escHtml(s.headline)}</div>` : ''}
                <div class="insight-bar-wrap"><div class="insight-bar" style="width:${Math.round(s.airings/maxAirings*100)}%"></div></div>
            </div>
            <span class="insight-count">${s.airings}</span>
        </div>
    `).join('');

    const maxChAirings = state.topChannels[0]?.airings || 1;
    $('top-channels-list').innerHTML = state.topChannels.map((c, i) => `
        <div class="insight-item" data-channel="${escHtml(c.channel)}">
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

// ── View tabs (Stories / Channels) ───────────────────────────────────────────
function setActiveView(view) {
    state.view = view;
    document.querySelectorAll('.view-tab').forEach(t => {
        const on = t.dataset.view === view;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const isStories = view === 'stories';
    $('stories-table-wrap').style.display = isStories ? '' : 'none';
    $('channels-table-wrap').style.display = isStories ? 'none' : '';
    $('filter-row-stories').style.display = isStories ? '' : 'none';
    $('filter-row-channels').style.display = isStories ? 'none' : '';
    searchInput.placeholder = isStories
        ? 'Search by story slug — e.g. ukraine, iran, soccer...'
        : 'Search by channel — e.g. nhk, cnn, sky...';
    // Each view keeps its own search query/page so producers can flip between them.
    if (isStories) applyFilters();
    else applyChannelFilters();
}

document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => setActiveView(tab.dataset.view));
});

// ── Filtering & Search ───────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value.trim().toLowerCase();
    searchClear.style.display = state.searchQuery ? 'block' : 'none';
    if (state.view === 'stories') {
        state.currentPage = 1;
        applyFilters();
    } else {
        state.chCurrentPage = 1;
        applyChannelFilters();
    }
});
searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.style.display = 'none';
    if (state.view === 'stories') {
        state.currentPage = 1;
        applyFilters();
    } else {
        state.chCurrentPage = 1;
        applyChannelFilters();
    }
});

document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        state.regionFilter = pill.dataset.region;
        setActivePill(pill.dataset.region);
        state.currentPage = 1;
        applyFilters();
    });
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
            displaySlug(s).toLowerCase().includes(q) ||
            (s.headline && s.headline.toLowerCase().includes(q))
        );
    }

    if (state.regionFilter !== 'all') {
        filtered = filtered.filter(s =>
            s.regions && s.regions[state.regionFilter] > 0
        );
    }

    // Sort — nulls always last regardless of direction
    filtered = [...filtered].sort((a, b) => {
        let av = a[state.sortKey], bv = b[state.sortKey];
        const aNull = av == null, bNull = bv == null;
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
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
            <tr><td colspan="8">
                <div class="empty-state">
                    <svg class="empty-state-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="7" cy="7" r="5"/>
                        <path d="M11 11l3 3"/>
                    </svg>
                    <p class="empty-state-text">No stories match your search</p>
                    <p class="empty-state-sub">Try a different keyword or clear your filters</p>
                </div>
            </td></tr>`;
        return;
    }

    storiesTbody.innerHTML = page.map(s => {
        const barWidth = Math.max(2, Math.round(s.airings / maxAirings * 60));
        const sparkline = renderSparkline(s.trend, state.trendLabels, state.trendUnit);
        const publishDisplay = s.publish_time ? escHtml(s.publish_time) : '<span class="muted">—</span>';
        return `
        <tr class="story-row" data-slug="${escHtml(s.slug)}" tabindex="0">
            <td class="slug-cell">
                <div class="slug-main">${escHtml(displaySlug(s))}</div>
                ${s.headline ? `<div class="slug-headline">${escHtml(s.headline)}</div>` : ''}
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
            <td class="col-trend">${sparkline}</td>
            <td class="col-longevity">${longevityDisplay(s.longevity)}</td>
            <td class="col-date">${publishDisplay}</td>
        </tr>`;
    }).join('');
}

// ── Sorting ──────────────────────────────────────────────────────────────────
// Story headers have data-sort; channel headers have data-ch-sort. Same shape, different state.
document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) {
            state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
        } else {
            state.sortKey = key;
            state.sortDir = 'desc';
        }
        document.querySelectorAll('th[data-sort]').forEach(t => {
            t.classList.remove('sorted');
            t.querySelector('.sort-indicator').textContent = '';
        });
        th.classList.add('sorted');
        th.querySelector('.sort-indicator').textContent = state.sortDir === 'desc' ? '▼' : '▲';
        state.currentPage = 1;
        applyFilters();
    });
});

document.querySelectorAll('th[data-ch-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const key = th.dataset.chSort;
        if (state.chSortKey === key) {
            state.chSortDir = state.chSortDir === 'desc' ? 'asc' : 'desc';
        } else {
            state.chSortKey = key;
            state.chSortDir = 'desc';
        }
        document.querySelectorAll('th[data-ch-sort]').forEach(t => {
            t.classList.remove('sorted');
            t.querySelector('.sort-indicator').textContent = '';
        });
        th.classList.add('sorted');
        th.querySelector('.sort-indicator').textContent = state.chSortDir === 'desc' ? '▼' : '▲';
        state.chCurrentPage = 1;
        applyChannelFilters();
    });
});

// ── Channel filtering / rendering ────────────────────────────────────────────
function applyChannelFilters() {
    let filtered = state.allChannels;

    if (state.searchQuery) {
        const q = state.searchQuery;
        filtered = filtered.filter(c =>
            (c.channel && c.channel.toLowerCase().includes(q)) ||
            (c.country && c.country.toLowerCase().includes(q))
        );
    }

    filtered = [...filtered].sort((a, b) => {
        let av = a[state.chSortKey], bv = b[state.chSortKey];
        const aNull = av == null, bNull = bv == null;
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return state.chSortDir === 'asc' ? -1 : 1;
        if (av > bv) return state.chSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    state.filteredChannels = filtered;
    $('ch-results-count').textContent = `${filtered.length.toLocaleString()} channel${filtered.length === 1 ? '' : 's'}`;
    renderChannelTable();
    renderPagination();
}

function renderChannelTable() {
    const tbody = $('channels-tbody');
    const start = (state.chCurrentPage - 1) * state.pageSize;
    const page = state.filteredChannels.slice(start, start + state.pageSize);
    const maxAirings = state.filteredChannels[0]?.airings || 1;

    if (page.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="empty-state">
                    <p class="empty-state-text">No channels match your search</p>
                    <p class="empty-state-sub">Try a different keyword or clear your filters</p>
                </div>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = page.map(c => {
        const barWidth = Math.max(2, Math.round(c.airings / maxAirings * 60));
        const sparkline = renderSparkline(c.trend, state.trendLabels, state.trendUnit);
        return `
        <tr class="channel-row" data-channel="${escHtml(c.channel)}" tabindex="0">
            <td class="col-channel">
                <div class="channel-cell-main">${escHtml(c.channel)}</div>
            </td>
            <td class="col-country channel-cell-country">${escHtml(c.country || '')}</td>
            <td class="col-num">
                <div class="airing-bar-wrap">
                    <div class="airing-bar" style="width:${barWidth}px"></div>
                    <span>${c.airings.toLocaleString()}</span>
                </div>
            </td>
            <td class="col-num">${c.stories.toLocaleString()}</td>
            <td class="col-time">${escHtml(c.total_air_time)}</td>
            <td class="col-trend">${sparkline}</td>
        </tr>`;
    }).join('');
}

// ── Pagination ────────────────────────────────────────────────────────────────
function renderPagination() {
    const isStories = state.view === 'stories';
    const total = isStories ? state.filteredStories.length : state.filteredChannels.length;
    const pages = Math.ceil(total / state.pageSize);
    const page = isStories ? state.currentPage : state.chCurrentPage;
    const bar = $('pagination-bar');

    if (pages <= 1) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';

    $('page-info').textContent = `Page ${page} of ${pages}`;
    $('btn-prev').disabled = page === 1;
    $('btn-next').disabled = page === pages;
}

$('btn-prev').addEventListener('click', () => {
    if (state.view === 'stories') {
        if (state.currentPage > 1) { state.currentPage--; renderTable(); renderPagination(); window.scrollTo(0, 0); }
    } else {
        if (state.chCurrentPage > 1) { state.chCurrentPage--; renderChannelTable(); renderPagination(); window.scrollTo(0, 0); }
    }
});
$('btn-next').addEventListener('click', () => {
    if (state.view === 'stories') {
        const pages = Math.ceil(state.filteredStories.length / state.pageSize);
        if (state.currentPage < pages) { state.currentPage++; renderTable(); renderPagination(); window.scrollTo(0, 0); }
    } else {
        const pages = Math.ceil(state.filteredChannels.length / state.pageSize);
        if (state.chCurrentPage < pages) { state.chCurrentPage++; renderChannelTable(); renderPagination(); window.scrollTo(0, 0); }
    }
});

// ── Story Detail Modal ────────────────────────────────────────────────────────
function openStoryModal(slug) {
    const story = state.allStories.find(s => s.slug === slug);
    if (!story) return;

    modalSlug.textContent = displaySlug(story);
    modalHeadline.textContent = story.headline || '';
    modalFirstAired.textContent = story.first_seen || '';
    modalAssetLength.textContent = story.asset_secs > 0 ? story.asset_length : '';
    storyModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderModalBody(story);
}

function renderModalBody(s) {
    const trendChart = renderTrendChart(s.trend, state.trendLabels, state.trendUnit);

    // Mini-panel: top channel, top country, avg clip
    const topCh = s.all_channels?.[0];
    const topCtry = s.all_markets?.[0];
    const miniPanel = `
        <ul class="modal-mini-panel">
            ${topCh ? `<li><span class="mini-label">Most aired on</span><span class="mini-value">${escHtml(topCh.channel)} <span class="mini-sub">(${topCh.airings.toLocaleString()} airings)</span></span></li>` : ''}
            ${topCtry ? `<li><span class="mini-label">Most aired in</span><span class="mini-value">${escHtml(topCtry.market)} <span class="mini-sub">(${topCtry.airings.toLocaleString()} airings)</span></span></li>` : ''}
            <li><span class="mini-label">Avg clip used</span><span class="mini-value">${escHtml(s.avg_clip)}</span></li>
        </ul>
    `;

    modalBody.innerHTML = `
        <!-- 1. Headline stats + trend chart (side-by-side) -->
        <div class="modal-section">
            <div class="modal-overview">
                <div class="modal-overview-stats">
                    <div class="stats-grid stats-grid-compact">
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
                        <div class="stat-card">
                            <span class="stat-card-value">${longevityDisplay(s.longevity, true)}</span>
                            <span class="stat-card-label">Longevity</span>
                        </div>
                    </div>
                </div>
                ${trendChart ? `
                <div class="modal-overview-chart">
                    <div class="trend-chart-wrap">${trendChart}</div>
                    ${miniPanel}
                </div>` : `
                <div class="modal-overview-chart">${miniPanel}</div>`}
            </div>
        </div>

        <!-- 2. Channel Breakdown (paginated) -->
        <div class="modal-section">
            <div class="modal-table-wrap">
                <table class="modal-table">
                    <thead><tr><th>Channel</th><th>Country</th><th>Airings</th><th>Air Time</th></tr></thead>
                    <tbody id="modal-channel-tbody"></tbody>
                </table>
            </div>
            <div class="modal-pagination" id="modal-channel-pagination"></div>
        </div>
    `;

    // Wire the paginated channel table
    state.modalChannels = s.all_channels;
    state.modalChannelPage = 1;
    renderModalChannelPage();
}

const MODAL_PAGE_SIZE = 10;

function renderModalChannelPage() {
    const all = state.modalChannels || [];
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / MODAL_PAGE_SIZE));
    const page = Math.min(state.modalChannelPage || 1, pages);
    const start = (page - 1) * MODAL_PAGE_SIZE;
    const slice = all.slice(start, start + MODAL_PAGE_SIZE);

    document.getElementById('modal-channel-tbody').innerHTML = slice.map(c => `
        <tr>
            <td>${escHtml(c.channel || '')}</td>
            <td>${escHtml(c.country || '')}</td>
            <td class="num">${c.airings}</td>
            <td class="num">${escHtml(c.air_time)}</td>
        </tr>`).join('');

    renderModalPagination('modal-channel-pagination', 'channel', page, pages, start, total, 'channels');
}

function renderModalPagination(elId, kind, page, pages, start, total, noun) {
    const pag = document.getElementById(elId);
    if (pages <= 1) { pag.innerHTML = ''; return; }
    const from = start + 1;
    const to = Math.min(start + MODAL_PAGE_SIZE, total);
    pag.innerHTML = `
        <button class="btn btn-outline btn-sm" data-page-kind="${kind}" data-page-action="prev" ${page === 1 ? 'disabled' : ''}>← Previous</button>
        <span class="page-info">Showing ${from}–${to} of ${total} ${noun} · Page ${page} of ${pages}</span>
        <button class="btn btn-outline btn-sm" data-page-kind="${kind}" data-page-action="next" ${page === pages ? 'disabled' : ''}>Next →</button>
    `;
}

// Open modal via delegated listeners (avoids inline onclick, which CSP blocks)
$('stories-tbody').addEventListener('click', e => {
    const row = e.target.closest('tr[data-slug]');
    if (!row) return;
    // Don't open the modal if the user was selecting text inside the row
    if (window.getSelection().toString().length > 0) return;
    openStoryModal(row.dataset.slug);
});
$('stories-tbody').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const row = e.target.closest('tr[data-slug]');
    if (row) openStoryModal(row.dataset.slug);
});
$('top-stories-list').addEventListener('click', e => {
    const item = e.target.closest('[data-slug]');
    if (item) openStoryModal(item.dataset.slug);
});
$('top-channels-list').addEventListener('click', e => {
    const item = e.target.closest('[data-channel]');
    if (item) openChannelModal(item.dataset.channel);
});

$('channels-tbody').addEventListener('click', e => {
    const row = e.target.closest('tr[data-channel]');
    if (!row) return;
    if (window.getSelection().toString().length > 0) return;
    openChannelModal(row.dataset.channel);
});
$('channels-tbody').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const row = e.target.closest('tr[data-channel]');
    if (row) openChannelModal(row.dataset.channel);
});

// Modal table pagination — delegated so it survives re-renders
modalBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-page-action]');
    if (!btn) return;
    if (btn.dataset.pageKind !== 'channel') return;
    const total = (state.modalChannels || []).length;
    const pages = Math.max(1, Math.ceil(total / MODAL_PAGE_SIZE));
    if (btn.dataset.pageAction === 'next' && state.modalChannelPage < pages) state.modalChannelPage++;
    if (btn.dataset.pageAction === 'prev' && state.modalChannelPage > 1) state.modalChannelPage--;
    renderModalChannelPage();
});

// Close modal
$('modal-close').addEventListener('click', closeModal);
storyModal.addEventListener('click', e => { if (e.target === storyModal) closeModal(); });
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeModal();
    closeChannelModal();
});

function closeModal() {
    storyModal.style.display = 'none';
    if ($('channel-modal').style.display === 'none') document.body.style.overflow = '';
}

// ── Channel Detail Modal ──────────────────────────────────────────────────────
const channelModal = $('channel-modal');
const chModalName = $('ch-modal-name');
const chModalCountry = $('ch-modal-country');
const chModalActive = $('ch-modal-active');
const chModalBody = $('ch-modal-body');

function openChannelModal(channelName) {
    const c = state.allChannels.find(x => x.channel === channelName);
    if (!c) return;
    chModalName.textContent = c.channel;
    chModalCountry.textContent = c.country || '';
    chModalActive.textContent = c.first_seen ? `First seen ${c.first_seen}` : '';
    channelModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderChannelModalBody(c);
}

function closeChannelModal() {
    channelModal.style.display = 'none';
    if (storyModal.style.display === 'none') document.body.style.overflow = '';
}

$('ch-modal-close').addEventListener('click', closeChannelModal);
channelModal.addEventListener('click', e => { if (e.target === channelModal) closeChannelModal(); });

function renderChannelModalBody(c) {
    const trendChart = renderTrendChart(c.trend, state.trendLabels, state.trendUnit);
    const topStory = c.all_stories?.[0];
    const pie = renderCountryPie(c.story_country_mix);

    const miniPanel = `
        <ul class="modal-mini-panel">
            ${topStory ? `<li><span class="mini-label">Top story</span><span class="mini-value">${escHtml(displaySlug(topStory))} <span class="mini-sub">(${topStory.airings.toLocaleString()} airings)</span></span></li>` : ''}
            <li><span class="mini-label">Avg clip used</span><span class="mini-value">${escHtml(c.avg_clip)}</span></li>
            <li><span class="mini-label">Last aired</span><span class="mini-value">${escHtml(c.last_seen || '—')}</span></li>
        </ul>
    `;

    const summaryCaption = `
        <p class="modal-summary-caption">
            <strong>${c.airings.toLocaleString()}</strong> airings of
            <strong>${c.stories.toLocaleString()}</strong> stories over
            <strong>${c.days_active}</strong> day${c.days_active === 1 ? '' : 's'}
            (<strong>${escHtml(c.total_air_time)}</strong> total air time)
        </p>
    `;

    chModalBody.innerHTML = `
        <div class="modal-section">
            <div class="modal-overview">
                <div class="modal-overview-stats">
                    ${summaryCaption}
                    <h4 class="pie-title">Story origins by airings</h4>
                    ${pie || '<p class="pie-empty">No country data available.</p>'}
                </div>
                ${trendChart ? `
                <div class="modal-overview-chart">
                    <div class="trend-chart-wrap">${trendChart}</div>
                    ${miniPanel}
                </div>` : `
                <div class="modal-overview-chart">${miniPanel}</div>`}
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-table-wrap">
                <table class="modal-table">
                    <thead><tr><th>Story</th><th>Airings</th><th>Air Time</th></tr></thead>
                    <tbody id="ch-modal-story-tbody"></tbody>
                </table>
            </div>
            <div class="modal-pagination" id="ch-modal-story-pagination"></div>
        </div>
    `;

    state.chModalStories = c.all_stories || [];
    state.chModalStoryPage = 1;
    renderChannelModalStoryPage();
}

// Slug-origin palette tuned to the Reuters brand: orange anchor, racing-green,
// then editorial supporting tones. "Other" always renders muted grey at the end.
const PIE_PALETTE = [
    '#D64000',  // TR orange
    '#123015',  // Racing green
    '#0874E3',  // Dark sky
    '#E9B045',  // Dark gold
    '#7A1C1C',  // Deep red
    '#3F7F44',  // Mid green
    '#D4792A',  // Dark amber
    '#5A4A99',  // Muted purple
];
const PIE_OTHER = '#9aa2a8';

function renderCountryPie(mix) {
    if (!mix || mix.length === 0) return '';
    const total = mix.reduce((s, m) => s + m.airings, 0);
    if (total === 0) return '';

    const r = 78, cx = 90, cy = 90;
    let acc = 0;
    const slices = mix.map((m, i) => {
        const frac = m.airings / total;
        const start = acc;
        const end = acc + frac;
        acc = end;
        // Single-slice case: render a full circle instead of a degenerate arc.
        if (frac >= 0.9999) {
            return { path: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`, ...m, frac, color: colorFor(m, i, mix.length) };
        }
        const a0 = start * 2 * Math.PI - Math.PI / 2;
        const a1 = end * 2 * Math.PI - Math.PI / 2;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const large = frac > 0.5 ? 1 : 0;
        return {
            path: `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`,
            ...m,
            frac,
            color: colorFor(m, i, mix.length),
        };
    });

    const paths = slices.map(s => `
        <path d="${s.path}" fill="${s.color}" stroke="#fff" stroke-width="1.5">
            <title>${escHtml(s.country)}: ${s.airings.toLocaleString()} airings (${Math.round(s.frac * 100)}%)</title>
        </path>
    `).join('');

    const legend = slices.map(s => `
        <li>
            <span class="pie-swatch" style="background:${s.color}"></span>
            <span class="pie-country">${escHtml(s.country)}</span>
            <span class="pie-pct">${Math.round(s.frac * 100)}%</span>
        </li>
    `).join('');

    return `
        <div class="pie-wrap">
            <svg class="pie-chart" viewBox="0 0 180 180" aria-label="Story origin countries by airings">
                ${paths}
            </svg>
            <ul class="pie-legend">${legend}</ul>
        </div>
    `;
}

function colorFor(m, i, total) {
    if (m.country === 'Other') return PIE_OTHER;
    return PIE_PALETTE[i % PIE_PALETTE.length];
}

function renderChannelModalStoryPage() {
    const all = state.chModalStories || [];
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / MODAL_PAGE_SIZE));
    const page = Math.min(state.chModalStoryPage || 1, pages);
    const start = (page - 1) * MODAL_PAGE_SIZE;
    const slice = all.slice(start, start + MODAL_PAGE_SIZE);

    document.getElementById('ch-modal-story-tbody').innerHTML = slice.map(s => `
        <tr>
            <td>
                <div class="slug-main">${escHtml(displaySlug(s))}</div>
                ${s.headline ? `<div class="slug-headline">${escHtml(s.headline)}</div>` : ''}
            </td>
            <td class="num">${s.airings}</td>
            <td class="num">${escHtml(s.air_time)}</td>
        </tr>`).join('');

    renderModalPagination('ch-modal-story-pagination', 'ch-story', page, pages, start, total, 'stories');
}

chModalBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-page-action]');
    if (!btn || btn.dataset.pageKind !== 'ch-story') return;
    const total = (state.chModalStories || []).length;
    const pages = Math.max(1, Math.ceil(total / MODAL_PAGE_SIZE));
    if (btn.dataset.pageAction === 'next' && state.chModalStoryPage < pages) state.chModalStoryPage++;
    if (btn.dataset.pageAction === 'prev' && state.chModalStoryPage > 1) state.chModalStoryPage--;
    renderChannelModalStoryPage();
});

// ── Export ───────────────────────────────────────────────────────────────────
$('btn-export').addEventListener('click', async () => {
    try {
        const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stories: state.allStories }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Export failed');
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reuters-usage-summary.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloading summary…');
    } catch (err) {
        showToast('Export failed — please try again');
    }
});

// "Export top N" — context-aware: dumps whatever's currently on screen
// (filtered + sorted) capped to N rows. N selected via split-button dropdown.
async function exportTopN(kind, n) {
    const rows = (kind === 'channels' ? state.filteredChannels : state.filteredStories).slice(0, n);
    if (rows.length === 0) {
        showToast('Nothing to export — try clearing your search.');
        return;
    }
    try {
        const res = await fetch('/api/export-top', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind, rows }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Export failed');
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reuters-top-${kind}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Downloading top ${rows.length} ${kind}…`);
    } catch (err) {
        showToast('Export failed — please try again');
    }
}

document.querySelectorAll('.export-split').forEach(split => {
    const kind = split.dataset.kind;
    const main = split.querySelector('.export-main');
    const chevron = split.querySelector('.export-chevron');
    const menu = split.querySelector('.export-menu');
    const label = split.querySelector('.export-count');

    function setCount(n) {
        main.dataset.count = String(n);
        label.textContent = String(n);
        split.querySelectorAll('.export-menu-item').forEach(it => {
            it.classList.toggle('active', it.dataset.count === String(n));
        });
    }
    setCount(25);

    main.addEventListener('click', () => {
        exportTopN(kind, parseInt(main.dataset.count, 10) || 25);
    });

    chevron.addEventListener('click', e => {
        e.stopPropagation();
        // Close every other split's menu before opening this one.
        document.querySelectorAll('.export-menu').forEach(m => { if (m !== menu) m.hidden = true; });
        menu.hidden = !menu.hidden;
    });

    menu.addEventListener('click', e => {
        const item = e.target.closest('.export-menu-item');
        if (!item) return;
        const n = parseInt(item.dataset.count, 10) || 25;
        setCount(n);
        menu.hidden = true;
    });
});

// Click anywhere else closes any open export menu.
document.addEventListener('click', e => {
    if (e.target.closest('.export-split')) return;
    document.querySelectorAll('.export-menu').forEach(m => { m.hidden = true; });
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

function slugPrefix(story) {
    if (!story || !story.story_id) return null;
    const m = String(story.story_id).match(/^\d{1,4}/);
    return m ? m[0] : null;
}

function displaySlug(story) {
    const prefix = slugPrefix(story);
    return prefix ? `${prefix}-${story.slug}` : story.slug;
}

function slugDisplay(slugOrStory) {
    // Backwards-compat: callers may pass either a story object or just a slug string.
    if (typeof slugOrStory === 'string') return escHtml(slugOrStory);
    return escHtml(displaySlug(slugOrStory));
}

function longevityDisplay(pct, plain) {
    if (pct == null) return `<span class="longevity longevity-na" title="Published too late in the dataset to compute longevity">—</span>`;
    const cls = pct >= 60 ? 'longevity-high' : pct >= 30 ? 'longevity-mid' : 'longevity-low';
    const variant = plain ? 'longevity-plain' : '';
    return `<span class="longevity ${cls} ${variant}" title="${pct}% of airings happened after the first 24h">${pct}%</span>`;
}

function renderTrendChart(counts, labels, unit) {
    if (!counts || counts.length === 0) return '';
    const w = 480, h = 150;
    const padL = 28, padR = 6, padT = 14, padB = 26;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    // Tighter bars: 60% of slot is bar, 40% is gap. Slim and editorial.
    const slot = chartW / counts.length;
    const barW = Math.max(3, slot * 0.6);
    const peak = Math.max(...counts, 1);

    // Single baseline + a faint peak gridline. No mid-line clutter.
    const baselineY = padT + chartH;
    const peakY = padT;
    const axis = `
        <line x1="${padL}" y1="${baselineY}" x2="${w - padR}" y2="${baselineY}" stroke="var(--tr-border)" stroke-width="1"></line>
        <line x1="${padL}" y1="${peakY}" x2="${w - padR}" y2="${peakY}" stroke="var(--tr-border)" stroke-width="1" stroke-dasharray="2 3" opacity="0.5"></line>
        <text x="${padL - 6}" y="${baselineY + 3}" text-anchor="end" font-size="10" fill="var(--tr-text-light)">0</text>
        <text x="${padL - 6}" y="${peakY + 3}" text-anchor="end" font-size="10" fill="var(--tr-text-light)">${peak}</text>
    `;

    const bars = counts.map((c, i) => {
        const barH = c === 0 ? 0 : Math.max(2, Math.round(c / peak * chartH));
        const x = padL + i * slot + (slot - barW) / 2;
        const y = baselineY - barH;
        const label = labels?.[i] ? `${labels[i]}: ${c} airing${c === 1 ? '' : 's'}` : `${c} airing${c === 1 ? '' : 's'}`;
        return `
            <rect class="trend-bar" x="${x.toFixed(2)}" y="${y}" width="${barW.toFixed(2)}" height="${barH}">
                <title>${escHtml(label)}</title>
            </rect>
        `;
    }).join('');

    // X axis labels — show every nth label if crowded
    const labelStep = Math.max(1, Math.ceil(counts.length / 8));
    const xLabels = (labels || []).map((lbl, i) => {
        if (i % labelStep !== 0 && i !== counts.length - 1) return '';
        const x = padL + i * slot + slot / 2;
        return `<text x="${x.toFixed(2)}" y="${h - 8}" text-anchor="middle" font-size="10" fill="var(--tr-text-light)">${escHtml(lbl)}</text>`;
    }).join('');

    return `<svg class="trend-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-label="Airings per ${unit}">
        ${axis}
        ${bars}
        ${xLabels}
    </svg>`;
}

function renderSparkline(counts, labels, unit) {
    if (!counts || counts.length === 0) return '';
    const w = 84, h = 22, gap = 2;
    const barW = Math.max(2, (w - gap * (counts.length - 1)) / counts.length);
    const peak = Math.max(...counts, 1);
    const bars = counts.map((c, i) => {
        const barH = c === 0 ? 1 : Math.max(2, Math.round(c / peak * h));
        const x = i * (barW + gap);
        const y = h - barH;
        const label = labels?.[i] ? `${labels[i]}: ${c} airing${c === 1 ? '' : 's'}` : `${c} airing${c === 1 ? '' : 's'}`;
        const cls = c === 0 ? 'spark-bar spark-bar-empty' : 'spark-bar';
        return `<rect class="${cls}" x="${x.toFixed(2)}" y="${y}" width="${barW.toFixed(2)}" height="${barH}"><title>${escHtml(label)}</title></rect>`;
    }).join('');
    return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="Airings per ${unit}">${bars}</svg>`;
}

