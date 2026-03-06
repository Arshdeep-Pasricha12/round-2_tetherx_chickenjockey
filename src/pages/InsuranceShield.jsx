import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { Shield, Search, AlertTriangle, Clock, Check, X, Bell, Plus, Loader2 } from 'lucide-react'
import Shield3D from '../components/three/Shield3D'
import AIInsightsPanel from '../components/AIInsightsPanel'
import { useSupabaseRealtime, insertRow } from '../hooks/useSupabase'
import { analyzeInsuranceHealth } from '../utils/aiEngine'
import { supabase } from '../config/supabase'

export default function InsuranceShield() {
  const { data: vehicles, loading: vehiclesLoading } = useSupabaseRealtime('vehicles', { orderBy: 'created_at' })
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const { data: policies, loading: policiesLoading } = useSupabaseRealtime('insurance_policies', {
    filter: selectedVehicleId ? { vehicle_id: selectedVehicleId } : undefined,
    orderBy: 'end_date', ascending: false
  })
  const [searchReg, setSearchReg] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [healthAnalysis, setHealthAnalysis] = useState(null)
  const [newPolicy, setNewPolicy] = useState({
    provider: '', policy_number: '', start_date: '', end_date: '', coverage_type: 'comprehensive'
  })
  const pageRef = useRef(null)

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id)
    }
  }, [vehicles])

  // AI analysis
  useEffect(() => {
    if (policies.length > 0) {
      const analysis = analyzeInsuranceHealth(policies)
      setHealthAnalysis(analysis)
    } else {
      setHealthAnalysis(null)
    }
  }, [policies])

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [])

  const getActivePolicy = () => policies.find(p => new Date(p.end_date) > new Date())

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  }

  const formatCountdown = (days) => {
    if (days <= 0) return 'EXPIRED'
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    const d = days % 30
    if (years > 0) return `${years}y ${months}m ${d}d`
    if (months > 0) return `${months}m ${d}d`
    return `${d} days`
  }

  const handleSearch = async () => {
    setSearching(true)
    setSearchResult(null)
    try {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*, insurance_policies(*)')
        .ilike('registration_number', searchReg.replace(/\s/g, '%'))
        .limit(1)
        .single()

      if (vehicle) {
        const activePolicy = vehicle.insurance_policies?.find(p => new Date(p.end_date) > new Date())
        setSearchResult({
          found: true,
          vehicle,
          insured: !!activePolicy,
          policy: activePolicy
        })
      } else {
        setSearchResult({ found: false })
      }
    } catch {
      setSearchResult({ found: false })
    }
    setSearching(false)
  }

  const handleAddPolicy = async () => {
    if (!newPolicy.provider || !newPolicy.policy_number || !newPolicy.start_date || !newPolicy.end_date) return
    setSaving(true)
    try {
      await insertRow('insurance_policies', {
        vehicle_id: selectedVehicleId,
        ...newPolicy,
        status: new Date(newPolicy.end_date) > new Date() ? 'active' : 'expired'
      })
      setShowAddModal(false)
      setNewPolicy({ provider: '', policy_number: '', start_date: '', end_date: '', coverage_type: 'comprehensive' })
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const activePolicy = getActivePolicy()
  const isActive = !!activePolicy
  const daysLeft = activePolicy ? getDaysRemaining(activePolicy.end_date) : -1

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  return (
    <div className="page-container" ref={pageRef}>
      <div className="section-header">
        <div className="section-badge"><Shield size={12} /> Insurance Verification</div>
        <h1 className="section-title">Insurance <span className="gradient-text">Shield</span></h1>
        <p className="section-subtitle">
          Real-time insurance status from Supabase. The 3D shield glows green when coverage is active
          and cracks red when it expires.
        </p>
      </div>

      {/* Vehicle Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {vehicles.map(v => (
          <button key={v.id} className={`btn ${selectedVehicleId === v.id ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setSelectedVehicleId(v.id)}>
            {v.make} {v.model}
          </button>
        ))}
      </div>

      {selectedVehicleId && selectedVehicle && (
        <div className="shield-container">
          {/* 3D Shield */}
          <div className="shield-3d-wrapper" style={{ height: '400px' }}>
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
              <ambientLight intensity={0.2} />
              <pointLight position={[5, 5, 5]} intensity={0.6} color={isActive ? '#06ffa5' : '#ff3366'} />
              <pointLight position={[-5, 3, -5]} intensity={0.4} color="#7c3aed" />
              <Shield3D active={isActive} />
              <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
          </div>

          {/* Info */}
          <div className="shield-info">
            <div className="glass-card-static">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{selectedVehicle.make} {selectedVehicle.model}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{selectedVehicle.registration_number}</p>
                </div>
                <span className={`status-badge ${isActive ? 'status-active' : 'status-expired'}`}>
                  <span className="dot"></span>
                  {isActive ? 'Shield Active' : 'Shield Broken'}
                </span>
              </div>

              {activePolicy ? (
                <div className="vault-info-grid">
                  <div className="vault-info-item"><div className="label">Provider</div><div className="value">{activePolicy.provider}</div></div>
                  <div className="vault-info-item"><div className="label">Policy #</div><div className="value" style={{ fontSize: '0.8rem' }}>{activePolicy.policy_number}</div></div>
                  <div className="vault-info-item"><div className="label">Coverage</div><div className="value">{activePolicy.coverage_type}</div></div>
                  <div className="vault-info-item"><div className="label">Valid Until</div><div className="value">{new Date(activePolicy.end_date).toLocaleDateString('en-IN')}</div></div>
                </div>
              ) : (
                <div style={{ padding: 'var(--space-md)', background: 'rgba(255, 51, 102, 0.05)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} style={{ verticalAlign: 'middle' }} /> No active insurance. Add a policy below.
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="countdown-display">
              <div className="countdown-label">Time Until Expiry</div>
              <div className={`countdown-value ${daysLeft <= 30 ? 'expiring' : ''}`}>
                {activePolicy ? formatCountdown(daysLeft) : 'NO POLICY'}
              </div>
              {daysLeft > 0 && daysLeft <= 30 && (
                <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-warning)', fontSize: '0.8rem' }}>
                  <AlertTriangle size={14} /> Expiring soon — renew immediately!
                </div>
              )}
            </div>

            {/* Alert Schedule */}
            {activePolicy && (
              <div className="glass-card-static" style={{ padding: 'var(--space-md)' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} /> Alert Schedule
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[30, 15, 7, 1].map(days => {
                    const sent = daysLeft <= days
                    return (
                      <div key={days} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.8rem', color: sent ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                        {sent ? <Check size={12} color="var(--accent-danger)" /> : <Clock size={12} />}
                        {days} day{days > 1 ? 's' : ''} before expiry
                        {sent && <span style={{ color: 'var(--accent-danger)', fontWeight: 600, fontSize: '0.7rem' }}> SENT</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {healthAnalysis && (
              <AIInsightsPanel
                title="AI Insurance Health Analysis"
                insights={healthAnalysis.insights}
                expanded={true}
              />
            )}

            {/* Add Policy Button */}
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Insurance Policy
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="verify-box" style={{ marginTop: 'var(--space-2xl)' }}>
        <h3><Search size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Verify Any Vehicle's Insurance</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
          Enter a registration number to check insurance status from the database in realtime.
        </p>
        <div className="verify-input-group">
          <input className="form-input" placeholder="e.g. KA-01-AB-1234" value={searchReg} onChange={e => setSearchReg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button className="btn btn-primary" onClick={handleSearch} disabled={!searchReg || searching}>
            {searching ? 'Verifying...' : 'Verify'}
          </button>
        </div>
        {searchResult?.found && (
          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{searchResult.vehicle.make} {searchResult.vehicle.model}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{searchResult.vehicle.registration_number}</div>
              </div>
              <span className={`status-badge ${searchResult.insured ? 'status-active' : 'status-expired'}`}>
                <span className="dot"></span>
                {searchResult.insured ? 'Insured ✓' : 'Not Insured ✗'}
              </span>
            </div>
            {searchResult.policy && (
              <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {searchResult.policy.provider} · {searchResult.policy.coverage_type} · Valid until {new Date(searchResult.policy.end_date).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>
        )}
        {searchResult && !searchResult.found && (
          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(255, 51, 102, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 51, 102, 0.15)', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
            <X size={16} style={{ verticalAlign: 'middle' }} /> No vehicle found with this registration number.
          </div>
        )}
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            <h2 className="modal-title">Add Insurance Policy</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Provider *</label>
                <input className="form-input" placeholder="e.g. ICICI Lombard" value={newPolicy.provider} onChange={e => setNewPolicy({...newPolicy, provider: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Policy Number *</label>
                <input className="form-input" placeholder="e.g. POL-2024-8891234" value={newPolicy.policy_number} onChange={e => setNewPolicy({...newPolicy, policy_number: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input className="form-input" type="date" value={newPolicy.start_date} onChange={e => setNewPolicy({...newPolicy, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input className="form-input" type="date" value={newPolicy.end_date} onChange={e => setNewPolicy({...newPolicy, end_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Coverage Type</label>
                <select className="form-select" value={newPolicy.coverage_type} onChange={e => setNewPolicy({...newPolicy, coverage_type: e.target.value})}>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="third_party">Third Party</option>
                  <option value="own_damage">Own Damage</option>
                </select>
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleAddPolicy} disabled={saving}>
                {saving ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Plus size={18} /> Add Policy</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
