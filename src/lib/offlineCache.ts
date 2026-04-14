/**
 * offlineCache.ts — localStorage-based offline caching for AriaFood
 * Stores data locally so the app works offline. Syncs when reconnected.
 */

const CACHE_PREFIX = 'ariafood_cache_';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/**
 * Save data to local cache
 */
export function cacheSet<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
        console.warn('[AriaFood Cache] Failed to save:', e);
    }
}

/**
 * Get data from local cache
 */
export function cacheGet<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const entry: CacheEntry<T> = JSON.parse(raw);
        return entry.data;
    } catch (e) {
        console.warn('[AriaFood Cache] Failed to read:', e);
        return null;
    }
}

/**
 * Check if we're currently online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Register a callback for when the app comes back online
 */
export function onReconnect(callback: () => void): () => void {
    const handler = () => {
        console.log('[AriaFood] Reconnected! Syncing data...');
        callback();
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
}
