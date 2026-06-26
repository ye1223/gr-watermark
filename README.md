# GR印迹

Ricoh GR photo frame watermark generator built with Next.js 15, Tailwind CSS, shadcn/ui, next-intl, next-themes, and next-pwa.

## Features

- Local image upload with JPG, PNG, WEBP, and HEIC support.
- EXIF parsing for camera model, focal length, aperture, shutter speed, ISO, and date.
- Canvas-based photo frame rendering with Ricoh logo watermark.
- Frame presets, output ratio selection, crop zoom, and crop positioning.
- Light, dark, and system themes.
- Chinese and English routes at `/zh` and `/en`.
- Static export and PWA support.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/zh`.

## Checks

```bash
npm run lint
npm run build
```

Stop the dev server before running `npm run build`, because Next.js and next-pwa both write build artifacts under `.next` during compilation.

## Analytics

Analytics is optional and disabled by default. Set `NEXT_PUBLIC_TRACK_ENDPOINT` to a lightweight collect API, for example the Cloudflare Worker endpoint currently used by production:

```bash
NEXT_PUBLIC_TRACK_ENDPOINT=https://to-ols.xyz/gr-watermark-analytics/collect
NEXT_PUBLIC_TRACK_SITE_ID=gr-watermark
```

Collection strategy:

- The tracker is failure-silent: missing endpoint, offline mode, blocked requests, or API errors must not affect upload, rendering, sharing, or download.
- The frontend only sends small product events: `page_view`, `upload_success`, `download_success`, `share_success`, `preset_change`, `card_mode_change`, and `brand_change`.
- Event payloads may include route path, locale, device type, selected preset, card mode, watermark mode, brand id, upload source, and Cloudflare country code.
- The tracker must not send images, generated files, filenames, raw EXIF values, camera serial data, subtitles, user-entered metadata text, IP addresses from the browser, or persistent user identifiers.
- The collector accepts only allowlisted event names, trims string fields, caps request body size, and stores events in Cloudflare D1.

`workers/analytics-api.js` contains the Cloudflare Worker collector, `workers/schema.sql` contains the matching D1 table schema, and `wrangler.jsonc` defines the Worker route and D1 binding.
