// ============================================================
// Admin Logs — Live Crawl Log Viewer
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let logTimer = null;

export async function renderLogs(container) {
    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;" class="anim-in">
            <div class="section-title" style="margin-bottom:0;"><i data-lucide="scroll-text"></i> Crawl Logs</div>
            <div style="display:flex;gap:8px;align-items:center;">
                <select id="adm-log-source" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:6px 12px;border-radius:6px;font-size:12px;font-family:var(--font-mono);">
                    <option value="">All Sources</option>
                    <option value="gem">GEM</option>
                    <option value="tender247">Tender247</option>
                    <option value="tenderdetail">TenderDetail</option>
                    <option value="tenderontime">TenderOnTime</option>
                    <option value="biddetail">BidDetail</option>
                </select>
                <button class="btn-admin btn-cyan" onclick="window._refreshLogs()">
                    <i data-lucide="refresh-cw"></i> Refresh
                </button>
            </div>
        </div>
        <div class="log-viewer anim-in anim-d1" id="adm-log-viewer">
            <div style="color:var(--text-tertiary);">Loading logs…</div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('adm-log-source')?.addEventListener('change', loadLogs);

    await loadLogs();
    if (logTimer) clearInterval(logTimer);
    logTimer = setInterval(loadLogs, 6000);

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
        let url = `${getApiBase()}/admin/logs?limit=100`;
        if (source) url += `&source=${source}`;

        const res = await adminFetch(url);
        if (!res.ok) return;
        const d = await res.json();

        const viewer = document.getElementById('adm-log-viewer');
        if (!viewer) return;

        if (!d.logs || d.logs.length === 0) {
            viewer.innerHTML = '<div style="color:var(--text-tertiary);">No logs found.</div>';
            return;
        }

        viewer.innerHTML = d.logs.map(l => {
            const time = l.started_at ? new Date(l.started_at).toLocaleString() : '—';
            const msgClass = l.status === 'failed' ? 'error' : (l.status === 'completed' ? 'success' : '');
            const statusIcon = l.status === 'running' ? '⟳' : (l.status === 'completed' ? '✓' : '✗');
            const msg = `${statusIcon} ${l.status.toUpperCase()} — Found: ${l.tenders_found || 0}, Saved: ${l.tenders_saved || 0}${l.error_message ? ' — ' + l.error_message.substring(0, 120) : ''}`;

            return `
                <div class="log-line">
                    <span class="log-time">${time}</span>
                    <span class="log-src">${l.source || '?'}</span>
                    <span class="log-msg ${msgClass}">${msg}</span>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Log load error:', e);
    }
}

window._refreshLogs = loadLogs;
