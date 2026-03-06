"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 192;

function getFrameSrc(index: number): string {
  const num = String(index + 1).padStart(4, "0");
  return `/frames/${num}.jpg`;
}

interface CamaroIdentityCanvasProps {
  progress: number; // 0–1
}

export default function CamaroIdentityCanvas({ progress }: CamaroIdentityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    const onLoad = () => {
      loadedCount++;
      setLoadProgress(loadedCount / TOTAL_FRAMES);
      if (loadedCount === TOTAL_FRAMES) {
        imagesRef.current = images;
        setLoaded(true);
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = onLoad;
      img.onerror = onLoad; // count errors too so we don't block forever
      images[i] = img;
    }

    return () => {
      // cleanup
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, []);

  // Draw frame on canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imagesRef.current[frameIndex];
    if (!canvas || !ctx || !img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // "cover" logic
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  // Resize canvas to match window
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (loaded) {
        drawFrame(currentFrameRef.current);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [loaded, drawFrame]);

  // Update frame based on progress
  useEffect(() => {
    if (!loaded) return;
    const frameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(progress * (TOTAL_FRAMES - 1)))
    );
    if (frameIndex !== currentFrameRef.current) {
      currentFrameRef.current = frameIndex;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        drawFrame(frameIndex);
      });
    }
  }, [progress, loaded, drawFrame]);

  // Draw first frame once loaded
  useEffect(() => {
    if (loaded) {
      currentFrameRef.current = 0;
      drawFrame(0);
    }
  }, [loaded, drawFrame]);

  return (
    <>
      {/* Loading screen */}
      {!loaded && (
        <div className="loading-screen">
          <div className="loading-text">INITIALIZING_IDENTITY_PROTOCOL...</div>
          <div className="loading-bar-track">
            <div
              className="loading-bar-fill"
              style={{ width: `${loadProgress * 100}%` }}
            />
          </div>
          <div className="loading-percent">
            {Math.round(loadProgress * 100)}%
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="canvas-layer">
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
