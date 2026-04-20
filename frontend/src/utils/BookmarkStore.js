const STORE_KEY = 'leonex_bookmarks';

export function getBookmarks() {
    try {
        const data = // localStorage removed
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error("Failed to parse bookmarks", err);
        return [];
    }
}

export function isBookmarked(identifier) {
    if (!identifier) return false;
    const bookmarks = getBookmarks();
    // identifier could be a tender_id or a href/link
    return bookmarks.some(b => b.tender_id === identifier || b.link === identifier);
}

export function toggleBookmark(itemObj, typeStr = 'tender') {
    let bookmarks = getBookmarks();
    let state = false;
    
    if (!itemObj) return state;

    const identifier = itemObj.tender_id || itemObj.link;
    if (!identifier) return state;

    // ensure type is set for sorting later in Bookmark page
    if (!itemObj._bookType) itemObj._bookType = typeStr;

    const idx = bookmarks.findIndex(b => (b.tender_id && b.tender_id === identifier) || (b.link && b.link === identifier));
    if (idx !== -1) {
        bookmarks.splice(idx, 1);
        state = false;
    } else {
        bookmarks.unshift(itemObj);
        state = true;
    }
    
    try {
        // localStorage removed);
    } catch(err) {
        console.error("Failed to save bookmark", err);
    }
    
    return state;
}
