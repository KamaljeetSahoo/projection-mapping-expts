# Projection Lab

Interactive projection-mapping experiments built for the web — installable as a PWA, designed for the *phone → AirPlay → projector* workflow.

## Try it now

**→ [kamaljeetsahoo.github.io/projection-mapping-expts](https://kamaljeetsahoo.github.io/projection-mapping-expts/)**

### Install as an app

The site is a PWA — once installed it launches fullscreen, works offline, and auto-updates in the background.

| Platform | How to install |
|---|---|
| **iOS Safari** | Open the link above → a bottom sheet will prompt you → or tap **Share** → **Add to Home Screen** |
| **Android Chrome** | Open the link → tap the **Install** banner that appears → or open the ⋮ menu → **Install app** |
| **Desktop Chrome / Edge** | Open the link → click the install icon in the address bar |

On Android, once installed, any `kamaljeetsahoo.github.io/projection-mapping-expts/...` link opens directly in the installed PWA. iOS doesn't support this handoff; tap the home-screen icon instead.

## What's inside

### Experiments

| # | Name | Description |
|---|---|---|
| 01 | Generative Art Canvas | Flow field, fractals, color blobs — auto-cycling generative modes |
| 02 | Music-Reactive Visualizer | 12 mic-driven visuals: waveform, spectrum, aurora, kaleidoscope, DNA helix, starfield, and more |
| 03 | Interactive Dashboard | Clock, weather, calendar, network stats, now-playing, rotating quotes |
| 04 | Projection-Mapped Geometry | 3D wireframes: cube grid, tunnel, shattered glass, floating panels, architecture |
| 05 | Motion-Reactive Wall | Webcam-driven ripples, glow trails, and repel physics |
| 06 | Immersive Room Transform | Full-wall scenes: underwater, deep space, enchanted forest |

### Tools

| # | Name | Description |
|---|---|---|
| T0 | **Projection Mapper Go** *(mobile)* | Tap-to-drop shapes, pinch to scale, two-finger twist to rotate, animate with pulse/rotate/drift/twinkle |
| T1 | Projection Mapper *(desktop)* | Click-to-draw polygons with solid / gradient / mesh / glow fills |

### Projection Mapper Go — 30-second tour

1. Tap any shape in the bottom palette → it drops on the canvas
2. **Drag** with one finger to move · **pinch** to scale · **two-finger twist** to rotate
3. **Tap** a shape → the properties sheet slides up: color swatches, fill style, animation, opacity
4. **Double-tap** to duplicate · **long-press** for the action menu (bring to front / send to back / delete)
5. Tap **▶ Play** (bottom-right) to hide all UI for pure projection output — tap anywhere to return

All scenes auto-save to IndexedDB locally.

## Tech stack

- **Vanilla JavaScript** — zero runtime dependencies
- **Vite 6** — multi-entry build, one bundle per experiment
- **vite-plugin-pwa** (Workbox) — precache, `NetworkFirst` HTML, `autoUpdate` service worker, install prompts
- **Canvas 2D · WebAudio · getUserMedia** for visuals and input
- **IndexedDB** for client-side persistence
- **GitHub Pages + Actions** for CI/CD (push to `main` = live in ~1 minute)

## Development

```bash
npm install
npm run dev        # starts localhost:3000
npm run build      # emits dist/ (includes sw.js, manifest, icons)
npm run preview    # serves dist/
```

Project layout:

```
projection-mapping-expts/
├── index.html                       landing
├── landing.js                       PWA install-prompt + SW register
├── vite.config.js                   multi-entry + VitePWA plugin
├── pwa-assets.config.js             icon generation
├── public/                          icon sources (SVG → PNG set)
└── experiments/
    ├── _shared/                     mobile-controls, pwa helpers
    ├── art / visualizer / dashboard
    ├── geometry / motion / immersive
    ├── go/                          Projection Mapper Go (mobile)
    └── mapper/                      Projection Mapper (desktop)
```

Each experiment is a standalone Vite entry with its own `index.html` + `main.js` + modes.

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml` → builds and publishes to GitHub Pages, usually live within one minute.

## Browser support

Target is modern evergreen browsers. Audio / camera experiments require HTTPS (GitHub Pages provides this). iOS 15.4+ for PWA `display: fullscreen` fallback to `standalone`.
