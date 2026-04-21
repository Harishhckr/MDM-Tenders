// ============================================================
// Admin Scrapers — Premium Mission Control
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let pollTimer = null;

export async function renderScrapers(container) {
    container.innerHTML = `
        <div class="scraper-header anim-in">
            <h1>Scraper Control Panel</h1>
            <p>Manage and monitor all tender extraction engines</p>
        </div>

        <div class="scraper-actions anim-in anim-d1">
            <button class="btn-stop-all" id="adm-stop-all" disabled>
                <i data-lucide="x-circle" style="width:16px;height:16px;"></i> Stop All Engines
            </button>
            <button class="btn-sync-all" id="adm-sync-all">
                <i data-lucide="zap" style="width:16px;height:16px;"></i> Sync All Sources
            </button>
        </div>

        <div class="section-title anim-in anim-d2" style="font-size:20px; font-weight:800; margin-bottom:24px; text-transform:none;">
            <i data-lucide="box" style="width:20px;height:20px;"></i> Tender Source Engines
        </div>

        <div class="scraper-list anim-in anim-d2" id="adm-scraper-grid"></div>

        <div class="section-title anim-in anim-d3" style="font-size:20px; font-weight:800; margin-top:40px; margin-bottom:24px; text-transform:none;">
            <i data-lucide="search" style="width:20px;height:20px;"></i> Google Research Scraper
        </div>
        <div class="adm-card anim-in anim-d3" id="adm-google-panel"></div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await loadScraperStatus();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(loadScraperStatus, 5000);

    const obs = new MutationObserver(() => {
        if (!document.getElementById('adm-scraper-grid')) {
            clearInterval(pollTimer);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    container.querySelector('#adm-sync-all')?.addEventListener('click', async () => {
        const sources = ['gem', 'tender247', 'tenderdetail', 'tenderontime', 'biddetail'];
        try {
            await Promise.all(sources.map(src => 
                adminFetch(`${getApiBase()}/admin/scrapers/start?source=${src}`, { method: 'POST' })
            ));
        } catch (e) { console.error(e); }
        await loadScraperStatus();
    });

    container.querySelector('#adm-stop-all')?.addEventListener('click', async () => {
        try {
            await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=all`, { method: 'POST' });
        } catch (e) { console.error(e); }
        await loadScraperStatus();
    });
}

async function loadScraperStatus() {
    try {
        const res = await adminFetch(`${getApiBase()}/admin/scrapers/status`);
        if (!res.ok) return;
        const d = await res.json();

        const tenderScrapers = d.scrapers || {};
        const anyRunning = Object.values(tenderScrapers).some(s => s.is_running);
        
        const syncAllBtn = document.getElementById('adm-sync-all');
        const stopAllBtn = document.getElementById('adm-stop-all');
        if (syncAllBtn) syncAllBtn.disabled = anyRunning;
        if (stopAllBtn) stopAllBtn.disabled = !anyRunning;

        const grid = document.getElementById('adm-scraper-grid');
        if (grid) {
            grid.innerHTML = Object.entries(tenderScrapers).map(([name, info]) => {
                const status = info.is_running ? 'RUNNING' : 'COMPLETED';
                return `
                    <div class="scraper-item">
                        <div class="sc-info-row">
                            <span class="sc-name">${name}</span>
                            <span class="sc-status-label">${status}</span>
                        </div>
                        <div class="sc-details"><strong>${info.total_tenders}</strong> tenders found to date</div>
                        <div class="sc-time">Last run: ${info.last_run ? new Date(info.last_run).toLocaleString() : 'Never'}</div>
                        <div class="sc-controls">
                            <button class="btn-icon-sm" onclick="window._startScraper('${name}')" ${info.is_running ? 'disabled' : ''}>
                                <i data-lucide="play" style="width:20px;height:20px;fill:currentColor;"></i>
                            </button>
                            <button class="btn-icon-sm" onclick="window._stopScraper('${name}')" ${!info.is_running ? 'disabled' : ''} style="opacity:0.3;">
                                <i data-lucide="square" style="width:16px;height:16px;fill:currentColor;"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            if (window.lucide) window.lucide.createIcons();
        }

        const gPanel = document.getElementById('adm-google-panel');
        if (gPanel) {
            const g = d.google || {};
            gPanel.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div class="sc-status-label">${g.running ? 'RUNNING' : 'IDLE'}</div>
                        <div class="sc-details" style="margin-top:4px;">${g.message || 'Ready for research'}</div>
                    </div>
                    <button class="btn-sync-all" onclick="window._startGoogle()" ${g.running ? 'disabled' : ''}>
                        Launch Google Engine
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (e) { console.error(e); }
}

window._startScraper = async (source) => {
    await adminFetch(`${getApiBase()}/admin/scrapers/start?source=${source}`, { method: 'POST' });
    await loadScraperStatus();
};
window._stopScraper = async (source) => {
    await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=${source}`, { method: 'POST' });
    await loadScraperStatus();
};
window._startGoogle = async () => {
    await adminFetch(`${getApiBase()}/admin/scrapers/start?source=google&headless=true`, { method: 'POST' });
    await loadScraperStatus();
};
