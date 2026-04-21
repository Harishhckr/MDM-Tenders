// ============================================================
// Admin Scrapers — Control Panel
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let pollTimer = null;

export async function renderScrapers(container) {
    container.innerHTML = `
        <div class="section-title anim-in"><i data-lucide="bot"></i> Scraper Control Panel</div>
        <div class="scraper-grid anim-in anim-d1" id="adm-scraper-grid"></div>

        <div class="section-title anim-in anim-d2"><i data-lucide="search"></i> Google Scraper</div>
        <div class="adm-card anim-in anim-d2" id="adm-google-panel"></div>
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
}

async function loadScraperStatus() {
    try {
        const res = await adminFetch(`${getApiBase()}/admin/scrapers/status`);
        if (!res.ok) return;
        const d = await res.json();

        // Tender scrapers
        const grid = document.getElementById('adm-scraper-grid');
        if (grid) {
            const scrapers = d.scrapers || {};
            grid.innerHTML = Object.entries(scrapers).map(([name, info]) => {
                const statusClass = info.is_running ? 'running' : (info.last_status === 'failed' ? 'failed' : 'stopped');
                const statusLabel = info.is_running ? 'RUNNING' : info.last_status.toUpperCase();
                return `
                    <div class="scraper-card">
                        <div class="sc-head">
                            <span class="sc-name">${name}</span>
                            <span class="sc-status ${statusClass}"><span class="dot"></span> ${statusLabel}</span>
                        </div>
                        <div class="sc-meta">
                            Tenders: ${info.total_tenders.toLocaleString()} · Last: ${info.last_run ? new Date(info.last_run).toLocaleString() : 'Never'}
                        </div>
                        ${info.last_error ? `<div class="sc-meta" style="color:var(--neon-red);">Error: ${info.last_error.substring(0, 80)}</div>` : ''}
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
            const gStatus = g.running ? 'running' : (g.stopped ? 'stopped' : 'stopped');
            const gLabel = g.running ? 'RUNNING' : 'IDLE';

            gPanel.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                    <div>
                        <span class="sc-status ${gStatus}" style="font-size:13px;"><span class="dot"></span> ${gLabel}</span>
                        <div class="sc-meta" style="margin-top:6px;">${g.message || 'Ready'}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:11px;color:var(--text-tertiary);font-family:var(--font-mono);">Headless</span>
                        <label class="adm-toggle">
                            <input type="checkbox" id="adm-google-headless" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:16px;">
                    <div class="stat-box" style="flex:1;padding:12px;">
                        <div class="stat-label">All Results</div>
                        <div class="stat-value cyan" style="font-size:20px;">${g.saved_all || 0}</div>
                    </div>
                    <div class="stat-box" style="flex:1;padding:12px;">
                        <div class="stat-label">Filtered</div>
                        <div class="stat-value green" style="font-size:20px;">${g.saved_filtered || 0}</div>
                    </div>
                    <div class="stat-box" style="flex:1;padding:12px;">
                        <div class="stat-label">Last Run</div>
                        <div class="stat-value" style="font-size:13px;color:var(--text-secondary);">${g.last_run ? new Date(g.last_run).toLocaleString() : 'Never'}</div>
                    </div>
                </div>
                ${g.captcha_detected ? `
                    <div style="background:rgba(255,59,59,0.1);border:1px solid rgba(255,59,59,0.3);border-radius:8px;padding:12px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                        <i data-lucide="alert-triangle" style="width:18px;height:18px;color:var(--neon-red);"></i>
                        <span style="font-size:12px;color:var(--neon-red);font-family:var(--font-mono);font-weight:600;">CAPTCHA DETECTED — Solve in Chrome window</span>
                        <button class="btn-admin btn-cyan" style="margin-left:auto;" onclick="window._clearCaptcha()">
                            <i data-lucide="check"></i> I Solved It
                        </button>
                    </div>
                ` : ''}
                <div style="display:flex;gap:8px;">
                    <button class="btn-admin btn-green" onclick="window._startGoogle()" ${g.running ? 'disabled' : ''}>
                        <i data-lucide="play"></i> Launch Google Scraper
                    </button>
                    <button class="btn-admin btn-red" onclick="window._stopGoogle()" ${!g.running ? 'disabled' : ''}>
                        <i data-lucide="square"></i> Stop
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (e) {
        console.error('Scraper status error:', e);
    }
}

// Global action handlers
window._startScraper = async (source) => {
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/start?source=${source}`, { method: 'POST' });
        setTimeout(loadScraperStatus, 1000);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._stopScraper = async (source) => {
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=${source}`, { method: 'POST' });
        setTimeout(loadScraperStatus, 1000);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._startGoogle = async () => {
    const headless = document.getElementById('adm-google-headless')?.checked ?? true;
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/start?source=google&headless=${headless}`, { method: 'POST' });
        setTimeout(loadScraperStatus, 1000);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._stopGoogle = async () => {
    try {
        await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=google`, { method: 'POST' });
        setTimeout(loadScraperStatus, 1000);
    } catch (e) { alert('Failed: ' + e.message); }
};
window._clearCaptcha = async () => {
    try {
        await adminFetch(`${getApiBase()}/google/clear-captcha`, { method: 'POST' });
    } catch (e) { console.error(e); }
};
