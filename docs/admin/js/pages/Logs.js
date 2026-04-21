// ============================================================
// Admin Logs — Premium Live Stream
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let logTimer = null;

export async function renderLogs(container) {
    container.innerHTML = `
        <div class="scraper-header anim-in" style="margin-bottom:40px;">
            <h1 style="font-size:32px; font-weight:800; letter-spacing:-1px;">System Live Logs</h1>
            <p style="color:var(--text-tertiary); font-weight:500;">Real-time stream of crawler activity and extraction events</p>
        </div>

        <div class="log-controls anim-in anim-d1" style="display:flex; gap:16px; margin-bottom:32px; align-items:center;">
            <div style="flex:1; display:flex; gap:12px; align-items:center;">
                <select id="adm-log-source" class="search-input" style="width:200px; padding:0 12px; height:40px;">
                    <option value="">All Source Engines</option>
                    <option value="gem">GEM</option>
                    <option value="tender247">Tender247</option>
                    <option value="tenderdetail">TenderDetail</option>
                    <option value="tenderontime">TenderOnTime</option>
                    <option value="biddetail">BidDetail</option>
                    <option value="google">Google AI</option>
                </select>
                <button class="btn-icon" onclick="window._refreshLogs()">
                    <i data-lucide="refresh-cw"></i>
                </button>
            </div>
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; font-weight:700; color:var(--text-tertiary);">
                <div class="status-dot" style="background:var(--accent-green)"></div>
                Streaming Live
            </div>
        </div>

        <div class="log-container anim-in anim-d2" id="adm-log-viewer">
            <div style="padding:40px; text-align:center; color:var(--text-tertiary); font-family:var(--font-mono); font-size:12px;">Initializing log stream…</div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('adm-log-source')?.addEventListener('change', loadLogs);

    await loadLogs();
    if (logTimer) clearInterval(logTimer);
    logTimer = setInterval(loadLogs, 5000);

    const obs = new MutationObserver(() => {
        if (!document.getElementById('adm-log-viewer')) {
            clearInterval(logTimer);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}

async function loadLogs() {
    try {
        const source = document.getElementById('adm-log-source')?.value || '';
        let url = `${getApiBase()}/admin/logs?limit=50`;
        if (source) url += `&source=${source}`;

        const res = await adminFetch(url);
        if (!res.ok) return;
        const d = await res.json();

        const viewer = document.getElementById('adm-log-viewer');
        if (!viewer) return;

        if (!d.logs || d.logs.length === 0) {
            viewer.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-tertiary); font-family:var(--font-mono); font-size:12px;">No logs recorded for this source.</div>';
            return;
        }

        viewer.innerHTML = d.logs.map(l => {
            const date = new Date(l.started_at);
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const isError = l.status === 'failed';
            const isRunning = l.status === 'running';

            return `
                <div class="log-row">
                    <div class="log-time">${time}</div>
                    <div class="log-src" style="color:${isError ? 'var(--accent-red)' : (isRunning ? 'var(--accent-orange)' : 'var(--text-primary)')}">${l.source || 'SYS'}</div>
                    <div class="log-msg ${isError ? 'error' : ''}">
                        ${isRunning ? '⟳ ' : (isError ? '✗ ' : '✓ ')}
                        Found ${l.tenders_found || 0} tenders, saved ${l.tenders_saved || 0}.
                        <span style="opacity:0.6; font-size:11px; margin-left:8px;">${l.error_message || ''}</span>
                    </div>
                    <div class="log-status" style="color:${isError ? 'var(--accent-red)' : (isRunning ? 'var(--accent-orange)' : 'var(--accent-green)')}">
                        ${l.status.toUpperCase()}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (e) { console.error(e); }
}

window._refreshLogs = loadLogs;
