import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import gsap from 'gsap'
import { Shield, Link2, Car, AlertTriangle, Radio, ArrowRight, ChevronDown } from 'lucide-react'
import CarModel from '../components/three/CarModel'

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const buttonsRef = useRef(null)
  const featuresRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })
    
    tl.fromTo(titleRef.current,
      { opacity: 0, y: 60, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.5'
    )
    .fromTo(buttonsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.3'
    )
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cards = entry.target.querySelectorAll('.glass-card')
          gsap.fromTo(cards,
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
          )
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    if (featuresRef.current) observer.observe(featuresRef.current)
    return () => observer.disconnect()
  }, [])

  const features = [
    {
      icon: <Car size={24} />,
      iconClass: 'cyan',
      title: 'Digital Vehicle Identity Vault',
      desc: 'A 3D holographic identity card for your vehicle. All documents in one secure place — accessible with a single tap.',
      path: '/vault',
      emotional: 'Never feel helpless at a checkpoint again'
    },
    {
      icon: <Link2 size={24} />,
      iconClass: 'purple',
      title: 'Ownership Transfer Chain',
      desc: 'Tamper-proof provenance timeline. See every owner, every transfer — protecting buyers from fraud.',
      path: '/ownership',
      emotional: 'Protect first-time buyers from being cheated'
    },
    {
      icon: <Shield size={24} />,
      iconClass: 'green',
      title: 'Insurance Shield Verification',
      desc: 'Real-time insurance status with a 3D shield that cracks when coverage expires. Never drive uninsured.',
      path: '/insurance',
      emotional: "Don't let expired insurance destroy a family"
    },
    {
      icon: <Radio size={24} />,
      iconClass: 'red',
      title: 'Emergency SOS Identity Broadcast',
      desc: 'One-tap emergency broadcast — sends your identity, blood type, and insurance to first responders instantly.',
      path: '/sos',
      emotional: 'Every second saved could save a life'
    },
    {
      icon: <AlertTriangle size={24} />,
      iconClass: 'gold',
      title: 'Stolen Vehicle Alert Network',
      desc: 'Community-powered stolen vehicle tracking. Report, alert, and recover — together.',
      path: '/stolen',
      emotional: "An auto driver's livelihood shouldn't vanish overnight"
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-canvas">
          <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[5, 5, 5]} intensity={0.8} color="#00d4ff" />
            <pointLight position={[-5, 3, -5]} intensity={0.5} color="#7c3aed" />
            <pointLight position={[0, -2, 5]} intensity={0.3} color="#06ffa5" />
            <Stars radius={80} depth={50} count={2500} factor={4} saturation={0} fade speed={1} />
            <CarModel />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 4} />
          </Canvas>
        </div>

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div ref={titleRef} style={{ opacity: 0 }}>
            <div className="section-badge" style={{ justifyContent: 'center', display: 'inline-flex' }}>
              <Shield size={12} /> Vehicle Identity Shield
            </div>
            <h1 className="hero-title">
              Your Vehicle's <br />
              <span className="text-gradient">Digital Fortress</span>
            </h1>
          </div>
          <p className="hero-subtitle" ref={subtitleRef} style={{ opacity: 0 }}>
            Secure identities. Verified ownership. Real-time insurance. Emergency broadcasts. 
            One platform to protect what moves your world.
          </p>
          <div className="hero-buttons" ref={buttonsRef} style={{ opacity: 0 }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/vault')}>
              <Shield size={18} /> Enter the Vault
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Explore Features <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="page-container" style={{ paddingTop: '2rem' }}>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">12.4M</div>
            <div className="stat-label">Vehicles Protected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">99.7%</div>
            <div className="stat-label">Verification Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">2.1s</div>
            <div className="stat-label">Avg. Identity Check</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">847</div>
            <div className="stat-label">Vehicles Recovered</div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" ref={featuresRef}>
          <div className="section-header text-center">
            <div className="section-badge" style={{ margin: '0 auto var(--space-md)' }}>
              <Shield size={12} /> Core Features
            </div>
            <h2 className="section-title">
              Five Shields. <span className="gradient-text">One Mission.</span>
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Every feature is designed around a real-world crisis — solving problems that affect millions of vehicle owners daily.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass-card feature-card"
                onClick={() => navigate(feature.path)}
                style={{ opacity: 0 }}
              >
                <div className={`feature-icon ${feature.iconClass}`}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <p style={{ 
                  marginTop: 'var(--space-md)', 
                  fontSize: '0.8rem', 
                  color: 'var(--accent-primary)', 
                  fontStyle: 'italic',
                  opacity: 0.8 
                }}>
                  "{feature.emotional}"
                </p>
                <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Explore <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center" style={{ padding: 'var(--space-3xl) 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
            Ready to <span className="text-gradient">Protect Your Vehicle?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: '400px', margin: '0 auto var(--space-xl)' }}>
            Start by registering your vehicle in the Digital Vault. It takes less than 60 seconds.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/vault')}>
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
