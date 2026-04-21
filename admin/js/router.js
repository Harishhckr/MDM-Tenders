// ============================================================
// Admin Portal — SPA Router
// ============================================================
import { isLoggedIn } from './utils/api.js';

const routes = {};
const publicRoutes = ['/login'];

export function registerRoute(path, handler) { routes[path] = handler; }

export async function navigate(path) {
    window.location.hash = '#' + path;
}

export async function handleRoute() {
    const hash = window.location.hash.slice(1) || '/login';
    const path = hash.split('?')[0];

    if (!isLoggedIn() && !publicRoutes.includes(path)) {
        window.location.hash = '#/login';
        return;
    }
    if (isLoggedIn() && path === '/login') {
        window.location.hash = '#/dashboard';
        return;
    }

    const handler = routes[path];
    if (handler) {
        const content = document.getElementById('admin-content');
        if (content) {
            content.innerHTML = '<div style="text-align:center;padding:80px;color:#555;font-family:var(--font-mono);font-size:12px;">Loading…</div>';
            await handler(content);
        }
    } else {
        window.location.hash = '#/dashboard';
    }

    // Highlight active sidebar nav
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.route === path);
    });
}

window.addEventListener('hashchange', handleRoute);
