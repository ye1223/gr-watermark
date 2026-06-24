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
