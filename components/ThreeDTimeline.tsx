"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface EffectParams {
  enabled: boolean;
  advance: number;  // 0-100 : time spacing between 3D slices
  ghost: number;    // 0-100 : opacity persistence of older slices
  depth: number;    // 0-200 : z spacing between slices
  size: number;     // 10-150 : scale of the video
  rotation: number; // -90..90 : Y rotation degrees
  x: number;        // -100..100 : horizontal offset
}

const LAYERS = 28;
const SLICE_W = 240;
const SLICE_H = 427;

/**
 * Real-time "3D timeline" effect:
 * while the video plays, frames are captured into a ring buffer at an
 * interval derived from `advance`; the last LAYERS frames are drawn as
 * textured planes receding in Z, fading out according to `ghost`.
 */
export default function ThreeDTimeline({
  videoRef,
  params,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  params: EffectParams;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const group = new THREE.Group();
    scene.add(group);

    const PLANE_W = 1.8;
    const PLANE_H = (PLANE_W * 16) / 9;
    const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);

    // ring buffer of slice textures
    const sliceCanvases: HTMLCanvasElement[] = [];
    const sliceCtxs: CanvasRenderingContext2D[] = [];
    const sliceTex: THREE.CanvasTexture[] = [];
    for (let i = 0; i < LAYERS; i++) {
      const c = document.createElement("canvas");
      c.width = SLICE_W;
      c.height = SLICE_H;
      sliceCanvases.push(c);
      sliceCtxs.push(c.getContext("2d")!);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      sliceTex.push(t);
    }

    const materials: THREE.MeshBasicMaterial[] = [];
    const planes: THREE.Mesh[] = [];
    for (let i = 0; i < LAYERS; i++) {
      const m = new THREE.MeshBasicMaterial({
        map: sliceTex[0],
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      materials.push(m);
      const mesh = new THREE.Mesh(geo, m);
      mesh.renderOrder = LAYERS - i;
      group.add(mesh);
      planes.push(mesh);
    }

    // faint wireframe box around the volume, like the reference UI
    const boxGeo = new THREE.BoxGeometry(PLANE_W, PLANE_H, 1);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const wire = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
    );
    group.add(wire);

    let writeIndex = 0;
    let lastCapture = 0;
    let raf = 0;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const animate = (now: number) => {
      raf = requestAnimationFrame(animate);
      const p = paramsRef.current;
      const video = videoRef.current;

      // capture interval: advance 0% -> 40ms, 100% -> 500ms between slices
      const interval = 40 + (p.advance / 100) * 460;

      if (video && video.readyState >= 2 && !video.paused && now - lastCapture >= interval) {
        const ctx = sliceCtxs[writeIndex];
        // cover-fit draw into the 9:16 slice
        const vw = video.videoWidth, vh = video.videoHeight;
        const targetRatio = SLICE_W / SLICE_H;
        const srcRatio = vw / vh;
        let sw = vw, sh = vh, sx = 0, sy = 0;
        if (srcRatio > targetRatio) {
          sw = vh * targetRatio;
          sx = (vw - sw) / 2;
        } else {
          sh = vw / targetRatio;
          sy = (vh - sh) / 2;
        }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, SLICE_W, SLICE_H);
        sliceTex[writeIndex].needsUpdate = true;
        writeIndex = (writeIndex + 1) % LAYERS;
        lastCapture = now;
      }

      // depth spacing: depth% 0..200 -> 0.02..0.42 z-units per slice
      const zGap = 0.02 + (p.depth / 200) * 0.4;
      const ghostBase = p.ghost / 100;

      for (let i = 0; i < LAYERS; i++) {
        const mesh = planes[i];
        const mat = materials[i];
        if (!p.enabled) {
          // flat mode: only the live front plane
          mesh.position.set(0, 0, 0);
          mat.map = sliceTex[(writeIndex - 1 + LAYERS) % LAYERS];
          mat.opacity = i === 0 ? 1 : 0;
          mesh.visible = i === 0;
          continue;
        }
        const texIdx = (writeIndex - 1 - i + LAYERS * 2) % LAYERS;
        mat.map = sliceTex[texIdx];
        mesh.position.set(0, 0, -i * zGap);
        // ghost: how persistent older slices are
        mat.opacity = Math.pow(Math.max(ghostBase, 0.02), i) * (i === 0 ? 1 : 0.85);
        mesh.visible = mat.opacity > 0.01;
      }

      // wireframe box spans the current depth
      const depthSpan = p.enabled ? (LAYERS - 1) * zGap : 0.02;
      wire.scale.set(1, 1, Math.max(depthSpan, 0.02));
      wire.position.z = -depthSpan / 2;
      wire.visible = p.enabled;

      group.rotation.y = THREE.MathUtils.degToRad(p.rotation);
      group.rotation.x = p.enabled ? -0.06 : 0;
      const s = p.size / 100;
      group.scale.set(s, s, s);
      group.position.x = (p.x / 100) * 1.6;
      // keep deep volumes framed
      group.position.z = p.enabled ? depthSpan / 2.4 : 0;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      boxGeo.dispose();
      edges.dispose();
      materials.forEach((m) => m.dispose());
      sliceTex.forEach((t) => t.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [videoRef]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
