const STORE_KEY = 'leonex_bookmarks';

export function getBookmarks() {
    try {
        const data = localStorage.getItem(STORE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error("Failed to parse bookmarks", err);
        return [];
    }
}

export function isBookmarked(identifier) {
    if (!identifier) return false;
    const bookmarks = getBookmarks();
    const idStr = String(identifier).trim();
    // identifier could be a tender_id or a href/link
    return bookmarks.some(b => {
        const bId = String(b.tender_id || b.link || '').trim();
        return bId === idStr;
    });
}

export function toggleBookmark(itemObj, typeStr = 'tender') {
    let bookmarks = getBookmarks();
    let state = false;
    
    if (!itemObj) return state;

    const identifier = itemObj.tender_id || itemObj.link;
    if (!identifier) {
        console.warn("Cannot bookmark item without tender_id or link:", itemObj);
        return state;
    }

    const idStr = String(identifier).trim();

    // ensure type is set for sorting later in Bookmark page
    if (!itemObj._bookType) itemObj._bookType = typeStr;

    const idx = bookmarks.findIndex(b => {
        const bId = String(b.tender_id || b.link || '').trim();
        return bId === idStr;
    });

    if (idx !== -1) {
        bookmarks.splice(idx, 1);
        state = false;
    } else {
        bookmarks.unshift(itemObj);
        state = true;
    }
    
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(bookmarks));
        console.log(`Bookmark ${state ? 'added' : 'removed'}:`, idStr);
    } catch(err) {
        console.error("Failed to save bookmark", err);
    }
    
    return state;
}
