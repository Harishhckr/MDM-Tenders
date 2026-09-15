// ============================================================
// Emails.js — DEPRECATED STUB (safe fallback)
// This file is kept to prevent 404 errors from browsers loading
// a cached version of main.js that still imports this module.
// The Email tab has been removed from the Admin Portal UI.
// ============================================================

export async function renderEmails(container) {
    if (!container) return;
    container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; height:60vh; flex-direction:column; gap:16px;">
            <div style="font-size:48px; opacity:0.2;">📭</div>
            <div style="font-size:14px; color:var(--text-tertiary); font-family:var(--font-mono);">
                Email management has been removed. Please use System Logs.
            </div>
            <button onclick="window.location.hash='#/dashboard'" 
                style="margin-top:8px; padding:10px 24px; border-radius:10px; background:var(--text-primary); color:var(--bg-page); border:none; cursor:pointer; font-weight:700;">
                Return to Overview
            </button>
        </div>
    `;
}
