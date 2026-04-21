// ============================================
// API Base URL Manager
// Reads from localStorage so user can switch
// between Local (visible browser) and Render
// ============================================

const REMOTE_URL = 'https://mdm-tenders.onrender.com/api';
const LOCAL_URL  = 'http://localhost:8000/api';
const KEY        = 'api_backend';

export function getApiBase() {
    return localStorage.getItem(KEY) === 'local' ? LOCAL_URL : REMOTE_URL;
}

export function setApiBackend(mode) {
    // mode: 'local' | 'remote'
    localStorage.setItem(KEY, mode);
}

export function getApiBackendMode() {
    return localStorage.getItem(KEY) === 'local' ? 'local' : 'remote';
}

export function isLocalMode() {
    return localStorage.getItem(KEY) === 'local';
}
