"use client";

import { useRef, useState } from "react";

export default function ImportModal({
  onImport,
  onClose,
}: {
  onImport: (file: File | "sample", withAudio: boolean) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          Import Video
          <button onClick={onClose}>\u2715</button>
        </div>
        <div className="modal-body">
          <div className="modal-preview" onClick={() => inputRef.current?.click()} style={{ cursor: "pointer" }}>
            {previewUrl ? (
              <video src={previewUrl} muted autoPlay loop playsInline />
            ) : (
              <span>Click to choose a video file\u2026</span>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden-input"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="modal-actions">
            <button className="btn" onClick={() => file && onImport(file, false)} disabled={!file} style={{ opacity: file ? 1 : 0.4 }}>
              Import video only (no audio)
            </button>
            <button className="btn accent" onClick={() => file && onImport(file, true)} disabled={!file} style={{ opacity: file ? 1 : 0.4 }}>
              Import with audio synced
            </button>
          </div>
          <button className="btn" onClick={() => onImport("sample", true)}>
            Or load the sample clip
          </button>
        </div>
      </div>
    </div>
  );
}
