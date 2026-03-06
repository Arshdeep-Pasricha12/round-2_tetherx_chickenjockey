import { useEffect, useRef, useState, useCallback } from 'react'

const TOTAL_FRAMES = 192

function getFrameSrc(index) {
  const num = String(index + 1).padStart(4, '0')
  return `/frames/${num}.jpg`
}

export default function ScrollCanvas({ progress }) {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const [loaded, setLoaded] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const currentFrameRef = useRef(0)
  const rafRef = useRef(null)

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0
    const images = new Array(TOTAL_FRAMES)

    const onLoad = () => {
      loadedCount++
      setLoadProgress(loadedCount / TOTAL_FRAMES)
      if (loadedCount === TOTAL_FRAMES) {
        imagesRef.current = images
        setLoaded(true)
      }
    }

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = getFrameSrc(i)
      img.onload = onLoad
      img.onerror = onLoad
      images[i] = img
    }

    return () => {
      images.forEach(img => { img.onload = null; img.onerror = null })
    }
  }, [])

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imagesRef.current[frameIndex]
    if (!canvas || !ctx || !img) return

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const scale = Math.max(cw / iw, ch / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2

    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (loaded) drawFrame(currentFrameRef.current)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [loaded, drawFrame])

  useEffect(() => {
    if (!loaded) return
    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(progress * (TOTAL_FRAMES - 1))))
    if (frameIndex !== currentFrameRef.current) {
      currentFrameRef.current = frameIndex
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex))
    }
  }, [progress, loaded, drawFrame])

  useEffect(() => {
    if (loaded) { currentFrameRef.current = 0; drawFrame(0) }
  }, [loaded, drawFrame])

  return (
    <>
      {!loaded && (
        <div className="scroll-loading-screen">
          <div className="scroll-loading-text">INITIALIZING_IDENTITY_PROTOCOL...</div>
          <div className="scroll-loading-bar-track">
            <div className="scroll-loading-bar-fill" style={{ width: `${loadProgress * 100}%` }} />
          </div>
          <div className="scroll-loading-percent">{Math.round(loadProgress * 100)}%</div>
        </div>
      )}
      <div className="scroll-canvas-layer">
        <canvas ref={canvasRef} />
      </div>
    </>
  )
}
