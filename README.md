# Hero prototype — 3D laptop + scroll

## Run it
```
npm install
npm run dev
```

## What's real vs. placeholder right now
- **Laptop**: procedural (built from Three.js boxes in `src/three/createLaptop.js`), not a real model yet. Swap-in instructions are in a comment at the top of that file — it's a one-function change to load a `.glb` via `GLTFLoader` instead.
- **Video**: the `<video>` tag points at `/demo-reel.mp4`, which doesn't exist yet. Drop any mp4 into `public/demo-reel.mp4` and it'll show up on the screen automatically (muted+looped so autoplay isn't blocked). Until then the screen just renders as a flat dark panel — see the fallback in `buildScreenMaterial()`.
- **Copy/branding**: "STUDIO | creative partners" and "ENGINEERING YOUR PRODUCTS" are placeholders standing in for the Magnify wordmark/tagline — swap the text in `index.html`.
- **Fonts**: Archivo (display) + Inter (body) via Google Fonts, picked to approximate the reference's thin geometric letterforms. Swap the `<link>` in `index.html` + the `--font-display`/`--font-body` tokens in `src/styles/main.css` if you want different faces.

## Structure
```
index.html                 hero markup (nav, headline, canvas mount point)
src/main.js                wires scene + GSAP ScrollTrigger together
src/styles/main.css         Tailwind v4 entry + @theme tokens + the handful of
                            things not expressible as utilities (nav ticks, blend mode)
src/three/setupScene.js    camera/renderer/lighting
src/three/createLaptop.js  the laptop mesh + video texture
```

## How the scroll animation works
`src/main.js` sets up one `ScrollTrigger` scrubbed to the hero section's scroll
range: as you scroll through the hero, the laptop rotates open toward the
camera and drifts up. It's intentionally a small, single timeline right now —
easy to extend with more scroll-linked keyframes (e.g. pinning the hero,
adding a second ScrollTrigger for a later section) once you've seen this in
the browser and know what direction you want to push it.

`prefers-reduced-motion` is respected — the scroll-linked timeline is skipped
entirely for users who've requested reduced motion (a static entrance
animation still plays once).

## Known follow-ups worth flagging
- Three.js pushes the JS bundle to ~175KB gzipped — fine for a prototype, but
  worth code-splitting (dynamic `import()`) once this hero is wired into a
  full multi-page site.
- No real 3D laptop asset yet — see the CC0 option linked in chat, or your
  own model.
