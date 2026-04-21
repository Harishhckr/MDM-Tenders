// ============================================================
// Admin Portal — API Utilities
// ============================================================

const REMOTE_URL = 'https://mdm-tenders.onrender.com/api';
const LOCAL_URL  = 'http://localhost:8000/api';
const KEY        = 'admin_api_backend';
const TOKEN_KEY  = 'admin_token';

export function getApiBase() {
    return localStorage.getItem(KEY) === 'local' ? LOCAL_URL : REMOTE_URL;
}
export function setApiBackend(mode) { localStorage.setItem(KEY, mode); }
export function getApiMode() { return localStorage.getItem(KEY) === 'local' ? 'local' : 'remote'; }

export function getToken()   { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t)  { localStorage.setItem(TOKEN_KEY, t); }
export function clearToken()  { localStorage.removeItem(TOKEN_KEY); }
export function isLoggedIn() { return !!getToken(); }

export async function adminFetch(url, opts = {}) {
    const token = getToken();
    const headers = { ...(opts.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401 || res.status === 403) {
        clearToken();
        window.location.hash = '#/login';
    }
    return res;
}
