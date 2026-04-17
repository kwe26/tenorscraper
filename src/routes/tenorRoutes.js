const express = require('express');
const { searchGifs, viewGif } = require('../scraper/tenorScraper');
const MemoryCache = require('../cache/memoryCache');

const router = express.Router();
const cache = new MemoryCache({
  ttlMs: Number(process.env.CACHE_TTL_SEC || 120) * 1000,
  maxItems: Number(process.env.CACHE_MAX_ITEMS || 400)
});

router.get('/cache/stats', (req, res) => {
  res.json({ cache: cache.stats() });
});

router.get('/search', async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();
    const page = Number(req.query.page || 1);

    if (!query) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Query parameter q is required'
      });
    }

    if (!Number.isFinite(page) || page < 1) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Query parameter page must be a number greater than 0'
      });
    }

    const cacheKey = `search:${query.toLowerCase()}:page:${page}`;
    const { value: payload, cacheStatus } = await cache.getOrSet(
      cacheKey,
      () => searchGifs(query, page)
    );

    res.set('X-Cache', cacheStatus);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get('/view', async (req, res, next) => {
  try {
    const rawUrl = (req.query.url || '').trim();

    if (!rawUrl) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Query parameter url is required (Tenor GIF page URL)'
      });
    }

    const cacheKey = `view:${rawUrl}`;
    const { value: payload, cacheStatus } = await cache.getOrSet(
      cacheKey,
      () => viewGif(rawUrl)
    );

    res.set('X-Cache', cacheStatus);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
