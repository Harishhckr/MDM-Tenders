// ============================================================
// Admin Scrapers — Master Control Panel
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let pollTimer = null;

export async function renderScrapers(container) {
    container.innerHTML = `
        <div class="page-header anim-in">
            <div class="page-header-text">
                <h1>Scraper Control Panel</h1>
                <p>Manage and monitor all tender extraction engines</p>
            </div>
            <div class="page-header-actions" style="display:flex; gap:12px;">
                <button class="btn-admin btn-red" id="adm-stop-all" disabled>
                    <i data-lucide="x-octagon"></i> Stop All Engines
                </button>
                <button class="btn-admin btn-green" id="adm-sync-all">
                    <i data-lucide="zap"></i> Sync All Sources
                </button>
            </div>
        </div>

        <div class="section-title anim-in anim-d1"><i data-lucide="bot"></i> Tender Source Engines</div>
        <div class="scraper-grid anim-in anim-d1" id="adm-scraper-grid"></div>

        <div class="section-title anim-in anim-d2"><i data-lucide="search"></i> Google Research Scraper</div>
        <div class="adm-card anim-in anim-d2" id="adm-google-panel"></div>
    `;
    if (window.lucide) window.lucide.createIcons();

    await loadScraperStatus();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(loadScraperStatus, 4000);

    const obs = new MutationObserver(() => {
        if (!document.getElementById('adm-scraper-grid')) {
            clearInterval(pollTimer);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Global Actions
    container.querySelector('#adm-sync-all')?.addEventListener('click', async () => {
        const btn = document.getElementById('adm-sync-all');
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader" class="goog-spin"></i> Triggering...`;
        
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

        // Check if any tender scraper is running
        const tenderScrapers = d.scrapers || {};
        const anyRunning = Object.values(tenderScrapers).some(s => s.is_running);
        
        const syncAllBtn = document.getElementById('adm-sync-all');
        const stopAllBtn = document.getElementById('adm-stop-all');
        if (syncAllBtn) {
            syncAllBtn.disabled = anyRunning;
            syncAllBtn.innerHTML = anyRunning ? `<i data-lucide="loader" class="goog-spin"></i> Syncing...` : `<i data-lucide="zap"></i> Sync All Sources`;
        }
        if (stopAllBtn) {
            stopAllBtn.disabled = !anyRunning;
        }

        // Render individual scraper cards
        const grid = document.getElementById('adm-scraper-grid');
        if (grid) {
            grid.innerHTML = Object.entries(tenderScrapers).map(([name, info]) => {
                const statusClass = info.is_running ? 'running' : (info.last_status === 'failed' ? 'failed' : 'stopped');
                const statusLabel = info.is_running ? 'RUNNING' : info.last_status.toUpperCase();
                return `
                    <div class="scraper-card">
                        <div class="sc-head">
                            <span class="sc-name">${name}</span>
                            <span class="sc-status ${statusClass}"><span class="dot"></span> ${statusLabel}</span>
                        </div>
                        <div class="sc-meta">
                            <strong>${info.total_tenders.toLocaleString()}</strong> tenders found to date
                        </div>
                        <div class="sc-meta" style="font-size:11px; opacity:0.7;">
                            Last run: ${info.last_run ? new Date(info.last_run).toLocaleString() : 'Never'}
                        </div>
                        ${info.last_error ? `<div class="sc-meta" style="color:var(--accent-red); font-size:11px;">Error: ${info.last_error.substring(0, 80)}...</div>` : ''}
                        <div class="sc-actions">
                            <button class="btn-admin btn-green" onclick="window._startScraper('${name}')" ${info.is_running ? 'disabled' : ''}>
                                <i data-lucide="play"></i> Start
                            </button>
                            <button class="btn-admin btn-red" onclick="window._stopScraper('${name}')" ${!info.is_running ? 'disabled' : ''}>
                                <i data-lucide="square"></i> Stop
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            if (window.lucide) window.lucide.createIcons();
        }

        // Google scraper
        const gPanel = document.getElementById('adm-google-panel');
        if (gPanel) {
            const g = d.google || {};
            const gStatus = g.running ? 'running' : 'stopped';
            const gLabel = g.running ? 'RUNNING' : 'IDLE';

            gPanel.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
                    <div>
                        <span class="sc-status ${gStatus}" style="font-size:14px;"><span class="dot"></span> ${gLabel}</span>
                        <div class="sc-meta" style="margin-top:8px;">${g.message || 'Ready for search research'}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px; background:var(--bg-hover); padding:10px 16px; border-radius:12px; border:1px solid var(--border-glass);">
                        <span style="font-size:13px; font-weight:700; color:var(--text-secondary);">Visible Tab Mode</span>
                        <label class="adm-toggle">
                            <input type="checkbox" id="adm-google-headless">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-bottom:24px;">
                    <div class="stat-box" style="padding:16px; border-radius:16px;">
                        <div class="stat-label">Total Results</div>
                        <div class="stat-value cyan" style="font-size:24px;">${g.saved_all || 0}</div>
                    </div>
                    <div class="stat-box" style="padding:16px; border-radius:16px;">
                        <div class="stat-label">MDM Filtered</div>
                        <div class="stat-value green" style="font-size:24px;">${g.saved_filtered || 0}</div>
                    </div>
                    <div class="stat-box" style="padding:16px; border-radius:16px;">
                        <div class="stat-label">Last Activity</div>
                        <div class="stat-value" style="font-size:14px;color:var(--text-secondary);">${g.last_run ? new Date(g.last_run).toLocaleTimeString() : '—'}</div>
                    </div>
                </div>
                ${g.captcha_detected ? `
                    <div style="background:var(--accent-red-dim); border:1px solid var(--accent-red); border-radius:16px; padding:16px; margin-bottom:24px; display:flex; align-items:center; gap:16px;">
                        <i data-lucide="alert-octagon" style="width:24px;height:24px;color:var(--accent-red);"></i>
                        <div>
                            <div style="font-weight:800; color:var(--accent-red); font-size:14px;">CAPTCHA DETECTED</div>
                            <div style="font-size:12px; color:var(--text-secondary);">Check the visible Chrome window and solve the challenge.</div>
                        </div>
                        <button class="btn-admin btn-cyan" style="margin-left:auto;" onclick="window._clearCaptcha()">
                            <i data-lucide="check-circle"></i> Resumed Successfully
                        </button>
                    </div>
                ` : ''}
                <div style="display:flex; gap:12px;">
                    <button class="btn-admin btn-green" style="flex:1; justify-content:center; padding:16px;" onclick="window._startGoogle()" ${g.running ? 'disabled' : ''}>
                        <i data-lucide="play"></i> Launch Google Engine
                    </button>
                    <button class="btn-admin btn-red" style="padding:16px;" onclick="window._stopGoogle()" ${!g.running ? 'disabled' : ''}>
                        <i data-lucide="square"></i> Emergency Stop
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (e) { console.error('Status fetch failed', e); }
}

// Global action handlers
window._startScraper = async (source) => {
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/start?source=${source}`, { method: 'POST' });
        setTimeout(loadScraperStatus, 500);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._stopScraper = async (source) => {
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=${source}`, { method: 'POST' });
        setTimeout(loadScraperStatus, 500);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._startGoogle = async () => {
    // Note: Headless checkbox logic reversed for clarity in UI (Checked = Visible Tab, which means headless=False)
    const isVisible = document.getElementById('adm-google-headless')?.checked ?? false;
    const headless = !isVisible;
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/start?source=google&headless=${headless}`, { method: 'POST' });
        setTimeout(loadScraperStatus, 500);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._stopGoogle = async () => {
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=google`, { method: 'POST' });
        setTimeout(loadScraperStatus, 500);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._clearCaptcha = async () => {
    try {
        await adminFetch(`${getApiBase()}/google/clear-captcha`, { method: 'POST' });
    } catch (e) { console.error(e); }
};
