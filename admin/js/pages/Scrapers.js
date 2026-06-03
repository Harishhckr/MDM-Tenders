// ============================================================
// Admin Scrapers — Premium Mission Control
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let pollTimer = null;

export async function renderScrapers(container) {
    container.innerHTML = `
        <div class="section-header anim-in">
            <div class="section-title">
                <i data-lucide="shield"></i> Scraper Control Panel
            </div>
            <div class="scraper-actions" style="margin-bottom:0; display:flex; align-items:center; gap:10px;">
                <button class="btn-refresh" id="adm-refresh" style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid rgba(255,255,255,0.1); border-radius:999px; padding:6px 12px; cursor:pointer; font-size:12px; display:flex; align-items:center; gap:6px;" title="Refresh Data">
                    <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Refresh
                </button>
                <button class="btn-stop-all" id="adm-stop-all" disabled>
                    <i data-lucide="x-circle" style="width:16px;height:16px;"></i> Stop All Engines
                </button>
                <button class="btn-sync-all" id="adm-sync-all">
                    <i data-lucide="zap" style="width:16px;height:16px;"></i> Sync All Sources
                </button>
            </div>
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
    // Auto-refresh disabled to improve UI performance

    const obs = new MutationObserver(() => {
        if (!document.getElementById('adm-scraper-grid')) {
            if (pollTimer) clearInterval(pollTimer);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    container.querySelector('#adm-refresh')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const icon = btn.querySelector('i');
        if (icon) icon.classList.add('spin');
        await loadScraperStatus();
        if (icon) icon.classList.remove('spin');
    });

    container.querySelector('#adm-sync-all')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:12px;height:12px;"></i> Syncing...';
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
            // First time render checker
            const requiresInitialRender = grid.children.length === 0;

            let htmlBuffer = '';

            Object.entries(tenderScrapers).forEach(([name, info]) => {
                const isRunning = info.is_running;
                const statusColor = isRunning ? '#10b981' : 'var(--text-tertiary)';
                const statusText = isRunning ? 'ENGINE ACTIVE' : 'STANDBY';
                const pulseAnim = isRunning ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : '';

                const safeId = 'adm-sc-' + name.replace(/[^a-zA-Z0-9]/g, '');
                const existing = document.getElementById(safeId);

                if (existing) {
                    // Soft Update
                    existing.style.borderColor = isRunning ? 'rgba(16,185,129,0.4)' : 'var(--border-glass)';

                    const scanline = existing.querySelector('.soft-scanline');
                    if (isRunning && !scanline) {
                        existing.insertAdjacentHTML('afterbegin', `<div class="soft-scanline" style="position:absolute; top:0; left:0; width:100%; height:2px; background: linear-gradient(90deg, transparent, #10b981, transparent); animation: scanline 2s linear infinite;"></div>`);
                    } else if (!isRunning && scanline) {
                        scanline.remove();
                    }

                    const dot = existing.querySelector('.soft-dot');
                    if (dot) {
                        dot.style.background = statusColor;
                        dot.style.boxShadow = `0 0 8px ${statusColor}`;
                        dot.style.animation = isRunning ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : '';
                    }

                    const badge = existing.querySelector('.soft-badge');
                    if (badge) {
                        badge.innerText = statusText;
                        badge.style.color = statusColor;
                    }

                    const extCount = existing.querySelector('.soft-ext');
                    if (extCount) extCount.innerText = (info.total_tenders || 0).toLocaleString();

                    const kwd = existing.querySelector('.soft-kwd');
                    if (kwd) kwd.innerText = info.last_keyword || 'N/A';

                    const syncNode = existing.querySelector('.soft-sync');
                    if (syncNode) syncNode.innerText = 'Sync: ' + (info.last_run ? new Date(info.last_run).toLocaleTimeString() : 'Never');

                    const startBtn = existing.querySelector('.sc-start');
                    const stopBtn = existing.querySelector('.sc-stop');

                    if (startBtn && stopBtn) {
                        if (isRunning) {
                            startBtn.disabled = true;
                            startBtn.style.background = 'rgba(255,255,255,0.02)';
                            startBtn.style.color = 'var(--text-tertiary)';
                            startBtn.style.cursor = 'not-allowed';

                            stopBtn.disabled = false;
                            stopBtn.style.background = 'rgba(239,68,68,0.1)';
                            stopBtn.style.color = '#ef4444';
                            stopBtn.style.cursor = 'pointer';
                        } else {
                            startBtn.disabled = false;
                            startBtn.style.background = 'var(--accent-blue)';
                            startBtn.style.color = '#fff';
                            startBtn.style.boxShadow = '0 4px 14px var(--accent-blue-dim)';
                            startBtn.style.cursor = 'pointer';

                            stopBtn.disabled = true;
                            stopBtn.style.background = 'rgba(255,255,255,0.02)';
                            stopBtn.style.color = 'var(--text-tertiary)';
                            stopBtn.style.cursor = 'not-allowed';
                        }
                    }

                } else {
                    // Initial Render
                    htmlBuffer += `
                    <div id="${safeId}" class="scraper-item anim-in" style="position:relative; overflow:hidden; border-color:${isRunning ? 'rgba(16,185,129,0.4)' : 'var(--border-glass)'}; display:flex; flex-direction:column; justify-content:space-between; padding:16px; background:var(--bg-card); border-radius:12px; transition:all 0.2s;">
                        ${isRunning ? `<div class="soft-scanline" style="position:absolute; top:0; left:0; width:100%; height:2px; background: linear-gradient(90deg, transparent, #10b981, transparent); animation: scanline 2s linear infinite;"></div>` : ''}
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <span class="sc-name" style="display:flex; align-items:center; gap:8px; font-size:14px; font-weight:800; color:var(--text-primary);">
                                <div class="soft-dot" style="width:8px; height:8px; border-radius:50%; background:${statusColor}; ${pulseAnim} box-shadow: 0 0 8px ${statusColor};"></div>
                                ${name}
                            </span>
                            <span class="soft-badge" style="font-size:9px; font-weight:800; letter-spacing:1px; color:${statusColor}; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:999px; border:1px solid rgba(255,255,255,0.05);">${statusText}</span>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
                            <div>
                                <div style="font-size:10px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; font-weight:700; margin-bottom:4px;">Extracted</div>
                                <div class="soft-ext" style="font-size:24px; font-weight:800; color:var(--text-primary); line-height:1; letter-spacing:-0.5px;">
                                    ${(info.total_tenders || 0).toLocaleString()}
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">
                                    KWD: <span class="soft-kwd" style="color:var(--text-primary); background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-family:var(--font-mono);">${info.last_keyword || 'N/A'}</span>
                                </div>
                                <div class="soft-sync" style="font-size:9px; color:var(--text-tertiary);">Sync: ${info.last_run ? new Date(info.last_run).toLocaleTimeString() : 'Never'}</div>
                            </div>
                        </div>

                        <div class="sc-controls" style="border-top:none; padding-top:0; margin:0; display:flex; width:100%; gap:8px;">
                            <button onclick="window._startScraper(event, '${name}')" class="sc-start" style="flex:1; height:32px; background:${isRunning ? 'rgba(255,255,255,0.02)' : 'var(--accent-blue)'}; color:${isRunning ? 'var(--text-tertiary)' : '#fff'}; border:none; ${!isRunning ? 'box-shadow: 0 4px 14px var(--accent-blue-dim);' : ''} border-radius:8px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:${isRunning ? 'not-allowed' : 'pointer'}; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;" ${isRunning ? 'disabled' : ''}>
                                <i data-lucide="play" style="width:12px;height:12px; fill:currentColor;"></i> Start
                            </button>
                            <button onclick="window._stopScraper(event, '${name}')" class="sc-stop" style="flex:1; height:32px; background:${!isRunning ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.1)'}; color:${!isRunning ? 'var(--text-tertiary)' : '#ef4444'}; border:${!isRunning ? 'none' : '1px solid rgba(239,68,68,0.2)'}; border-radius:8px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:${!isRunning ? 'not-allowed' : 'pointer'}; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;" ${!isRunning ? 'disabled' : ''}>
                                <i data-lucide="power" style="width:12px;height:12px;"></i> Abort
                            </button>
                        </div>
                    </div>`;
                }
            });

            if (requiresInitialRender && htmlBuffer) {
                grid.innerHTML = htmlBuffer + `
                <style>
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                    @keyframes scanline { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                </style>`;
            }
        }

        const gPanel = document.getElementById('adm-google-panel');
        if (gPanel) {
            const g = d.google || {};
            const isCaptcha = (g.message || '').toLowerCase().includes('captcha');
            const isRunning = g.running;

            if (isCaptcha && !window._captchaSoundPlayed) {
                const beep = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
                beep.volume = 0.5;
                beep.play().catch(() => { });
                window._captchaSoundPlayed = true;
            } else if (!isCaptcha) {
                window._captchaSoundPlayed = false;
            }

            // For Google Panel, we can afford innerHTML rebuilds ONLY if the HTML content fundamentally changes (e.g. captcha state).
            // But soft updates are better. Let's do a simple full innerHTML only if it's strictly necessary.
            // Since it's a single block, doing a targeted update is trivial via a hidden data attribute.
            const currentStateId = gPanel.getAttribute('data-state-id');
            const newStateId = `${isRunning}-${isCaptcha}-${g.message}`;

            if (currentStateId !== newStateId) {
                const statusColor = isRunning ? '#10b981' : (isCaptcha ? '#f59e0b' : 'var(--text-tertiary)');
                const statusText = isRunning ? (isCaptcha ? 'ACTION REQUIRED' : 'ENGINE ACTIVE') : 'STANDBY';
                const pulseAnim = isRunning ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : '';

                gPanel.setAttribute('data-state-id', newStateId);
                gPanel.innerHTML = `
                <div style="position:relative; overflow:hidden; border:1px solid ${isRunning ? (isCaptcha ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)') : 'var(--border-glass)'}; border-radius:16px; padding:16px; background:var(--bg-card);">
                    ${isRunning && !isCaptcha ? `<div style="position:absolute; top:0; left:0; width:100%; height:2px; background: linear-gradient(90deg, transparent, #10b981, transparent); animation: scanline 2s linear infinite;"></div>` : ''}

            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                        <div style="display:flex; align-items:center; gap:8px; font-weight:800; font-size:14px; color:var(--text-primary);">
                            <div style="width:8px; height:8px; border-radius:50%; background:${statusColor}; ${pulseAnim} box-shadow: 0 0 8px ${statusColor};"></div>
                            GOOGLE RESEARCH
                        </div>
                        <span style="font-size:10px; font-weight:800; letter-spacing:1px; color:${statusColor}; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:999px; border:1px solid rgba(255,255,255,0.05);">${statusText}</span>
                    </div>

                    <div style="font-size:15px; font-weight:500; color:var(--text-secondary); margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="info" style="width:16px;height:16px;"></i> ${g.message || 'Ready for deep research extraction'}
                    </div>

                    ${isCaptcha ? `
                                    <div class="captcha-box anim-in" style="max-width:400px; background:rgba(239, 68, 68, 0.05); border:1px solid rgba(239, 68, 68, 0.2); padding:16px; border-radius:12px; animation: pulse 2s infinite;">
                                        <div style="color:#ef4444; font-size:12px; font-weight:700; text-transform:uppercase; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                                            <i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> Security Check Required
                                        </div>
                                        <button class="captcha-btn" id="adm-clear-captcha-btn" onclick="window._submitCaptcha(event)" style="background:#ef4444; color:#fff; width:100%; height:36px; font-weight:800; text-transform:uppercase; letter-spacing:1px; display:flex; justify-content:center; align-items:center; gap:8px;">
                                            <i data-lucide="check-circle" style="width:16px;height:16px;"></i> I've Cleared the Captcha
                                        </button>
                                    </div>
                                ` : ''}
                </div>
                <div style="display:flex; flex-direction:column; gap:12px; min-width:140px; flex:1;">
                    ${isRunning ? `
                                    <button onclick="window._stopGoogle(event)" style="height:36px; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                                        <i data-lucide="power" style="width:12px;height:12px;"></i> Abort Sequence
                                    </button>
                                ` : `
                                    <button onclick="window._startGoogle(event)" style="height:36px; background:var(--accent-blue); color:#fff; border:none; box-shadow: 0 4px 14px var(--accent-blue-dim); border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:8px; transition:all 0.2s;">
                                        <i data-lucide="zap" style="width:12px;height:12px; fill:currentColor;"></i> Launch Engine
                                    </button>
                                `}
                </div>
            </div>
                    </div >
                `;
            }
        }
        if (window.lucide) window.lucide.createIcons();
    } catch (e) { console.error(e); }
}

window._startScraper = async (event, source) => {
    const btn = event.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:12px;height:12px;"></i>';
    if (window.lucide) window.lucide.createIcons();

    try {
        const isHeadless = localStorage.getItem('admin_headless') !== 'false';
        const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();
        await adminFetch(`${baseUrl} /admin/scrapers / start ? source = ${source}& headless=${isHeadless} `, { method: 'POST' });
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
    await adminFetch(`${baseUrl} /admin/scrapers / stop ? source = ${source} `, { method: 'POST' });
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
        const res = await adminFetch(`${baseUrl} /admin/scrapers / start ? source = google & headless=${isHeadless} `, { method: 'POST' });
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
    await adminFetch(`${baseUrl} /admin/scrapers / stop ? source = google`, { method: 'POST' });
    await loadScraperStatus();
};

window._submitCaptcha = async (event) => {
    const btn = event.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:12px;height:12px;"></i> Resuming...';
    if (window.lucide) window.lucide.createIcons();

    const isHeadless = localStorage.getItem('admin_headless') !== 'false';
    const baseUrl = !isHeadless ? 'http://localhost:8000/api' : getApiBase();

    try {
        await adminFetch(`${baseUrl} /admin/scrapers / captcha`, {
            method: 'POST',
            body: { answer: 'manual_clear' }
        });
    } catch (e) { console.error(e); }

    setTimeout(async () => {
        await loadScraperStatus();
    }, 2000);
};
