"use client";

function fmt(t: number) {
  if (!isFinite(t) || isNaN(t)) return "00:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TransportBar({
  currentTime,
  duration,
  playing,
  trackName,
  onTogglePlay,
  onStop,
  onClearTrack,
}: {
  currentTime: number;
  duration: number;
  playing: boolean;
  trackName: string;
  onTogglePlay: () => void;
  onStop: () => void;
  onClearTrack: () => void;
}) {
  return (
    <div className="transport">
      <div className="t-pill">
        <span className="dim">{fmt(currentTime)}</span> {fmt(duration)}
      </div>
      <div className="t-pill">
        125 <span className="dim">BPM</span>
      </div>
      <button className="t-btn" onClick={onStop} title="Stop">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
      </button>
      <button className="t-btn primary" onClick={onTogglePlay} title="Play / Pause">
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>
        )}
      </button>
      <div className="track-chip">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
        <span className="name">{trackName}</span>
        <button className="x" onClick={onClearTrack}>\u2715</button>
      </div>
      <button className="t-btn" title="Microphone">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
        </svg>
      </button>
    </div>
  );
}
