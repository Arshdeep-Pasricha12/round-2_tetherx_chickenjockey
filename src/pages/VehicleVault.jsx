import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { Car, Plus, X, QrCode, Copy, Check, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react'
import VaultCard from '../components/three/VaultCard'
import AIInsightsPanel from '../components/AIInsightsPanel'
import { useSupabaseRealtime, insertRow, deleteRow } from '../hooks/useSupabase'
import { calculateVehicleRiskScore } from '../utils/aiEngine'

export default function VehicleVault() {
  const { data: vehicles, loading } = useSupabaseRealtime('vehicles', {
    select: '*, vehicle_ownership(*), insurance_policies(*)',
    orderBy: 'created_at', ascending: false
  })
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [riskScore, setRiskScore] = useState(null)
  const pageRef = useRef(null)

  const [newVehicle, setNewVehicle] = useState({
    vin: '', make: '', model: '', year: '', color: '', registration_number: ''
  })

  // Auto-select first vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0])
    }
  }, [vehicles])

  // Update selected vehicle when data changes
  useEffect(() => {
    if (selectedVehicle) {
      const updated = vehicles.find(v => v.id === selectedVehicle.id)
      if (updated) setSelectedVehicle(updated)
    }
  }, [vehicles])

  // AI risk score
  useEffect(() => {
    if (selectedVehicle) {
      const ownership = selectedVehicle.vehicle_ownership || []
      const insurance = selectedVehicle.insurance_policies?.find(p => p.status === 'active') || null
      const score = calculateVehicleRiskScore(selectedVehicle, ownership, insurance)
      setRiskScore(score)
    }
  }, [selectedVehicle])

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [])

  const handleAddVehicle = async () => {
    if (!newVehicle.vin || !newVehicle.make || !newVehicle.model || !newVehicle.registration_number) return
    setSaving(true)
    try {
      const vehicle = await insertRow('vehicles', {
        vin: newVehicle.vin,
        make: newVehicle.make,
        model: newVehicle.model,
        year: parseInt(newVehicle.year) || new Date().getFullYear(),
        color: newVehicle.color || 'Unknown',
        registration_number: newVehicle.registration_number,
        status: 'active'
      })
      setSelectedVehicle(vehicle)
      setShowModal(false)
      setNewVehicle({ vin: '', make: '', model: '', year: '', color: '', registration_number: '' })
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const handleCopyVIN = () => {
    if (!selectedVehicle?.vin) return
    navigator.clipboard.writeText(selectedVehicle.vin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteVehicle = async (id) => {
    if (!confirm('Are you sure? This will permanently delete this vehicle.')) return
    try {
      await deleteRow('vehicles', id)
      setSelectedVehicle(vehicles.find(v => v.id !== id) || null)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const getInsuranceStatus = (vehicle) => {
    const policies = vehicle?.insurance_policies || []
    const active = policies.find(p => new Date(p.end_date) > new Date())
    return active ? 'active' : 'expired'
  }

  const getInsuranceExpiry = (vehicle) => {
    const policies = vehicle?.insurance_policies || []
    const active = policies.find(p => new Date(p.end_date) > new Date())
    return active ? active.end_date : null
  }

  const getOwnerName = (vehicle) => {
    const chain = vehicle?.vehicle_ownership || []
    return chain.length > 0 ? chain[chain.length - 1].owner_name : 'Not assigned'
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div className="page-container" ref={pageRef}>
      <div className="section-header">
        <div className="section-badge"><Car size={12} /> Digital Identity Vault</div>
        <h1 className="section-title">
          Vehicle <span className="gradient-text">Identity Vault</span>
        </h1>
        <p className="section-subtitle">
          Your vehicle's complete digital identity — secured in Supabase, verified in realtime, always accessible.
          Flip the 3D card to see linked owner and insurance details.
        </p>
      </div>

      {/* Vehicle Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', alignItems: 'center' }}>
        {vehicles.map(v => (
          <button
            key={v.id}
            className={`btn ${selectedVehicle?.id === v.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setSelectedVehicle(v); setCardFlipped(false) }}
          >
            {v.make} {v.model}
          </button>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Vehicle
        </button>
        {vehicles.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No vehicles registered yet. Click "Add Vehicle" to get started.
          </span>
        )}
      </div>

      {selectedVehicle && (
        <>
          <div className="vault-container">
            {/* 3D Card */}
            <div className="vault-3d-wrapper" onClick={() => setCardFlipped(!cardFlipped)} style={{ cursor: 'pointer', position: 'relative' }}>
              <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <ambientLight intensity={0.3} />
                <pointLight position={[5, 5, 5]} intensity={0.6} color="#00d4ff" />
                <pointLight position={[-5, 3, -5]} intensity={0.4} color="#7c3aed" />
                <pointLight position={[0, -3, 5]} intensity={0.3} color="#06ffa5" />
                <VaultCard flipped={cardFlipped} vehicleData={selectedVehicle} />
                <OrbitControls enableZoom={false} enablePan={false} />
              </Canvas>
              <div style={{
                position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {cardFlipped ? <EyeOff size={12} /> : <Eye size={12} />}
                Click to {cardFlipped ? 'show front' : 'flip card'}
              </div>
            </div>

            {/* Details Panel */}
            <div className="vault-details">
              <div className="glass-card-static">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-lg)' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                      {selectedVehicle.make} {selectedVehicle.model}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedVehicle.year} · {selectedVehicle.color}</p>
                  </div>
                  <span className={`status-badge ${selectedVehicle.status === 'active' ? 'status-active' : 'status-stolen'}`}>
                    <span className="dot"></span>
                    {selectedVehicle.status === 'active' ? 'Active' : selectedVehicle.status === 'stolen' ? 'Stolen' : selectedVehicle.status}
                  </span>
                </div>

                <div className="vault-info-grid">
                  <div className="vault-info-item">
                    <div className="label">VIN</div>
                    <div className="value" style={{ fontSize: '0.8rem' }}>{selectedVehicle.vin}</div>
                  </div>
                  <div className="vault-info-item">
                    <div className="label">Registration</div>
                    <div className="value">{selectedVehicle.registration_number}</div>
                  </div>
                  <div className="vault-info-item">
                    <div className="label">Current Owner</div>
                    <div className="value">{getOwnerName(selectedVehicle)}</div>
                  </div>
                  <div className="vault-info-item">
                    <div className="label">Insurance</div>
                    <div className="value">
                      <span className={`status-badge ${getInsuranceStatus(selectedVehicle) === 'active' ? 'status-active' : 'status-expired'}`} style={{ fontSize: '0.7rem' }}>
                        <span className="dot"></span>
                        {getInsuranceStatus(selectedVehicle)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Section */}
              <div className="qr-section">
                <div className="qr-placeholder">
                  <QrCode size={60} color="#0a0a0f" />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '4px' }}>Instant Verification</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-sm)' }}>
                    Authorities can scan this QR to verify your vehicle identity in realtime.
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={handleCopyVIN}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy VIN'}
                  </button>
                </div>
              </div>

              {/* AI Risk Score */}
              {riskScore && (
                <AIInsightsPanel
                  title="AI Vehicle Risk Assessment"
                  riskScore={riskScore}
                  insights={riskScore.factors.map(f => ({ type: f.impact < -10 ? 'danger' : f.impact < 0 ? 'warning' : 'success', text: `${f.factor}: ${f.detail}` }))}
                  expanded={true}
                />
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteVehicle(selectedVehicle.id)}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            <h2 className="modal-title">Register New Vehicle</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-lg)' }}>
              This will be saved to Supabase in realtime. All fields marked are required.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">VIN Number *</label>
                <input className="form-input" placeholder="e.g. WBA3A5G59DNP26082" value={newVehicle.vin} onChange={e => setNewVehicle({...newVehicle, vin: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Make *</label>
                  <input className="form-input" placeholder="e.g. BMW" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Model *</label>
                  <input className="form-input" placeholder="e.g. 3 Series" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input className="form-input" type="number" placeholder="e.g. 2023" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input className="form-input" placeholder="e.g. Alpine White" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input className="form-input" placeholder="e.g. KA-01-AB-1234" value={newVehicle.registration_number} onChange={e => setNewVehicle({...newVehicle, registration_number: e.target.value})} />
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleAddVehicle} disabled={saving} style={{ marginTop: 'var(--space-md)' }}>
                {saving ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Plus size={18} /> Register Vehicle</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
