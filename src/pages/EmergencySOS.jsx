import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { Radio, AlertTriangle, Phone, Shield, MapPin, User, Droplets, Car, Loader2 } from 'lucide-react'
import RadarPulse from '../components/three/RadarPulse'
import AIInsightsPanel from '../components/AIInsightsPanel'
import { useSupabaseRealtime, insertRow, updateRow } from '../hooks/useSupabase'
import { optimizeEmergencyResponse } from '../utils/aiEngine'

export default function EmergencySOS() {
  const { data: owners, loading: ownersLoading } = useSupabaseRealtime('owners', { orderBy: 'created_at' })
  const { data: vehicles, loading: vehiclesLoading } = useSupabaseRealtime('vehicles', { orderBy: 'created_at' })
  const { data: broadcasts, loading: broadcastsLoading } = useSupabaseRealtime('emergency_broadcasts', { orderBy: 'timestamp', ascending: false })

  const [selectedOwnerId, setSelectedOwnerId] = useState(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [sosActive, setSosActive] = useState(false)
  const [activeBroadcast, setActiveBroadcast] = useState(null)
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 })
  const [broadcastTime, setBroadcastTime] = useState(null)
  const [elapsed, setElapsed] = useState('00:00')
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [readiness, setReadiness] = useState(null)
  const [newOwner, setNewOwner] = useState({ name: '', phone: '', blood_type: '', emergency_contact: '', emergency_phone: '' })
  const pageRef = useRef(null)
  const sosButtonRef = useRef(null)

  useEffect(() => {
    if (owners.length > 0 && !selectedOwnerId) setSelectedOwnerId(owners[0].id)
    if (vehicles.length > 0 && !selectedVehicleId) setSelectedVehicleId(vehicles[0].id)
  }, [owners, vehicles])

  // Check for already active broadcasts
  useEffect(() => {
    const active = broadcasts.find(b => b.status === 'active')
    if (active) {
      setActiveBroadcast(active)
      setSosActive(true)
      setBroadcastTime(new Date(active.timestamp))
    }
  }, [broadcasts])

  // AI readiness check
  useEffect(() => {
    const owner = owners.find(o => o.id === selectedOwnerId)
    const vehicle = vehicles.find(v => v.id === selectedVehicleId)
    if (owner) {
      const result = optimizeEmergencyResponse(owner, vehicle)
      setReadiness(result)
    }
  }, [selectedOwnerId, selectedVehicleId, owners, vehicles])

  // Elapsed timer
  useEffect(() => {
    if (!sosActive || !broadcastTime) return
    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now - broadcastTime) / 1000)
      const mins = Math.floor(diff / 60).toString().padStart(2, '0')
      const secs = (diff % 60).toString().padStart(2, '0')
      setElapsed(`${mins}:${secs}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [sosActive, broadcastTime])

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [])

  const handleSOS = async () => {
    if (sosActive && activeBroadcast) {
      // Cancel
      await updateRow('emergency_broadcasts', activeBroadcast.id, { status: 'cancelled' })
      setSosActive(false)
      setActiveBroadcast(null)
      setBroadcastTime(null)
      return
    }

    // Get GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }

    // Animate
    if (sosButtonRef.current) {
      gsap.to(sosButtonRef.current, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 })
    }

    try {
      const broadcast = await insertRow('emergency_broadcasts', {
        vehicle_id: selectedVehicleId || null,
        owner_id: selectedOwnerId || null,
        location_lat: location.lat,
        location_lng: location.lng,
        status: 'active'
      })
      setActiveBroadcast(broadcast)
      setSosActive(true)
      setBroadcastTime(new Date())
    } catch (err) {
      alert('Error broadcasting: ' + err.message)
    }
  }

  const handleAddOwner = async () => {
    if (!newOwner.name) return
    setSaving(true)
    try {
      const owner = await insertRow('owners', newOwner)
      setSelectedOwnerId(owner.id)
      setShowSetupModal(false)
      setNewOwner({ name: '', phone: '', blood_type: '', emergency_contact: '', emergency_phone: '' })
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const selectedOwner = owners.find(o => o.id === selectedOwnerId)
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  return (
    <div className="page-container" ref={pageRef}>
      <div className="section-header">
        <div className="section-badge" style={{ background: 'rgba(255, 51, 102, 0.08)', borderColor: 'rgba(255, 51, 102, 0.2)', color: 'var(--accent-danger)' }}>
          <Radio size={12} /> Emergency Broadcast
        </div>
        <h1 className="section-title">
          Emergency <span style={{ background: 'var(--gradient-danger)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SOS</span> Broadcast
        </h1>
        <p className="section-subtitle">
          One tap broadcasts your identity, blood type, vehicle, and GPS to emergency services — saved to Supabase in realtime.
        </p>
      </div>

      {/* Owner/Vehicle Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Identity: </span>
          {owners.map(o => (
            <button key={o.id} className={`btn ${selectedOwnerId === o.id ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ marginRight: '4px' }} onClick={() => setSelectedOwnerId(o.id)}>
              {o.name}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSetupModal(true)}>+ Add</button>
        </div>
      </div>

      <div className="sos-container">
        {/* 3D + SOS Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xl)' }}>
          <div className="sos-3d-wrapper" style={{ width: '100%', height: '300px' }}>
            <Canvas camera={{ position: [0, 2, 4], fov: 50 }}>
              <ambientLight intensity={0.2} />
              <pointLight position={[5, 5, 5]} intensity={0.5} color="#ff3366" />
              <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ff6b35" />
              <RadarPulse active={sosActive} />
              <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
          </div>
          <button ref={sosButtonRef} className={`sos-trigger-btn ${sosActive ? 'active' : ''}`} onClick={handleSOS}>
            {sosActive ? <Radio size={32} /> : <AlertTriangle size={32} />}
            <span style={{ fontSize: '1.1rem' }}>{sosActive ? 'CANCEL' : 'SOS'}</span>
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {sosActive ? `Broadcasting for ${elapsed}` : 'Press to broadcast emergency'}
          </p>
        </div>

        {/* Info Cards */}
        <div className="sos-details">
          {sosActive && (
            <div className="glass-card-static" style={{ background: 'rgba(255, 51, 102, 0.06)', border: '1px solid rgba(255, 51, 102, 0.2)', animation: 'stolen-pulse 2s infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <Radio size={16} color="var(--accent-danger)" />
                <span style={{ fontWeight: 700, color: 'var(--accent-danger)' }}>BROADCAST ACTIVE</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Emergency info saved to Supabase and broadcasting in realtime.</p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Duration: {elapsed} · GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
            </div>
          )}

          {selectedOwner && (
            <>
              <div className="sos-info-card"><User size={20} /><div><div className="sos-info-label">Identity</div><div className="sos-info-value">{selectedOwner.name}</div></div></div>
              <div className="sos-info-card"><Droplets size={20} /><div><div className="sos-info-label">Blood Type</div><div className="sos-info-value" style={{ color: 'var(--accent-danger)', fontFamily: 'var(--font-mono)', fontSize: '1.2rem' }}>{selectedOwner.blood_type || 'Not set'}</div></div></div>
              <div className="sos-info-card"><Phone size={20} /><div><div className="sos-info-label">Emergency Contact</div><div className="sos-info-value">{selectedOwner.emergency_contact || 'Not set'}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedOwner.emergency_phone}</div></div></div>
            </>
          )}

          {selectedVehicle && (
            <div className="sos-info-card"><Car size={20} /><div><div className="sos-info-label">Vehicle</div><div className="sos-info-value">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.registration_number})</div></div></div>
          )}

          <div className="sos-info-card"><MapPin size={20} /><div><div className="sos-info-label">GPS Location</div><div className="sos-info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div></div></div>

          {/* AI Readiness */}
          {readiness && (
            <AIInsightsPanel
              title={`Emergency Readiness: ${readiness.readiness}%`}
              insights={readiness.checklist.map(c => ({ type: c.complete ? 'done' : c.priority, text: c.text }))}
              expanded={readiness.readiness < 100}
            />
          )}

          {sosActive && activeBroadcast && (
            <div className="glass-card-static" style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 'var(--space-sm)', fontSize: '0.9rem' }}>🔗 Broadcast ID</h4>
              <div style={{ padding: 'var(--space-sm)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-primary)', wordBreak: 'break-all' }}>
                {activeBroadcast.id}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Past Broadcasts */}
      {broadcasts.length > 0 && (
        <div style={{ marginTop: 'var(--space-2xl)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Broadcast History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {broadcasts.slice(0, 5).map(b => (
              <div key={b.id} className="glass-card-static" style={{ padding: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.id.slice(0, 8)}...</span>
                  <span style={{ margin: '0 8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    GPS: {b.location_lat?.toFixed(4)}, {b.location_lng?.toFixed(4)}
                  </span>
                </div>
                <span className={`status-badge ${b.status === 'active' ? 'status-stolen' : b.status === 'resolved' ? 'status-active' : 'status-warning'}`}>
                  <span className="dot"></span>{b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="modal-overlay" onClick={() => setShowSetupModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSetupModal(false)}>×</button>
            <h2 className="modal-title">Add Emergency Identity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Your full name" value={newOwner.name} onChange={e => setNewOwner({...newOwner, name: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="+91 98765 43210" value={newOwner.phone} onChange={e => setNewOwner({...newOwner, phone: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Blood Type</label>
                  <select className="form-select" value={newOwner.blood_type} onChange={e => setNewOwner({...newOwner, blood_type: e.target.value})}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Emergency Contact Name</label><input className="form-input" placeholder="e.g. Mom — Fatima Khan" value={newOwner.emergency_contact} onChange={e => setNewOwner({...newOwner, emergency_contact: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Emergency Contact Phone</label><input className="form-input" placeholder="+91 98765 12345" value={newOwner.emergency_phone} onChange={e => setNewOwner({...newOwner, emergency_phone: e.target.value})} /></div>
              <button className="btn btn-primary btn-lg" onClick={handleAddOwner} disabled={saving}>
                {saving ? 'Saving...' : 'Save Identity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
