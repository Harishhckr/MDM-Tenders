// ============================================================
// Admin Logs — Live Crawl Log Viewer
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let logTimer = null;

export async function renderLogs(container) {
    container.innerHTML = `
        <div class="section-title anim-in">
            <i data-lucide="activity"></i> Engine Telemetry
        </div>

        <div style="display:flex; gap:12px; align-items:center; margin-bottom:24px;" class="anim-in anim-d1">
            <select id="adm-log-source" style="background:var(--bg-card);border:1px solid var(--border-glass);color:var(--text-primary);padding:10px 16px;border-radius:12px;font-size:14px;font-weight:600;outline:none;">
                <option value="">All Sources</option>
                <option value="gem">GEM</option>
                <option value="tender247">Tender247</option>
                <option value="tenderdetail">TenderDetail</option>
                <option value="tenderontime">TenderOnTime</option>
                <option value="biddetail">BidDetail</option>
            </select>
            <button class="btn-sync-all" onclick="window._refreshLogs()" style="padding:10px 16px; border-radius:12px;">
                <i data-lucide="refresh-cw" style="width:16px;height:16px;"></i> Refresh
            </button>
        </div>

        <div class="adm-card anim-in anim-d2" style="background:#000; border:1px solid var(--border-glass); border-radius:16px; overflow:hidden;">
            <div style="background:rgba(255,255,255,0.05); padding:12px 20px; font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; display:flex; gap:24px; border-bottom:1px solid var(--border-subtle);">
                <span style="width:140px;">Timestamp</span>
                <span style="width:100px;">Source</span>
                <span style="width:100px;">Status</span>
                <span style="flex:1;">Diagnostics</span>
            </div>
            <div class="log-viewer" id="adm-log-viewer" style="padding:20px; font-family:var(--font-mono); font-size:13px; max-height:600px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
                <div style="color:var(--text-tertiary);">Loading telemetry data...</div>
            </div>
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
            viewer.innerHTML = '<div style="color:var(--text-tertiary);">No telemetry data available.</div>';
            return;
        }

        viewer.innerHTML = d.logs.map(l => {
            const time = l.started_at ? new Date(l.started_at).toLocaleString() : '—';
            
            // Calculate duration
            let duration = '';
            if (l.started_at && l.completed_at) {
                const s = new Date(l.started_at);
                const e = new Date(l.completed_at);
                const diff = Math.round((e - s) / 1000);
                duration = ` <span style="color:var(--text-tertiary); font-size:11px;">(${diff}s)</span>`;
            }

            // Proper Color Correction for Status
            let statColor = 'var(--text-primary)';
            let bgStat = 'rgba(255,255,255,0.1)';
            if (l.status === 'failed') {
                statColor = '#ef4444'; // Red
                bgStat = 'rgba(239, 68, 68, 0.1)';
            } else if (l.status === 'running') {
                statColor = '#3b82f6'; // Blue
                bgStat = 'rgba(59, 130, 246, 0.1)';
            } else if (l.status === 'completed') {
                statColor = '#10b981'; // Green
                bgStat = 'rgba(16, 185, 129, 0.1)';
            }

            const errorHtml = l.error_message ? `<div style="color:#ef4444; margin-top:4px; font-size:11px; padding:4px 8px; background:rgba(239,68,68,0.05); border-radius:4px; border-left:2px solid #ef4444;">Err: ${l.error_message}</div>` : '';
            
            const keywordHtml = l.keyword ? `<span style="color:#8b5cf6; font-weight:600; margin-right:8px;">[${l.keyword}]</span>` : '';

            return `
                <div style="display:flex; gap:24px; color:var(--text-secondary); line-height:1.5; padding:8px 0; border-bottom:1px dashed var(--border-subtle);">
                    <span style="width:140px; color:var(--text-tertiary); font-size:12px;">${time}</span>
                    <span style="width:100px; font-weight:700; text-transform:uppercase; color:var(--text-primary); letter-spacing:0.5px;">${l.source || '?'}</span>
                    <span style="width:100px;">
                        <span style="color:${statColor}; background:${bgStat}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">${l.status}</span>
                        ${duration}
                    </span>
                    <span style="flex:1;">
                        <div style="display:flex; gap:16px;">
                            ${keywordHtml}
                            <span style="color:var(--text-primary);">Found: <strong style="color:#22d3ee;">${l.tenders_found || 0}</strong></span>
                            <span style="color:var(--text-primary);">Saved: <strong style="color:#10b981;">${l.tenders_saved || 0}</strong></span>
                            <span style="color:var(--text-tertiary);">Pages: ${l.pages_scanned || 0}</span>
                        </div>
                        ${errorHtml}
                    </span>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Log load error:', e);
    }
}

window._refreshLogs = loadLogs;
