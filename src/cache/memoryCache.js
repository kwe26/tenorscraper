class MemoryCache {
  constructor(options = {}) {
    this.ttlMs = Math.max(1000, Number(options.ttlMs || 60000));
    this.maxItems = Math.max(10, Number(options.maxItems || 500));
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  now() {
    return Date.now();
  }

  isExpired(entry) {
    return !entry || entry.expiresAt <= this.now();
  }

  pruneExpired() {
    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
      }
    }
  }

  get(key) {
    const entry = this.store.get(key);
    if (this.isExpired(entry)) {
      if (entry) {
        this.store.delete(key);
      }
      this.misses += 1;
      return null;
    }

    this.hits += 1;
    return entry.value;
  }

  set(key, value, ttlMs) {
    const finalTtl = Math.max(1000, Number(ttlMs || this.ttlMs));
    const expiresAt = this.now() + finalTtl;

    if (this.store.has(key)) {
      this.store.delete(key);
    }

    this.store.set(key, {
      value,
      expiresAt
    });

    if (this.store.size > this.maxItems) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }

    return value;
  }

  getOrSet(key, factory, ttlMs) {
    const existing = this.get(key);
    if (existing !== null) {
      return Promise.resolve({
        value: existing,
        cacheStatus: 'HIT'
      });
    }

    return Promise.resolve(factory()).then((value) => {
      this.set(key, value, ttlMs);
      return {
        value,
        cacheStatus: 'MISS'
      };
    });
  }

  stats() {
    this.pruneExpired();
    return {
      size: this.store.size,
      ttlMs: this.ttlMs,
      maxItems: this.maxItems,
      hits: this.hits,
      misses: this.misses
    };
  }
}

module.exports = MemoryCache;