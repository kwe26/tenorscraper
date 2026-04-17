# Tenor Scraping API

A custom replacement API for basic Tenor-style GIF lookup using web scraping.

Includes:

- In-memory cache for `/search` and `/view`
- Tiny frontend playground at `/`
- Local Tailwind build pipeline (no Tailwind CDN)

## Endpoints

- `GET /search?q=<query>&page=<n>`
- `GET /view?url=<tenor-view-url>`
- `GET /cache/stats`
- `GET /health`

Example:

- `/search?q=onk&page=1`
- `/view?url=https://tenor.com/view/hello-gif-123456`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`.

3. Start the server:

```bash
npm start
```

Build frontend CSS:

```bash
npm run build
```

Dev watch for UI CSS:

```bash
npm run dev:ui
```

Server runs on `http://localhost:3000` by default.

## Notes

- This API scrapes public HTML and may break if Tenor changes markup.
- Keep request rates reasonable to avoid being rate-limited.
- `search` returns lightweight metadata and page URLs.
- `view` returns media URLs from page metadata (GIF and MP4 when available).
- `X-Cache` response header shows `HIT` or `MISS` for cached endpoints.
