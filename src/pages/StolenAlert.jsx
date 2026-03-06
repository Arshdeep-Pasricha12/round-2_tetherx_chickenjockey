import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { AlertTriangle, Plus, X, MapPin, Clock, Eye, Car, Send, Search, Loader2 } from 'lucide-react'
import AlertBeacon from '../components/three/AlertBeacon'
import AIInsightsPanel from '../components/AIInsightsPanel'
import { useSupabaseRealtime, insertRow, updateRow } from '../hooks/useSupabase'
import { analyzeStolenPatterns } from '../utils/aiEngine'
import { supabase } from '../config/supabase'

export default function StolenAlert() {
  const { data: alerts, loading } = useSupabaseRealtime('stolen_alerts', {
    select: '*, stolen_sightings(*)',
    orderBy: 'created_at', ascending: false
  })
  const { data: vehicles } = useSupabaseRealtime('vehicles', { orderBy: 'created_at' })
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showSightingModal, setShowSightingModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [patternAnalysis, setPatternAnalysis] = useState(null)
  const [newAlert, setNewAlert] = useState({
    vehicle_id: '', reported_by: '', description: '', last_seen_location: ''
  })
  const [newSighting, setNewSighting] = useState({ location: '', description: '', reported_by: '' })
  const pageRef = useRef(null)

  // AI pattern analysis
  useEffect(() => {
    if (alerts.length > 0) {
      const analysis = analyzeStolenPatterns(alerts)
      setPatternAnalysis(analysis)
    }
  }, [alerts])

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [])

  const handleReportStolen = async () => {
    if (!newAlert.reported_by || !newAlert.description) return
    setSaving(true)
    try {
      // Mark vehicle as stolen if selected
      if (newAlert.vehicle_id) {
        await updateRow('vehicles', newAlert.vehicle_id, { status: 'stolen' })
      }

      // Get location if available
      let lat = 12.9716 + (Math.random() - 0.5) * 0.1
      let lng = 77.5946 + (Math.random() - 0.5) * 0.1
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }))
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch {}
      }

      await insertRow('stolen_alerts', {
        vehicle_id: newAlert.vehicle_id || null,
        reported_by: newAlert.reported_by,
        description: newAlert.description,
        last_seen_location: newAlert.last_seen_location,
        last_seen_lat: lat,
        last_seen_lng: lng,
        status: 'active'
      })
      setShowReportModal(false)
      setNewAlert({ vehicle_id: '', reported_by: '', description: '', last_seen_location: '' })
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const handleReportSighting = async (alertId) => {
    if (!newSighting.location || !newSighting.description) return
    setSaving(true)
    try {
      let lat = 0, lng = 0
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }))
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch {}
      }

      await insertRow('stolen_sightings', {
        alert_id: alertId,
        reported_by: newSighting.reported_by || 'Anonymous',
        location: newSighting.location,
        location_lat: lat,
        location_lng: lng,
        description: newSighting.description
      })
      setShowSightingModal(false)
      setNewSighting({ location: '', description: '', reported_by: '' })
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const handleMarkRecovered = async (alert) => {
    if (!confirm('Mark this vehicle as recovered?')) return
    try {
      await updateRow('stolen_alerts', alert.id, { status: 'recovered' })
      if (alert.vehicle_id) {
        await updateRow('vehicles', alert.vehicle_id, { status: 'active' })
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const getVehicleInfo = (vehicleId) => {
    const v = vehicles.find(v => v.id === vehicleId)
    return v ? `${v.make} ${v.model} (${v.registration_number})` : 'Unknown Vehicle'
  }

  const filteredAlerts = alerts.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const vehicle = vehicles.find(v => v.id === a.vehicle_id)
    return a.reported_by?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.last_seen_location?.toLowerCase().includes(q) ||
      vehicle?.make?.toLowerCase().includes(q) ||
      vehicle?.model?.toLowerCase().includes(q) ||
      vehicle?.registration_number?.toLowerCase().includes(q)
  })

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const totalSightings = alerts.reduce((sum, a) => sum + (a.stolen_sightings?.length || 0), 0)
  const recovered = alerts.filter(a => a.status === 'recovered').length

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatTime = (t) => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="page-container" ref={pageRef}>
      <div className="section-header">
        <div className="section-badge" style={{ background: 'rgba(255, 215, 0, 0.08)', borderColor: 'rgba(255, 215, 0, 0.2)', color: 'var(--accent-gold)' }}>
          <AlertTriangle size={12} /> Alert Network
        </div>
        <h1 className="section-title">Stolen Vehicle <span className="gradient-text">Alert Network</span></h1>
        <p className="section-subtitle">
          Community-powered stolen vehicle tracking. All reports are stored in Supabase with realtime updates.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'var(--gradient-danger)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{activeAlerts.length}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSightings}</div>
          <div className="stat-label">Total Sightings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'var(--gradient-success)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{recovered}</div>
          <div className="stat-label">Recovered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{alerts.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
      </div>

      {/* AI Pattern Analysis */}
      {patternAnalysis && patternAnalysis.insights.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <AIInsightsPanel title="AI Theft Pattern Analysis" insights={patternAnalysis.insights} expanded={true} />
        </div>
      )}

      {/* 3D + Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)', alignItems: 'center' }}>
        <div style={{ height: '250px' }}>
          <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[5, 5, 5]} intensity={0.5} color="#ff3366" />
            <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ff6b35" />
            <AlertBeacon active={activeAlerts.length > 0} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <button className="btn btn-danger btn-lg" onClick={() => setShowReportModal(true)}>
              <AlertTriangle size={18} /> Report Stolen Vehicle
            </button>
          </div>
          <div className="verify-input-group">
            <input className="form-input" placeholder="Search alerts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button className="btn btn-secondary"><Search size={16} /></button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 'var(--space-sm)' }}>Loading alerts from Supabase...</p>
        </div>
      )}

      {/* Alert Cards */}
      <div className="stolen-grid">
        {filteredAlerts.map(alert => (
          <div key={alert.id} className={`glass-card alert-card ${alert.status === 'active' ? 'stolen-active' : ''}`}>
            <div className="alert-header">
              <div>
                <div className="alert-vehicle">{alert.vehicle_id ? getVehicleInfo(alert.vehicle_id) : 'Vehicle Details Pending'}</div>
              </div>
              <span className={`status-badge ${alert.status === 'active' ? 'status-stolen' : 'status-active'}`}>
                <span className="dot"></span>
                {alert.status === 'active' ? 'STOLEN' : 'Recovered'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{alert.description}</p>
            <div className="alert-details">
              <div className="alert-detail-item"><MapPin size={14} /> Last seen: {alert.last_seen_location || 'Unknown'}</div>
              <div className="alert-detail-item"><Clock size={14} /> Reported: {alert.created_at ? formatDate(alert.created_at) : 'Just now'}</div>
              <div className="alert-detail-item"><Car size={14} /> By: {alert.reported_by}</div>
            </div>
            <div className="sightings-count">
              <Eye size={14} />
              {alert.stolen_sightings?.length || 0} sighting(s) reported
            </div>
            {alert.stolen_sightings?.length > 0 && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)' }}>Recent Sightings</h4>
                {alert.stolen_sightings.slice(-3).map(s => (
                  <div key={s.id} style={{ padding: 'var(--space-sm)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: '6px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--accent-primary)' }}><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {s.location}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{s.timestamp ? formatTime(s.timestamp) : 'Just now'}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— {s.reported_by}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setSelectedAlert(alert); setShowSightingModal(true) }}>
                <Eye size={14} /> Report Sighting
              </button>
              {alert.status === 'active' && (
                <button className="btn btn-success btn-sm" onClick={() => handleMarkRecovered(alert)}>✓ Recovered</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && !loading && (
        <div className="text-center" style={{ padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
          <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
          <p>{searchQuery ? 'No alerts match your search.' : 'No stolen reports yet. The network is clean!'}</p>
        </div>
      )}

      {/* Report Stolen Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowReportModal(false)}><X size={20} /></button>
            <h2 className="modal-title">🚨 Report Stolen Vehicle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {vehicles.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Select Vehicle</label>
                  <select className="form-select" value={newAlert.vehicle_id} onChange={e => setNewAlert({...newAlert, vehicle_id: e.target.value})}>
                    <option value="">-- Select from your vehicles --</option>
                    {vehicles.filter(v => v.status === 'active').map(v => (
                      <option key={v.id} value={v.id}>{v.make} {v.model} ({v.registration_number})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group"><label className="form-label">Your Name *</label><input className="form-input" placeholder="Full name" value={newAlert.reported_by} onChange={e => setNewAlert({...newAlert, reported_by: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Last Seen Location</label><input className="form-input" placeholder="e.g. Lajpat Nagar, New Delhi" value={newAlert.last_seen_location} onChange={e => setNewAlert({...newAlert, last_seen_location: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" placeholder="Describe what happened..." value={newAlert.description} onChange={e => setNewAlert({...newAlert, description: e.target.value})} /></div>
              <button className="btn btn-danger btn-lg" onClick={handleReportStolen} disabled={saving}>
                {saving ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Broadcasting...</> : <><AlertTriangle size={18} /> Broadcast Alert</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sighting Modal */}
      {showSightingModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowSightingModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSightingModal(false)}><X size={20} /></button>
            <h2 className="modal-title">👁️ Report Sighting</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-lg)' }}>
              Reporting for: <strong>{selectedAlert.vehicle_id ? getVehicleInfo(selectedAlert.vehicle_id) : 'Reported Vehicle'}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Location *</label><input className="form-input" placeholder="Where did you see it?" value={newSighting.location} onChange={e => setNewSighting({...newSighting, location: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Your Name</label><input className="form-input" placeholder="Anonymous" value={newSighting.reported_by} onChange={e => setNewSighting({...newSighting, reported_by: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" placeholder="Direction, plate visibility, condition..." value={newSighting.description} onChange={e => setNewSighting({...newSighting, description: e.target.value})} /></div>
              <button className="btn btn-primary btn-lg" onClick={() => handleReportSighting(selectedAlert.id)} disabled={saving}>
                {saving ? 'Submitting...' : <><Send size={18} /> Submit Sighting</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
