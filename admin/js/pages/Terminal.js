// ============================================================
// Admin Terminal — Hacker Style Backend View
// ============================================================
import { getApiBase, adminFetch } from '../utils/api.js';

let termTimer = null;
let lastLogId = null;

export async function renderTerminal(container) {
    container.innerHTML = `
        <div class="section-header anim-in">
            <div class="section-title">
                <i data-lucide="terminal-square"></i> System Terminal
            </div>
            <div class="scraper-actions" style="margin-bottom:0;">
                <button class="btn-sync-all" onclick="document.getElementById('hacker-output').innerHTML=''" style="background:transparent; border:1px solid #10b981; color:#10b981;">
                    <i data-lucide="trash-2" style="width:16px;height:16px;"></i> Clear Buffer
                </button>
            </div>
        </div>

        <div class="adm-card anim-in anim-d1" style="background:#000; border:1px solid #10b981; border-radius:12px; overflow:hidden; position:relative; box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);">
            <div style="background:#051505; border-bottom:1px solid #10b981; padding:8px 16px; font-family:var(--font-mono); font-size:11px; color:#10b981; display:flex; justify-content:space-between; align-items:center;">
                <span>root@leonex-core:~# tail -f /var/log/syslog</span>
                <span style="opacity:0.7;">[ SYSTEM SECURED ]</span>
            </div>
            <div id="hacker-output" style="padding:16px; font-family:var(--font-mono); font-size:13px; color:#10b981; height:600px; overflow-y:auto; line-height:1.6; text-shadow: 0 0 5px rgba(16,185,129,0.5);">
                <div><span style="opacity:0.5;">${new Date().toISOString()}</span> [INIT] Booting remote access terminal...</div>
                <div><span style="opacity:0.5;">${new Date().toISOString()}</span> [AUTH] Handshake established. Secure connection true.</div>
                <div><span style="opacity:0.5;">${new Date().toISOString()}</span> [SYS] Listening for incoming telemetry...</div>
                <br>
            </div>
            <div style="position:absolute; bottom:0; left:0; width:100%; height:80px; background:linear-gradient(transparent, #000); pointer-events:none;"></div>
        </div>
        <style>
            #hacker-output::-webkit-scrollbar { width: 8px; }
            #hacker-output::-webkit-scrollbar-track { background: #000; }
            #hacker-output::-webkit-scrollbar-thumb { background: #10b981; border-radius: 4px; }
            .hacker-line { animation: typeLine 0.1s linear forwards; white-space: pre-wrap; word-break: break-all; }
            @keyframes typeLine { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
        </style>
    `;
    if (window.lucide) window.lucide.createIcons();

    await loadTerminalLogs();
    if (termTimer) clearInterval(termTimer);
    termTimer = setInterval(loadTerminalLogs, 1000);

    const obs = new MutationObserver(() => {
        if (!document.getElementById('hacker-output')) {
            clearInterval(termTimer);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}

async function loadTerminalLogs() {
    try {
        const res = await adminFetch(`${getApiBase()}/admin/system-logs`);
        if (!res.ok) return;
        const d = await res.json();
        const logs = d.logs || [];

        const out = document.getElementById('hacker-output');
        if (!out) return;

        let added = false;
        
        const currentLines = out.querySelectorAll('.hacker-line').length;
        
        if (logs.length > currentLines) {
            const newLogs = logs.slice(currentLines);
            newLogs.forEach(lineText => {
                let color = '#10b981'; // Green
                if (lineText.includes('ERROR')) color = '#ef4444';
                if (lineText.includes('WARNING')) color = '#f59e0b';
                
                const safeText = lineText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                out.innerHTML += `<div class="hacker-line" style="color:${color}">${safeText}</div>`;
                added = true;
            });
        } else if (logs.length < currentLines) {
            out.innerHTML = '';
            logs.forEach(lineText => {
                let color = '#10b981';
                if (lineText.includes('ERROR')) color = '#ef4444';
                if (lineText.includes('WARNING')) color = '#f59e0b';
                const safeText = lineText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                out.innerHTML += `<div class="hacker-line" style="color:${color}">${safeText}</div>`;
                added = true;
            });
        }

        if (added) {
            out.scrollTop = out.scrollHeight;
        }

    } catch (e) {
        // silent
    }
}
