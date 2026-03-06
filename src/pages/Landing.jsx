import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Link2, Radio, AlertTriangle, ChevronDown } from 'lucide-react'
import ScrollCanvas from '../components/ScrollCanvas'

/* ──────── Smooth spring helper ──────── */
function useSmoothProgress(scrollYProgress) {
  return useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
}

/* ──────── Beat overlay ──────── */
function Beat({ progress, fadeIn, fadeOut, children, center }) {
  const opacity = useTransform(progress, [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]], [0, 1, 1, 0])
  return (
    <motion.div className={`beat-overlay ${center ? 'center-layout' : ''}`} style={{ opacity }}>
      {children}
    </motion.div>
  )
}

/* ──────── Concentric Rings ──────── */
function ConcentricRings({ progress }) {
  const scale1 = useTransform(progress, [0.25, 0.45], [0.3, 1])
  const scale2 = useTransform(progress, [0.27, 0.45], [0.2, 1])
  const scale3 = useTransform(progress, [0.29, 0.45], [0.1, 1])
  const ringOpacity = useTransform(progress, [0.25, 0.30, 0.42, 0.47], [0, 1, 1, 0])
  const op1 = useTransform(scale1, [0, 1], [0.8, 0.2])
  const op2 = useTransform(scale2, [0, 1], [0.8, 0.3])
  const op3 = useTransform(scale3, [0, 1], [0.8, 0.4])

  return (
    <motion.div className="rings-container" style={{ opacity: ringOpacity }}>
      <motion.div className="ring green" style={{ scale: scale1, opacity: op1 }} />
      <motion.div className="ring green" style={{ scale: scale2, opacity: op2 }} />
      <motion.div className="ring green" style={{ scale: scale3, opacity: op3 }} />
      <motion.div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 20px var(--accent-green), 0 0 40px rgba(0,255,136,0.3)' }} />
    </motion.div>
  )
}

/* ──────── Dashboard HUD ──────── */
const HUD_ITEMS = [
  { label: 'IDENTITY_VERIFIED', color: 'green' },
  { label: 'TOKEN: AUTHORIZED', color: 'blue' },
  { label: 'INSURANCE: VALID', color: 'green' },
  { label: 'OWNERSHIP: CONFIRMED', color: 'blue' },
  { label: 'ENGINE_START: READY', color: 'green' },
]

function DashHUDItem({ progress, label, color, index }) {
  const itemOpacity = useTransform(progress, [0.50 + index * 0.02, 0.52 + index * 0.02, 0.67, 0.72], [0, 1, 1, 0])
  const itemX = useTransform(progress, [0.50 + index * 0.02, 0.52 + index * 0.02], [30, 0])

  return (
    <motion.div className="dash-item" style={{ opacity: itemOpacity, x: itemX }}>
      <span className={`dash-dot ${color}`} />
      <span>{label}</span>
    </motion.div>
  )
}

function DashboardHUD({ progress }) {
  const hudOpacity = useTransform(progress, [0.50, 0.55, 0.67, 0.72], [0, 1, 1, 0])

  return (
    <motion.div className="dashboard-overlay-hud" style={{ opacity: hudOpacity }}>
      {HUD_ITEMS.map((item, i) => (
        <DashHUDItem key={item.label} progress={progress} label={item.label} color={item.color} index={i} />
      ))}
    </motion.div>
  )
}

/* ──────── Data Stream Lines ──────── */
const STREAM_LINES = [
  { top: '12%', width: '65%', left: '5%' },
  { top: '23%', width: '80%', left: '10%' },
  { top: '34%', width: '55%', left: '20%' },
  { top: '45%', width: '90%', left: '2%' },
  { top: '56%', width: '70%', left: '15%' },
  { top: '67%', width: '60%', left: '25%' },
  { top: '78%', width: '85%', left: '8%' },
  { top: '89%', width: '50%', left: '12%' },
]

function StreamLineItem({ progress, top, width, left }) {
  const lineX = useTransform(progress, [0.75, 0.95], ['-100%', '100%'])
  return <motion.div className="stream-line" style={{ top, width, left, x: lineX }} />
}

function DataStream({ progress }) {
  const streamOpacity = useTransform(progress, [0.75, 0.80, 0.92, 0.97], [0, 1, 1, 0])
  return (
    <motion.div className="data-stream" style={{ opacity: streamOpacity }}>
      {STREAM_LINES.map((line, i) => (
        <StreamLineItem key={i} progress={progress} top={line.top} width={line.width} left={line.left} />
      ))}
    </motion.div>
  )
}

/* ──────── CTA Overlay ──────── */
function CTAOverlay({ progress }) {
  const ctaOpacity = useTransform(progress, [0.92, 0.97], [0, 1])
  return (
    <motion.div className="beat-overlay center-layout" style={{ opacity: ctaOpacity }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Ready to explore <span className="gradient-text">VaultX</span>?
        </h2>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/vault" className="btn btn-primary btn-lg"><Shield size={18} /> Vehicle Vault</Link>
          <Link to="/ownership" className="btn btn-secondary btn-lg"><Link2 size={18} /> Ownership Chain</Link>
          <Link to="/sos" className="btn btn-danger btn-lg"><Radio size={18} /> SOS</Link>
          <Link to="/stolen" className="btn btn-secondary btn-lg"><AlertTriangle size={18} /> Alerts</Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ──────────────────── MAIN PAGE ──────────────────── */
export default function Landing() {
  const containerRef = useRef(null)
  const [progressValue, setProgressValue] = useState(0)

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
  const smoothProgress = useSmoothProgress(scrollYProgress)
  const canvasProgress = useTransform(scrollYProgress, [0, 1], [0, 1])

  useEffect(() => {
    const unsubscribe = canvasProgress.on('change', v => setProgressValue(v))
    return unsubscribe
  }, [canvasProgress])

  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <>
      <div ref={containerRef} className="scroll-container">
        <div className="sticky-wrapper">
          <ScrollCanvas progress={progressValue} />

          {/* Cinematic overlays */}
          <div className="vignette" />
          <div className="scanline" />

          {/* Scroll hint at start */}
          <motion.div className="scroll-hint" style={{ opacity: useTransform(smoothProgress, [0, 0.05], [1, 0]) }}>
            <ChevronDown size={24} />
            <span>SCROLL TO EXPLORE</span>
          </motion.div>

          {/* Beat A — LEGACY MEETS LOGIC (0–20%) */}
          <Beat progress={smoothProgress} fadeIn={[0.0, 0.03]} fadeOut={[0.17, 0.22]}>
            <div className="beat-badge blue">◆ SYSTEM ONLINE</div>
            <h1 className="beat-title">LEGACY<br />MEETS LOGIC</h1>
            <p className="beat-subtitle">
              Defining the future of vehicle identity.
              Where heritage engineering converges with
              next-generation connected security.
            </p>
          </Beat>

          {/* Beat B — SECURE ENTRY (25–45%) */}
          <Beat progress={smoothProgress} fadeIn={[0.23, 0.28]} fadeOut={[0.42, 0.47]}>
            <div className="beat-badge green">● BIOMETRIC_AUTHORIZED</div>
            <h1 className="beat-title">SECURE<br />ENTRY</h1>
            <p className="beat-subtitle">
              Multi-factor biometric verification
              for authorized access. Identity confirmed
              at every touchpoint.
            </p>
          </Beat>
          <ConcentricRings progress={smoothProgress} />

          {/* Beat C — OWNER_TOKEN: ACTIVE (50–70%) */}
          <Beat progress={smoothProgress} fadeIn={[0.48, 0.53]} fadeOut={[0.67, 0.72]}>
            <div className="beat-badge blue">◈ TOKEN: AUTHORIZED</div>
            <h1 className="beat-title">OWNER_TOKEN:<br />ACTIVE</h1>
            <p className="beat-subtitle">
              Real-time verification of ownership
              and insurance validity. Every credential,
              cryptographically secured.
            </p>
          </Beat>
          <DashboardHUD progress={smoothProgress} />

          {/* Beat D — FULLY INTEGRATED (75–95%) */}
          <Beat progress={smoothProgress} fadeIn={[0.73, 0.78]} fadeOut={[0.92, 0.97]} center>
            <div className="beat-badge blue">◇ LIFECYCLE ACTIVE</div>
            <h1 className="beat-title" style={{ textAlign: 'center' }}>FULLY<br />INTEGRATED</h1>
            <p className="beat-subtitle" style={{ textAlign: 'center' }}>
              Securely managing the lifecycle of every journey.
              From ignition to destination — one connected identity.
            </p>
          </Beat>
          <DataStream progress={smoothProgress} />

          {/* CTA at the end */}
          <CTAOverlay progress={smoothProgress} />
        </div>
      </div>

      {/* Bottom progress bar */}
      <motion.div className="scroll-progress-bar" style={{ width: progressBarWidth }} />
    </>
  )
}
