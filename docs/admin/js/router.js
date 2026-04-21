// ============================================================
// Admin Portal — SPA Router (Robust Version)
// ============================================================
import { isLoggedIn } from './utils/api.js';

const routes = {};
const publicRoutes = ['/login'];

export function registerRoute(path, handler) { 
    console.log('[Router] Registering:', path);
    routes[path] = handler; 
}

export async function navigate(path) {
    window.location.hash = '#' + path;
}

export function getCurrentRoute() {
    try {
        const hash = window.location.hash.slice(1) || '';
        const path = hash.split('?')[0] || '/dashboard';
        return { path, handler: routes[path] };
    } catch (e) {
        return { path: '/dashboard', handler: routes['/dashboard'] };
    }
}

export async function handleRoute() {
    try {
        const hash = window.location.hash.slice(1) || '';
        let path = hash.split('?')[0] || '/dashboard';
        if (path === '' || path === '/') path = '/dashboard';

        console.log('[Router] Handling Route:', path);

        const loggedIn = isLoggedIn();
        if (!loggedIn && !publicRoutes.includes(path)) {
            console.log('[Router] Unauthenticated - Redirecting to /login');
            window.location.hash = '#/login';
            return;
        }
        if (loggedIn && path === '/login') {
            window.location.hash = '#/dashboard';
            return;
        }

        const handler = routes[path] || (loggedIn ? routes['/dashboard'] : routes['/login']);
        const content = document.getElementById('admin-content');
        
        if (content && handler) {
            content.innerHTML = `<div style="text-align:center;padding:100px;color:#666;font-family:monospace;font-size:13px;">SYNCHRONIZING ${path.toUpperCase()}...</div>`;
            await handler(content);
        } else if (!handler) {
            console.warn('[Router] No handler for:', path);
            if (loggedIn) window.location.hash = '#/dashboard';
            else window.location.hash = '#/login';
        }
        
        // Highlight active sidebar nav
        document.querySelectorAll('.nav-item').forEach(el => {
            const onClickAttr = el.getAttribute('onclick') || '';
            const isMatch = onClickAttr.includes(`'#${path}'`) || (path === '/dashboard' && onClickAttr.includes('Overview'));
            el.classList.toggle('active', isMatch);
        });
    } catch (err) {
        console.error('[Router] Fatal Error:', err);
        const content = document.getElementById('admin-content');
        if (content) content.innerHTML = `<div style="padding:40px;color:red;font-family:monospace;">ROUTING_ERROR: ${err.message}</div>`;
    }
}

window.addEventListener('hashchange', handleRoute);
