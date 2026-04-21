// ============================================================
// Admin Scrapers — Premium Mission Control
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let pollTimer = null;
const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

export async function renderScrapers(container) {
    container.innerHTML = `
        <div class="scraper-header anim-in" style="margin-bottom:40px;">
            <h1 style="font-size:32px; font-weight:800; letter-spacing:-1px;">Scraper Management</h1>
            <p style="color:var(--text-tertiary); font-weight:500;">Monitor and control real-time tender extraction engines</p>
        </div>

        <div id="captcha-alert-area"></div>

        <div class="scraper-actions anim-in anim-d1" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <div style="font-size:14px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px;">Active Engines</div>
            <div style="display:flex; gap:12px;">
                <button class="btn-sc stop" id="adm-stop-all" style="width:160px;" disabled>
                    <i data-lucide="square"></i> Stop All
                </button>
                <button class="btn-sc start" id="adm-sync-all" style="width:160px;">
                    <i data-lucide="zap"></i> Sync All Sources
                </button>
            </div>
        </div>

        <div class="scraper-grid anim-in anim-d2" id="adm-scraper-grid"></div>

        <div class="section-title anim-in anim-d3" style="margin-top:48px;">
            <i data-lucide="search"></i> Google Research Scraper
        </div>
        <div id="adm-google-card" class="anim-in anim-d3"></div>
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
        const sources = ['gem', 'tender247', 'tenderdetail', 'tenderontime', 'biddetail'];
        const headless = localStorage.getItem('visible_tab') !== 'true';
        try {
            await Promise.all(sources.map(src => 
                adminFetch(`${getApiBase()}/admin/scrapers/start?source=${src}&headless=${headless}`, { method: 'POST' })
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

        const grid = document.getElementById('adm-scraper-grid');
        const alertArea = document.getElementById('captcha-alert-area');
        if (!grid) return;

        // Check for CAPTCHA or blocking
        const scrapers = d.scrapers || {};
        const anyCaptcha = Object.values(scrapers).some(s => s.status_message?.toLowerCase().includes('captcha'));
        
        if (anyCaptcha && alertArea && alertArea.innerHTML === '') {
            alertArea.innerHTML = `
                <div class="captcha-alert">
                    <i data-lucide="alert-triangle"></i>
                    <div style="flex:1">
                        <div style="font-weight:800; font-size:14px;">CAPTCHA DETECTED</div>
                        <div style="font-size:12px; opacity:0.8;">One or more scrapers require manual interaction. Use 'ENTER' to bypass or solve.</div>
                    </div>
                    <button class="btn-sc start" style="width:120px; height:36px; font-size:11px;" onclick="window._bypassCaptcha()">
                        <i data-lucide="corner-down-left"></i> ENTER
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            alertSound.play().catch(() => {});
        } else if (!anyCaptcha && alertArea) {
            alertArea.innerHTML = '';
        }

        const anyRunning = Object.values(scrapers).some(s => s.is_running);
        document.getElementById('adm-stop-all').disabled = !anyRunning;
        document.getElementById('adm-sync-all').disabled = anyRunning;

        grid.innerHTML = Object.entries(scrapers).map(([name, info]) => {
            const statusClass = info.is_running ? 'running' : (info.last_run ? 'completed' : 'stopped');
            return `
                <div class="scraper-card">
                    <div class="sc-header">
                        <span class="sc-title">${name.toUpperCase()}</span>
                        <span class="sc-status-pill ${statusClass}">${info.is_running ? 'Running' : (info.last_run ? 'Completed' : 'Idle')}</span>
                    </div>
                    
                    <div class="sc-stat-row">
                        <div class="sc-stat-item">
                            <div class="sc-stat-label">Found</div>
                            <div class="sc-stat-value">${info.total_tenders || 0}</div>
                        </div>
                        <div class="sc-stat-item">
                            <div class="sc-stat-label">Saved</div>
                            <div class="sc-stat-value" style="color:var(--accent-green)">${info.total_saved || 0}</div>
                        </div>
                    </div>

                    <div style="font-size:11px; color:var(--text-tertiary); font-weight:600;">
                        <i data-lucide="clock" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></i>
                        Last run: ${info.last_run ? new Date(info.last_run).toLocaleString() : 'Never'}
                    </div>

                    ${info.status_message ? `<div style="font-size:11px; color:var(--accent-orange); font-weight:700;">${info.status_message}</div>` : ''}

                    <div class="sc-actions">
                        <button class="btn-sc start" onclick="window._startScraper('${name}')" ${info.is_running ? 'disabled' : ''}>
                            <i data-lucide="play"></i> Start
                        </button>
                        <button class="btn-sc stop" onclick="window._stopScraper('${name}')" ${!info.is_running ? 'disabled' : ''}>
                            <i data-lucide="square"></i> Stop
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();

        // Google Card
        const gCard = document.getElementById('adm-google-card');
        if (gCard) {
            const g = d.google || {};
            gCard.innerHTML = `
                <div class="scraper-card" style="flex-direction:row; align-items:center; gap:24px;">
                    <div style="flex:1">
                        <div class="sc-title">AI RESEARCH ENGINE</div>
                        <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">Scans Google for material codification and AI insights</p>
                        ${g.status_message ? `<div style="margin-top:8px; font-size:12px; color:var(--accent-orange); font-weight:700;">${g.status_message}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button class="btn-sc stop" onclick="window._stopGoogle()" ${!g.running ? 'disabled' : ''}>Stop</button>
                        <button class="btn-sc start" onclick="window._startGoogle()" ${g.running ? 'disabled' : ''}>Launch Engine</button>
                    </div>
                </div>
            `;
        }

    } catch (e) { console.error(e); }
}

window._startScraper = async (source) => {
    const headless = localStorage.getItem('visible_tab') !== 'true';
    await adminFetch(`${getApiBase()}/admin/scrapers/start?source=${source}&headless=${headless}`, { method: 'POST' });
    await loadScraperStatus();
};
window._stopScraper = async (source) => {
    await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=${source}`, { method: 'POST' });
    await loadScraperStatus();
};
window._startGoogle = async () => {
    const headless = localStorage.getItem('visible_tab') !== 'true';
    await adminFetch(`${getApiBase()}/admin/scrapers/start?source=google&headless=${headless}`, { method: 'POST' });
    await loadScraperStatus();
};
window._stopGoogle = async () => {
    await adminFetch(`${getApiBase()}/admin/scrapers/stop?source=google`, { method: 'POST' });
    await loadScraperStatus();
};
window._bypassCaptcha = async () => {
    console.log('Sending bypass/enter signal...');
    // Implement backend endpoint for manual interaction if needed
    await adminFetch(`${getApiBase()}/admin/scrapers/interact?action=enter`, { method: 'POST' });
};
