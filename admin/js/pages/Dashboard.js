// ============================================================
// Admin Dashboard — Live System Overview
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let refreshTimer = null;

export async function renderDashboard(container) {
    container.innerHTML = `
        <div class="section-title anim-in"><i data-lucide="activity"></i> System Overview</div>
        <div class="stat-grid anim-in anim-d1" id="adm-stats"></div>

        <div class="section-title anim-in anim-d2"><i data-lucide="bar-chart-3"></i> Tenders by Source</div>
        <div id="adm-source-grid" class="stat-grid anim-in anim-d2"></div>

        <div class="section-title anim-in anim-d3"><i data-lucide="scroll-text"></i> Recent Activity</div>
        <div class="adm-card anim-in anim-d3" id="adm-recent-logs"></div>
    `;
    if (window.lucide) window.lucide.createIcons();

    await loadDashboard();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadDashboard, 8000);

    // Stop polling when page changes
    const obs = new MutationObserver(() => {
        if (!document.getElementById('adm-stats')) {
            clearInterval(refreshTimer);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}

async function loadDashboard() {
    try {
        const res = await adminFetch(`${getApiBase()}/admin/dashboard`);
        if (!res.ok) return;
        const d = await res.json();

        const statsEl = document.getElementById('adm-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                ${statBox('Total Tenders', d.counts.tenders, 'cyan')}
                ${statBox('Google Results', d.counts.google_results, 'cyan')}
                ${statBox('Active Scrapers', d.active_scrapers, d.active_scrapers > 0 ? 'green' : '')}
                ${statBox('Tenders Today', d.today.tenders, 'green')}
                ${statBox('Google Today', d.today.google, 'green')}
                ${statBox('Total Users', d.counts.users, '')}
            `;
        }

        const srcEl = document.getElementById('adm-source-grid');
        if (srcEl) {
            const entries = Object.entries(d.tenders_by_source || {});
            srcEl.innerHTML = entries.length
                ? entries.map(([src, cnt]) => statBox(src.toUpperCase(), cnt, 'cyan')).join('')
                : '<div style="color:var(--text-tertiary);font-size:12px;font-family:var(--font-mono);padding:12px;">No source data</div>';
        }

        const logsEl = document.getElementById('adm-recent-logs');
        if (logsEl) {
            const logs = d.recent_logs || [];
            if (logs.length === 0) {
                logsEl.innerHTML = '<div style="padding:16px;color:var(--text-tertiary);font-size:12px;font-family:var(--font-mono);">No recent activity</div>';
            } else {
                logsEl.innerHTML = `
                    <table class="adm-table">
                        <thead><tr><th>Source</th><th>Status</th><th>Found</th><th>Saved</th><th>Started</th></tr></thead>
                        <tbody>
                            ${logs.map(l => `
                                <tr>
                                    <td style="color:var(--neon-cyan);font-weight:600;">${l.source || '—'}</td>
                                    <td><span class="badge ${l.status === 'completed' ? 'badge-ok' : l.status === 'running' ? 'badge-run' : 'badge-fail'}">${l.status}</span></td>
                                    <td>${l.tenders_found || 0}</td>
                                    <td>${l.tenders_saved || 0}</td>
                                    <td>${l.started_at ? new Date(l.started_at).toLocaleString() : '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        }
    } catch (e) {
        console.error('Dashboard load error:', e);
    }
}

function statBox(label, value, colorClass = '') {
    return `
        <div class="stat-box">
            <div class="stat-label">${label}</div>
            <div class="stat-value ${colorClass}">${typeof value === 'number' ? value.toLocaleString() : value}</div>
        </div>
    `;
}
