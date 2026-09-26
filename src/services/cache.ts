interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class CacheService {
  private memCache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    this.hydrateFromSession();
  }

  private hydrateFromSession() {
    try {
      const keys = Object.keys(sessionStorage);
      const now = Date.now();
      for (const k of keys) {
        if (k.startsWith('srmilks_cache_')) {
          const raw = sessionStorage.getItem(k);
          if (raw) {
            const entry: CacheEntry<any> = JSON.parse(raw);
            if (entry.expiry > now) {
              const cleanKey = k.replace('srmilks_cache_', '');
              this.memCache.set(cleanKey, entry);
            } else {
              sessionStorage.removeItem(k);
            }
          }
        }
      }
    } catch {
      // sessionStorage might not be available in non-browser or private environments
    }
  }

  get<T>(key: string): T | null {
    const now = Date.now();
    const entry = this.memCache.get(key);
    if (!entry) return null;

    if (entry.expiry <= now) {
      this.del(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 3 * 60 * 1000): void {
    const expiry = Date.now() + ttlMs;
    const entry: CacheEntry<T> = { data, expiry };
    this.memCache.set(key, entry);

    try {
      // Keep small objects in sessionStorage for persistence across tab reloads
      const str = JSON.stringify(entry);
      if (str.length < 50000) {
        sessionStorage.setItem('srmilks_cache_' + key, str);
      }
    } catch {
      // Ignore sessionStorage quota errors
    }
  }

  del(key: string): void {
    this.memCache.delete(key);
    try {
      sessionStorage.removeItem('srmilks_cache_' + key);
    } catch {}
  }

  invalidatePattern(prefix: string): void {
    for (const key of Array.from(this.memCache.keys())) {
      if (key.startsWith(prefix)) {
        this.del(key);
      }
    }
  }

  clearAll(): void {
    this.memCache.clear();
    try {
      const keys = Object.keys(sessionStorage);
      for (const k of keys) {
        if (k.startsWith('srmilks_cache_')) {
          sessionStorage.removeItem(k);
        }
      }
    } catch {}
  }

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 3 * 60 * 1000): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetcher();
    this.set(key, fresh, ttlMs);
    return fresh;
  }
}

export const appCache = new CacheService();
