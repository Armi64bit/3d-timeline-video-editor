"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { EffectParams } from "@/components/ThreeDTimeline";
import ControlsPanel from "@/components/ControlsPanel";
import TransportBar from "@/components/TransportBar";
import ImportModal from "@/components/ImportModal";

const ThreeDTimeline = dynamic(() => import("@/components/ThreeDTimeline"), { ssr: false });

const DEFAULT_PARAMS: EffectParams = {
  enabled: true,
  advance: 59,
  ghost: 100,
  depth: 95,
  size: 100,
  rotation: 35,
  x: 0,
};

export default function EditorPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [params, setParams] = useState<EffectParams>(DEFAULT_PARAMS);
  const [hasVideo, setHasVideo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackName, setTrackName] = useState("Rawayan\u2026");
  const [showImport, setShowImport] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [dropActive, setDropActive] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const loadVideo = useCallback((src: string, name: string, withAudio: boolean, isObjectUrl: boolean) => {
    const v = videoRef.current;
    if (!v) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    if (isObjectUrl) objectUrlRef.current = src;
    v.src = src;
    v.muted = !withAudio;
    v.loop = true;
    v.playsInline = true;
    setTrackName(name.length > 12 ? name.slice(0, 11) + "\u2026" : name);
    setHasVideo(true);
    setShowImport(false);
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const handleImport = useCallback((file: File | "sample", withAudio: boolean) => {
    if (file === "sample") {
      loadVideo("/sample.mp4", "Rawayan\u2026", withAudio, false);
    } else {
      loadVideo(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, ""), withAudio, true);
    }
  }, [loadVideo]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !hasVideo) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, [hasVideo]);

  const stop = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  // keyboard: space = play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("video/")) handleImport(f, true);
  };

  const assignPreset = () => {
    localStorage.setItem("3dt-preset", JSON.stringify(params));
  };

  useEffect(() => {
    const saved = localStorage.getItem("3dt-preset");
    if (saved) {
      try { setParams({ ...DEFAULT_PARAMS, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  return (
    <div className="editor-root">
      <div
        className={`stage ${dropActive ? "drop-active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
        onDragLeave={() => setDropActive(false)}
        onDrop={onDrop}
      >
        <div className="stage-tools">
          <button className="chip" onClick={() => setShowImport(true)}>
            <span className="icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.5-3.5L6 23" />
              </svg>
            </span>
            <span className="dots">\u22ee</span>
          </button>
          <button className="round-btn" onClick={() => setShowImport(true)} title="Add media">+</button>
          {!showPanel && (
            <button className="round-btn" onClick={() => setShowPanel(true)} title="Open controls" style={{ fontSize: 13 }}>\u2699</button>
          )}
        </div>

        <div className="aspect-tag">
          <span className="phone" />
          9:16
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>

        <div className="frame-9x16">
          <ThreeDTimeline videoRef={videoRef} params={params} />
          {!hasVideo && (
            <div className="drop-hint">
              <b>Drag &amp; drop a video here</b>
              <span>or use the + button to import a clip</span>
            </div>
          )}
        </div>

        {showPanel && hasVideo && (
          <ControlsPanel
            params={params}
            setParams={setParams}
            playing={playing}
            onTogglePlay={togglePlay}
            onClose={() => setShowPanel(false)}
            onAssignPreset={assignPreset}
            videoRef={videoRef}
          />
        )}
      </div>

      <TransportBar
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        trackName={trackName}
        onTogglePlay={togglePlay}
        onStop={stop}
        onClearTrack={() => {
          const v = videoRef.current;
          if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
          setHasVideo(false);
          setPlaying(false);
          setCurrentTime(0);
          setDuration(0);
        }}
      />

      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}

      {/* hidden source video */}
      <video ref={videoRef} style={{ display: "none" }} crossOrigin="anonymous" playsInline />
    </div>
  );
}
