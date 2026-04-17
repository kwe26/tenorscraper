const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = process.env.BASE_URL || 'https://tenor.com';
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

const http = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  }
});

function absoluteUrl(pathOrUrl) {
  try {
    return new URL(pathOrUrl, BASE_URL).toString();
  } catch (error) {
    return '';
  }
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
}

function extractMediaFromNextData(html) {
  const byId = [];
  const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);

  if (!match || !match[1]) {
    return byId;
  }

  try {
    const data = JSON.parse(match[1]);
    const texts = JSON.stringify(data);

    // Pull likely Tenor page links first, then derive IDs from them.
    const linkRegex = /https:\/\/tenor\.com\/view\/[^"\\\s]+/g;
    const links = texts.match(linkRegex) || [];

    for (const link of links) {
      const clean = link.replace(/\\u002F/g, '/');
      const idMatch = clean.match(/-gif-(\d+)$/i);
      const id = idMatch ? idMatch[1] : null;
      byId.push({
        id,
        url: clean,
        title: clean.split('/view/')[1]?.split('-gif-')[0]?.replace(/-/g, ' ') || null,
        preview: null
      });
    }
  } catch (error) {
    return [];
  }

  return byId;
}

function extractSearchCards(html) {
  const $ = cheerio.load(html);
  const cards = [];

  $('a[href*="/view/"]').each((_, node) => {
    const href = $(node).attr('href');
    const url = absoluteUrl(href);

    if (!url.includes('/view/')) {
      return;
    }

    const idMatch = url.match(/-gif-(\d+)$/i);
    const id = idMatch ? idMatch[1] : null;

    const img = $(node).find('img').first();
    const video = $(node).find('video source').first();

    const title =
      img.attr('alt') ||
      $(node).attr('aria-label') ||
      $(node).text().trim() ||
      null;

    const preview =
      video.attr('src') ||
      img.attr('src') ||
      img.attr('data-src') ||
      null;

    cards.push({
      id,
      title,
      url,
      preview: preview ? absoluteUrl(preview) : null
    });
  });

  return uniqueBy(cards, (item) => item.url);
}

async function fetchHtml(url) {
  const response = await http.get(url);
  return response.data;
}

async function searchGifs(query, page = 1) {
  const slug = `${query.toLowerCase().replace(/\s+/g, '-')}-gifs`;
  const searchUrl = `${BASE_URL}/search/${encodeURIComponent(slug)}?page=${page}`;

  const html = await fetchHtml(searchUrl);
  const fromCards = extractSearchCards(html);
  const fromJson = extractMediaFromNextData(html);

  const results = uniqueBy([...fromCards, ...fromJson], (item) => item.url)
    .filter((item) => item.url && item.url.includes('/view/'))
    .map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      preview: item.preview
    }));

  return {
    query,
    page,
    source: searchUrl,
    count: results.length,
    results
  };
}

function readMeta($, attrName, attrValue) {
  return $(`meta[${attrName}="${attrValue}"]`).attr('content') || null;
}

async function viewGif(gifPageUrl) {
  const normalizedUrl = absoluteUrl(gifPageUrl);

  if (!normalizedUrl.includes('tenor.com/view/')) {
    const error = new Error('Only tenor.com/view URLs are supported');
    error.status = 400;
    throw error;
  }

  const html = await fetchHtml(normalizedUrl);
  const $ = cheerio.load(html);

  const title = readMeta($, 'property', 'og:title') || $('title').text().trim() || null;
  const description = readMeta($, 'property', 'og:description');
  const mp4 = readMeta($, 'property', 'og:video') || readMeta($, 'property', 'og:video:url');
  const gif = readMeta($, 'property', 'og:image') || readMeta($, 'name', 'twitter:image');
  const relCanonical = $('link[rel="canonical"]').attr('href') || null;
  const ogUrl = readMeta($, 'property', 'og:url');
  const canonicalCandidate = relCanonical || ogUrl || normalizedUrl;
  const canonical = canonicalCandidate.includes('/view/') ? canonicalCandidate : normalizedUrl;

  return {
    source: normalizedUrl,
    title,
    description,
    media: {
      gif: gif ? absoluteUrl(gif) : null,
      mp4: mp4 ? absoluteUrl(mp4) : null
    },
    canonical
  };
}

module.exports = {
  searchGifs,
  viewGif
};
