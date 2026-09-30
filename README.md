# 3D Timeline Video Editor

A real-time browser video editor that recreates the **3D Timeline** effect: your
video's playback history is extruded into a rotating 3D depth volume with
ghost-trail afterimages — rendered live with WebGL (Three.js) in a Next.js app.

## Features

- **3D Timeline effect in real time** — frames are captured into a ring buffer
  while the video plays and drawn as textured planes receding in Z:
  - **Advance** — time spacing between slices (40 ms → 500 ms)
  - **Ghost** — opacity persistence of older slices (the trail)
  - **Depth** — Z distance between slices (up to 200 %)
  - **Size**, **Rotation**, **X position** — volume transform
- **9:16 canvas** on a dark dotted-grid stage with rounded phone frame
- **Transport bar** — time, BPM, stop, play/pause, track chip, mic
- **Controls / Effects panel** — thumbnail strip, lime toggle, sliders,
  *Assign as preset* (saves to localStorage)
- **Import modal** — *Import video only (no audio)* / *Import with audio synced*
- **Drag & drop** a video straight onto the stage
- `Space` toggles play/pause

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Static export:

```bash
npm run build      # outputs to out/
```

## Tech

Next.js 14 (App Router, static export) · React 18 · TypeScript · Three.js
