# PWA Icon Generation Guide

## QuickCopy PWA Icons

The PWA requires icon images in specific sizes. You have two options:

### Option 1: Use Online Generator (Recommended)

1. Go to [PWA Asset Generator](https://realfavicongenerator.net/) or [Maskable.app](https://maskable.app/)
2. Upload your logo/icon (512x512 px recommended)
3. Download the generated icons
4. Place these files in the `public/` folder:
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `apple-touch-icon.png`
   - `favicon.ico`

### Option 2: Use Command Line (if you have ImageMagick)

```bash
# Install ImageMagick first, then run:
magick convert public/pwa-icon.svg -resize 192x192 public/pwa-192x192.png
magick convert public/pwa-icon.svg -resize 512x512 public/pwa-512x512.png
magick convert public/pwa-icon.svg -resize 180x180 public/apple-touch-icon.png
```

### Option 3: Use Figma/Photoshop

1. Open the SVG file in your design tool
2. Export as PNG in these sizes:
   - 192x192 px → `public/pwa-192x192.png`
   - 512x512 px → `public/pwa-512x512.png`
   - 180x180 px → `public/apple-touch-icon.png`

### Required Files

After generating icons, your `public/` folder should contain:
- ✅ `pwa-192x192.png` - Android home screen icon
- ✅ `pwa-512x512.png` - Larger Android icon
- ✅ `apple-touch-icon.png` - iOS home screen icon
- ✅ `favicon.ico` - Browser favicon

---

## Testing Your PWA

After adding icons:

```bash
npm run build
npm run preview
```

Then open `http://localhost:4173` in Chrome/Edge and:
1. Check DevTools → Application → Manifest
2. Test "Add to Home Screen" prompt
3. Verify service worker is registered
