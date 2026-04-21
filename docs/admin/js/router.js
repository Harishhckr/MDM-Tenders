// ============================================================
// Admin Portal — SPA Router
// ============================================================
import { isLoggedIn } from './utils/api.js';

const routes = {};
const publicRoutes = ['/login'];

export function registerRoute(path, handler) { 
    routes[path] = handler; 
}

export async function navigate(path) {
    window.location.hash = '#' + path;
}

export function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/login';
    const path = hash.split('?')[0];
    return { path, handler: routes[path] };
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
            content.innerHTML = '<div style="text-align:center;padding:80px;color:var(--text-tertiary);font-family:var(--font-mono);font-size:12px;">Loading Mission Control…</div>';
            await handler(content);
        }
    } else {
        window.location.hash = '#/dashboard';
    }

    // Highlight active sidebar nav
    document.querySelectorAll('.nav-item').forEach(el => {
        const onClickAttr = el.getAttribute('onclick');
        const routeAttr = onClickAttr ? onClickAttr.match(/'#(.*?)'/)?.[1] : null;
        if (routeAttr) {
            el.classList.toggle('active', path.includes(routeAttr));
        }
    });
}

window.addEventListener('hashchange', handleRoute);
