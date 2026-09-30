"use client";

import { useEffect, useRef, useState } from "react";
import type { EffectParams } from "./ThreeDTimeline";

function Slider({
  label,
  value,
  min,
  max,
  unit = "%",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-row">
      <div className="slider-head">
        <span>{label}</span>
        <span className="val">{Math.round(value)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function ControlsPanel({
  params,
  setParams,
  playing,
  onTogglePlay,
  onClose,
  onAssignPreset,
  videoRef,
}: {
  params: EffectParams;
  setParams: (p: EffectParams) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onAssignPreset: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const [tab, setTab] = useState<"controls" | "effects">("controls");
  const stripRef = useRef<HTMLDivElement>(null);

  // live thumbnail strip sampled from the video
  useEffect(() => {
    const strip = stripRef.current;
    const video = videoRef.current;
    if (!strip) return;
    const canvases = Array.from(strip.querySelectorAll("canvas"));
    const ctxs = canvases.map((c) => c.getContext("2d")!);
    const id = setInterval(() => {
      if (!video || video.readyState < 2) return;
      for (const ctx of ctxs) ctx.drawImage(video, 0, 0, 22, 40);
    }, 400);
    return () => clearInterval(id);
  }, [videoRef]);

  const set = (patch: Partial<EffectParams>) => setParams({ ...params, ...patch });

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="p-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.5-3.5L6 23" />
          </svg>
        </span>
        Image &amp; Video
        <button className="close" onClick={onClose}>\u2715</button>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === "controls" ? "active" : ""}`} onClick={() => setTab("controls")}>Controls</button>
        <button className={`tab ${tab === "effects" ? "active" : ""}`} onClick={() => setTab("effects")}>Effects</button>
      </div>
      <div className="panel-body">
        <div className="thumb-strip" ref={stripRef}>
          {Array.from({ length: 8 }).map((_, i) => (
            <canvas key={i} width={22} height={40} />
          ))}
        </div>
        <button className="panel-play" onClick={onTogglePlay}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>
          )}
        </button>
        <div className="toggle-row">
          <button
            className={`switch ${params.enabled ? "on" : ""}`}
            onClick={() => set({ enabled: !params.enabled })}
            aria-label="3D timeline"
          />
          3D timeline
        </div>

        {tab === "controls" ? (
          <>
            <Slider label="Advance" value={params.advance} min={0} max={100} onChange={(v) => set({ advance: v })} />
            <Slider label="Ghost" value={params.ghost} min={0} max={100} onChange={(v) => set({ ghost: v })} />
            <Slider label="Depth" value={params.depth} min={0} max={200} onChange={(v) => set({ depth: v })} />
            <Slider label="Size" value={params.size} min={10} max={150} onChange={(v) => set({ size: v })} />
            <Slider label="Rotation" value={params.rotation} min={-90} max={90} unit="\u00b0" onChange={(v) => set({ rotation: v })} />
            <Slider label="X position" value={params.x} min={-100} max={100} onChange={(v) => set({ x: v })} />
            <button className="preset-btn" onClick={onAssignPreset}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" /><path d="m3 18 6-6-6-6" opacity=".5"/>
              </svg>
              Assign as preset
            </button>
          </>
        ) : (
          <>
            <div className="effect-card">
              <div>
                3D Timeline
                <div className="desc">Extrudes playback history into a rotating depth volume</div>
              </div>
              <button
                className={`switch ${params.enabled ? "on" : ""}`}
                onClick={() => set({ enabled: !params.enabled })}
              />
            </div>
            <div className="effect-card">
              <div>
                Ghost Trail
                <div className="desc">Semi-transparent afterimages along the time axis</div>
              </div>
              <button
                className={`switch ${params.ghost > 50 ? "on" : ""}`}
                onClick={() => set({ ghost: params.ghost > 50 ? 30 : 100 })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
