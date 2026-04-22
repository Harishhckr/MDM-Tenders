// ============================================================
// Admin Scrapers — Premium Mission Control
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let pollTimer = null;

export async function renderScrapers(container) {
    container.innerHTML = `
        <div class="section-title anim-in">
            <i data-lucide="shield"></i> Scraper Control Panel
        </div>

        <div class="scraper-actions anim-in anim-d1">
            <button class="btn-stop-all" id="adm-stop-all" disabled>
                <i data-lucide="x-circle" style="width:16px;height:16px;"></i> Stop All Engines
            </button>
            <button class="btn-sync-all" id="adm-sync-all">
                <i data-lucide="zap" style="width:16px;height:16px;"></i> Sync All Sources
            </button>
        </div>

        <div class="section-title anim-in anim-d2">
            <i data-lucide="box"></i> Tender Source Engines
        </div>

        <div class="scraper-list anim-in anim-d2" id="adm-scraper-grid"></div>

        <div class="section-title anim-in anim-d3">
            <i data-lucide="search"></i> Google Research Scraper
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

    container.querySelector('#adm-sync-all')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Syncing...';
        if (window.lucide) window.lucide.createIcons();

        const isHeadless = localStorage.getItem('admin_headless') !== 'false';
        const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
        const sources = ['gem', 'tender247', 'tenderdetail', 'tenderontime', 'biddetail'];
        
        try {
            await Promise.all(sources.map(src => 
                adminFetch(`${baseUrl}/admin/scrapers/start?source=${src}&headless=${isHeadless}`, { method: 'POST' })
            ));
        } catch (err) { console.error(err); }
        
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
        await loadScraperStatus();
    });

    container.querySelector('#adm-stop-all')?.addEventListener('click', async () => {
        const isHeadless = localStorage.getItem('admin_headless') !== 'false';
        const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
        try {
            await adminFetch(`${baseUrl}/admin/scrapers/stop?source=all`, { method: 'POST' });
        } catch (e) { console.error(e); }
        await loadScraperStatus();
    });
}

async function loadScraperStatus() {
    try {
        const isHeadless = localStorage.getItem('admin_headless') !== 'false';
        const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
        
        let res = await adminFetch(`${baseUrl}/admin/scrapers/status`).catch(() => null);
        
        // Fallback: If local fetch failed or was unauthorized, try the primary backend
        if (!res || !res.ok) {
            res = await adminFetch(`${getApiBase()}/admin/scrapers/status`);
        }
        
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
                const isRunning = info.is_running;
                const statusColor = isRunning ? '#10b981' : 'var(--text-tertiary)';
                const statusText = isRunning ? 'ENGINE ACTIVE' : 'STANDBY';
                const pulseAnim = isRunning ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : '';

                return `
                    <div class="scraper-item anim-in" style="position:relative; overflow:hidden; border-color:${isRunning ? 'rgba(16,185,129,0.2)' : 'var(--border-glass)'};">
                        ${isRunning ? `<div style="position:absolute; top:0; left:0; width:100%; height:2px; background: linear-gradient(90deg, transparent, #10b981, transparent); animation: scanline 2s linear infinite;"></div>` : ''}
                        
                        <div class="sc-info-row" style="margin-bottom:8px;">
                            <span class="sc-name" style="display:flex; align-items:center; gap:8px;">
                                <div style="width:8px; height:8px; border-radius:50%; background:${statusColor}; ${pulseAnim} box-shadow: 0 0 8px ${statusColor};"></div>
                                ${name}
                            </span>
                            <span style="font-size:10px; font-weight:800; letter-spacing:1px; color:${statusColor}; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">${statusText}</span>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px;">
                            <div>
                                <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; font-weight:700; margin-bottom:4px;">Tenders Extracted</div>
                                <div style="font-size:32px; font-weight:800; color:var(--text-primary); line-height:1; letter-spacing:-1px;">
                                    ${(info.total_tenders || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div class="sc-time" style="background:rgba(255,255,255,0.02); padding:8px 12px; border-radius:8px; margin-bottom:16px; font-size:11px;">
                            <strong style="color:var(--text-secondary);">Last Sync:</strong> ${info.last_run ? new Date(info.last_run).toLocaleString() : 'Never'}
                        </div>

                        <div class="sc-controls" style="border-top:none; padding-top:0; gap:12px;">
                            ${isRunning ? `
                                <button onclick="window._stopScraper(event, '${name}')" style="flex:1; height:44px; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); border-radius:10px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                                    <i data-lucide="power" style="width:14px;height:14px;"></i> Abort Sequence
                                </button>
                            ` : `
                                <button onclick="window._startScraper(event, '${name}')" style="flex:1; height:44px; background:var(--text-primary); color:var(--bg-page); border:none; border-radius:10px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                                    <i data-lucide="play" style="width:14px;height:14px; fill:currentColor;"></i> Initialize Engine
                                </button>
                            `}
                        </div>
                    </div>
                `;
            }).join('') + `
                <style>
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                    @keyframes scanline { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                </style>
            `;
        }

        const gPanel = document.getElementById('adm-google-panel');
        if (gPanel) {
            const g = d.google || {};
            const isCaptcha = (g.message || '').toLowerCase().includes('captcha');
            
            if (isCaptcha && !window._captchaSoundPlayed) {
                const beep = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                beep.play().catch(()=>{});
                window._captchaSoundPlayed = true;
            } else if (!isCaptcha) {
                window._captchaSoundPlayed = false;
            }

            const isRunning = g.running;
            const statusColor = isRunning ? '#10b981' : (isCaptcha ? '#f59e0b' : 'var(--text-tertiary)');
            const statusText = isRunning ? (isCaptcha ? 'ACTION REQUIRED' : 'ENGINE ACTIVE') : 'STANDBY';
            const pulseAnim = isRunning ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : '';

            gPanel.innerHTML = `
                <div style="position:relative; overflow:hidden; border:1px solid ${isRunning ? (isCaptcha ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)') : 'var(--border-glass)'}; border-radius:16px; padding:24px; background:var(--bg-card);">
                    ${isRunning && !isCaptcha ? `<div style="position:absolute; top:0; left:0; width:100%; height:2px; background: linear-gradient(90deg, transparent, #10b981, transparent); animation: scanline 2s linear infinite;"></div>` : ''}
                    
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                                <div style="display:flex; align-items:center; gap:8px; font-weight:800; font-size:16px; color:var(--text-primary);">
                                    <div style="width:8px; height:8px; border-radius:50%; background:${statusColor}; ${pulseAnim} box-shadow: 0 0 8px ${statusColor};"></div>
                                    GOOGLE RESEARCH
                                </div>
                                <span style="font-size:10px; font-weight:800; letter-spacing:1px; color:${statusColor}; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">${statusText}</span>
                            </div>

                            <div style="font-size:15px; font-weight:500; color:var(--text-secondary); margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                                <i data-lucide="info" style="width:16px;height:16px;"></i> ${g.message || 'Ready for deep research extraction'}
                            </div>
                            
                            ${isCaptcha ? `
                                <div class="captcha-box" style="max-width:400px; background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); padding:16px; border-radius:12px;">
                                    <div style="color:#f59e0b; font-size:12px; font-weight:700; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                                        <i data-lucide="alert-triangle" style="width:14px;height:14px;"></i> Security Check
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <input type="text" id="adm-captcha-input" class="captcha-input" placeholder="Enter Captcha / OTP..." style="flex:1;">
                                        <button class="captcha-btn" onclick="window._submitCaptcha(event)" style="background:#f59e0b; color:#000;">Submit</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px; min-width:200px;">
                            ${isRunning ? `
                                <button onclick="window._stopGoogle(event)" style="height:44px; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); border-radius:10px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                                    <i data-lucide="power" style="width:14px;height:14px;"></i> Abort Sequence
                                </button>
                            ` : `
                                <button onclick="window._startGoogle(event)" style="height:44px; background:var(--text-primary); color:var(--bg-page); border:none; border-radius:10px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                                    <i data-lucide="zap" style="width:14px;height:14px; fill:currentColor;"></i> Launch Engine
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }
        if (window.lucide) window.lucide.createIcons();
    } catch (e) { console.error(e); }
}

window._startScraper = async (event, source) => {
    const btn = event.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i>';
    if (window.lucide) window.lucide.createIcons();

    try {
        const isHeadless = localStorage.getItem('admin_headless') !== 'false';
        const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
        await adminFetch(`${baseUrl}/admin/scrapers/start?source=${source}&headless=${isHeadless}`, { method: 'POST' });
    } catch (e) { console.error(e); }
    
    setTimeout(async () => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
        await loadScraperStatus();
    }, 1000);
};

window._stopScraper = async (event, source) => {
    const isHeadless = localStorage.getItem('admin_headless') !== 'false';
    const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
    await adminFetch(`${baseUrl}/admin/scrapers/stop?source=${source}`, { method: 'POST' });
    await loadScraperStatus();
};

window._startGoogle = async (event) => {
    const btn = event.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Launching...';
    if (window.lucide) window.lucide.createIcons();

    try {
        const isHeadless = localStorage.getItem('admin_headless') !== 'false';
        const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
        const res = await adminFetch(`${baseUrl}/admin/scrapers/start?source=google&headless=${isHeadless}`, { method: 'POST' });
        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            alert('Launch Failed: ' + (d.detail || 'Internal Server Error'));
        }
    } catch (e) {
        alert('Launch Error: ' + e.message);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
        await loadScraperStatus();
    }
};

window._stopGoogle = async (event) => {
    const isHeadless = localStorage.getItem('admin_headless') !== 'false';
    const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
    await adminFetch(`${baseUrl}/admin/scrapers/stop?source=google`, { method: 'POST' });
    await loadScraperStatus();
};

window._submitCaptcha = async (event) => {
    const el = document.getElementById('adm-captcha-input');
    if (!el || !el.value) return;
    
    const isHeadless = localStorage.getItem('admin_headless') !== 'false';
    const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
    
    await adminFetch(`${baseUrl}/admin/scrapers/captcha`, {
        method: 'POST',
        body: { answer: el.value }
    });
    el.value = '';
    await loadScraperStatus();
};
