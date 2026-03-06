import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function LoadingScreen() {
  const logoRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(logoRef.current, 
      { opacity: 0, scale: 0.8, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
    )
    tl.fromTo(barRef.current,
      { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    )
  }, [])

  return (
    <div className="loading-screen">
      <div ref={logoRef} className="loading-logo">⛨ VaultX</div>
      <div ref={barRef} className="loading-bar">
        <div className="loading-bar-fill"></div>
      </div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
        Initializing Vehicle Identity Shield...
      </p>
    </div>
  )
}
