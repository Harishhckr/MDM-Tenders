// ============================================
// LEONEX — Theme Manager
// Persistent dark/light toggle with transitions
// ============================================

const THEME_KEY = 'leonex-theme';

export function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
}

export function toggleTheme() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';

    const root = document.documentElement;

    // Block ALL transitions across every element while theme variables swap.
    // setTimeout(0) fires AFTER the browser has painted the new theme.
    root.classList.add('no-transition');
    root.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);

    // Give the browser enough time to fully repaint before re-enabling transitions
    setTimeout(() => {
        root.classList.remove('no-transition');
    }, 300);

    return next;
}

export function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
}
