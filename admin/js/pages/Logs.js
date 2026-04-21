// ============================================================
// Admin Logs — Premium Design
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

export async function renderLogs(container) {
    container.innerHTML = `
        <div class="anim-in">
            <div class="hero-tag">System Integrity</div>
            <h1 style="font-size:32px; font-weight:800; margin-bottom:12px;">Live System Logs</h1>
            <p style="color:var(--text-secondary); margin-bottom:32px;">Real-time monitoring of backend events and scraper execution.</p>

            <div class="adm-card" style="padding:0; overflow:hidden; border-radius:16px;">
                <div style="background:var(--bg-topbar); padding:12px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase;">Stream: Production Logs</div>
                    <button class="btn-admin" style="padding:6px 12px; font-size:11px;" onclick="window.location.reload()">
                        <i data-lucide="refresh-cw" style="width:12px;"></i> Clear View
                    </button>
                </div>
                <div class="log-viewer" id="adm-log-stream" style="height:600px; padding:24px; background:#000; font-family:'JetBrains Mono', monospace; font-size:12px; line-height:1.6; overflow-y:auto; color:#aaa;">
                    <div class="log-line"><span class="log-time">[${new Date().toLocaleTimeString()}]</span> <span class="log-src">SYSTEM</span> Waiting for events...</div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    startLogPolling();
}

async function startLogPolling() {
    const stream = document.getElementById('adm-log-stream');
    if (!stream) return;

    const poll = async () => {
        try {
            const res = await adminFetch(`${getApiBase()}/admin/logs?limit=50`);
            const logs = await res.json();
            if (logs.length > 0) {
                stream.innerHTML = logs.map(l => `
                    <div class="log-line">
                        <span class="log-time">[${l.timestamp?.split('T')[1]?.split('.')[0] || '—'}]</span>
                        <span class="log-src" style="color:var(--accent-purple);">${l.source?.toUpperCase()}</span>
                        <span class="log-msg ${l.level === 'error' ? 'error' : ''}">${l.message}</span>
                    </div>
                `).join('');
                stream.scrollTop = stream.scrollHeight;
            }
        } catch(e) {}
    };

    poll();
    const interval = setInterval(() => {
        if (!document.getElementById('adm-log-stream')) return clearInterval(interval);
        poll();
    }, 5000);
}
