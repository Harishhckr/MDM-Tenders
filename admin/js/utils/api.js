// ============================================================
// Admin Portal — API Utilities (Robust Version)
// ============================================================

const REMOTE_URL = 'https://mdm-tenders.onrender.com/api';
const LOCAL_URL  = 'http://127.0.0.1:8000/api'; // Use 127.0.0.1 instead of localhost to avoid IPv6 issues
const KEY        = 'admin_api_backend';
const TOKEN_KEY  = 'admin_token';

function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}
function safeSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
}
function safeRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
}

export function getApiBase() {
    return safeGet(KEY) === 'local' ? LOCAL_URL : REMOTE_URL;
}
export function setApiBackend(mode) { safeSet(KEY, mode); }
export function getApiMode() { return safeGet(KEY) === 'local' ? 'local' : 'remote'; }

export function getToken()   { return safeGet(TOKEN_KEY); }
export function setToken(t)  { safeSet(TOKEN_KEY, t); }
export function clearToken()  { safeRemove(TOKEN_KEY); }
export function isLoggedIn() { return !!getToken(); }

export async function adminFetch(url, opts = {}) {
    const token = getToken();
    const headers = { ...(opts.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(opts.body);
    }
    
    try {
        const res = await fetch(url, { ...opts, headers });
        if (res.status === 401 || res.status === 403) {
            clearToken();
            window.location.hash = '#/login';
        }
        return res;
    } catch (e) {
        console.error('Fetch Error:', e);
        if (getApiMode() === 'local' && window.location.protocol === 'https:') {
            alert('Mixed Content Error: You cannot connect to the local server (http) while hosting the UI on GitHub Pages (https). Please run the frontend locally (e.g., using Live Server) to use Local Mode.');
        } else {
            alert(`Connection Error: Could not reach the API at ${url}. Ensure the backend is running.`);
        }
        throw e;
    }
}
