// ============================================
// LEONEX TENDER — Hash-based SPA Router
// ============================================

const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
    routes[path] = handler;
}

export function navigate(path) {
    window.location.hash = path;
}

export function getCurrentRoute() {
    const raw = window.location.hash.slice(1) || '/login';
    const [path, query] = raw.split('?');
    return { path, query };
}

export function initRouter(container) {
    async function handleRoute() {
        const { path, query } = getCurrentRoute();
        const handler = routes[path] || routes['/login'];

        // Cleanup previous page
        if (currentCleanup && typeof currentCleanup === 'function') {
            currentCleanup();
            currentCleanup = null;
        }

        if (handler) {
            container.classList.remove('page-enter-active');
            container.classList.add('page-enter');

            // Pass query to handler
            const cleanup = await handler(container, query);
            if (typeof cleanup === 'function') {
                currentCleanup = cleanup;
            }

            // Trigger page transition
            requestAnimationFrame(() => {
                container.classList.add('page-enter-active');
                container.classList.remove('page-enter');
            });
        }

        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('data-route');
            if (href === path) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    return () => window.removeEventListener('hashchange', handleRoute);
}

// Auth guard
export function isAuthenticated() {
    return localStorage.getItem('leonex-auth') === 'true';
}

export function setAuthenticated(value) {
    localStorage.setItem('leonex-auth', value ? 'true' : 'false');
}
