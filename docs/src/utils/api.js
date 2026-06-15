// ============================================
// API Base URL Manager + Auth Header Helper
// ============================================

const REMOTE_URL = 'https://mdm-tenders.onrender.com/api';
const LOCAL_URL = 'http://localhost:8000/api';
const KEY = 'api_backend';

// ── Backend switcher ──────────────────────────────────────────────────────────
export function getApiBase() {
    return localStorage.getItem(KEY) === 'local' ? LOCAL_URL : REMOTE_URL;
}

export function setApiBackend(mode) {
    localStorage.setItem(KEY, mode);
}

export function getApiBackendMode() {
    return localStorage.getItem(KEY) === 'local' ? 'local' : 'remote';
}

export function isLocalMode() {
    return localStorage.getItem(KEY) === 'local';
}

// ── Token storage ─────────────────────────────────────────────────────────────
const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'leonex_user';

export function saveTokens(accessToken, refreshToken) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    // Eagerly decode and cache user info so any page can read it instantly
    const info = _decodePayload(accessToken);
    if (info) localStorage.setItem(USER_KEY, JSON.stringify(info));
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY) || '';
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY) || '';
}

export function clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
    return !!localStorage.getItem(ACCESS_KEY);
}

// ── JWT Client-Side Decoder (no library needed) ───────────────────────────────
/**
 * Decode a JWT payload without signature validation.
 * Returns the payload object or null on failure.
 */
function _decodePayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Returns the full decoded user info from the stored access token.
 * Fields: { sub, email, role, exp, iat, type }
 */
export function getUserInfo() {
    // Try cached version first (instant)
    try {
        const cached = localStorage.getItem(USER_KEY);
        if (cached) return JSON.parse(cached);
    } catch { }
    // Fallback: decode live
    return _decodePayload(getAccessToken());
}

/**
 * Returns the user's role: "admin" | "user" | null
 */
export function getUserRole() {
    return getUserInfo()?.role || null;
}

/**
 * Returns true if the logged-in user is an admin.
 */
export function isAdmin() {
    return getUserRole() === 'admin';
}

/**
 * Returns session expiry info.
 * { expiresAt: Date, remainingMs: number, remainingLabel: string }
 */
export function getSessionExpiry() {
    const info = getUserInfo();
    if (!info?.exp) return null;
    const expiresAt = new Date(info.exp * 1000);
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) return { expiresAt, remainingMs: 0, remainingLabel: 'Expired' };
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    return { expiresAt, remainingMs, remainingLabel: h > 0 ? `${h}h ${m}m` : `${m}m` };
}

// ── Authenticated fetch ───────────────────────────────────────────────────────
/**
 * Drop-in replacement for fetch() that automatically adds:
 *   Authorization: Bearer <access_token>
 * and retries once with a refreshed token on 401.
 */
export async function authFetch(url, options = {}) {
    const token = getAccessToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    let res = await fetch(url, { ...options, headers });

    // If 401 — try to refresh once
    if (res.status === 401) {
        const refreshed = await _tryRefresh();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${getAccessToken()}`;
            res = await fetch(url, { ...options, headers });
        } else {
            clearTokens();
            window.location.hash = '/login';
            throw new Error('Session expired. Please log in again.');
        }
    }

    return res;
}

async function _tryRefresh() {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
        const res = await fetch(`${getApiBase()}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        saveTokens(data.access_token, data.refresh_token);
        return true;
    } catch {
        return false;
    }
}
