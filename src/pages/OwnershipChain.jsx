import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Link2, Plus, X, Check, ArrowDown, Hash, GitBranch, Lock, Unlock, Network, Loader2, Brain } from 'lucide-react'
import { buildBlockchain, verifyChain, shortHash, buildOwnershipGraph } from '../utils/blockchain'
import { detectOwnershipAnomalies } from '../utils/aiEngine'
import GraphView from '../components/GraphView'
import AIInsightsPanel from '../components/AIInsightsPanel'
import { useSupabaseRealtime, insertRow } from '../hooks/useSupabase'

export default function OwnershipChain() {
  const { data: vehicles, loading: vehiclesLoading } = useSupabaseRealtime('vehicles', { orderBy: 'created_at' })
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const { data: chain, loading: chainLoading } = useSupabaseRealtime('vehicle_ownership', {
    filter: selectedVehicleId ? { vehicle_id: selectedVehicleId } : undefined,
    orderBy: 'transfer_date', ascending: true
  })
  const [blockchain, setBlockchain] = useState([])
  const [chainVerification, setChainVerification] = useState(null)
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [fraudAnalysis, setFraudAnalysis] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showGraphView, setShowGraphView] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTransfer, setNewTransfer] = useState({ owner_name: '', transfer_type: 'sale', notes: '' })
  const timelineRef = useRef(null)
  const pageRef = useRef(null)

  // Auto-select first vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id)
    }
  }, [vehicles])

  // Build blockchain whenever chain changes
  useEffect(() => {
    async function build() {
      if (chain.length === 0) {
        setBlockchain([])
        setChainVerification(null)
        setGraphData({ nodes: [], edges: [] })
        setFraudAnalysis(null)
        return
      }
      const blocks = await buildBlockchain(chain)
      setBlockchain(blocks)
      const verification = await verifyChain(blocks)
      setChainVerification(verification)
      const graph = buildOwnershipGraph(blocks)
      setGraphData(graph)
      const fraud = detectOwnershipAnomalies(chain)
      setFraudAnalysis(fraud)
    }
    build()
  }, [chain])

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current.querySelectorAll('.section-header > *'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [])

  useEffect(() => {
    if (timelineRef.current) {
      const nodes = timelineRef.current.querySelectorAll('.chain-node')
      gsap.fromTo(nodes,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out', delay: 0.3 }
      )
    }
  }, [blockchain])

  const handleAddTransfer = async () => {
    if (!newTransfer.owner_name || !selectedVehicleId) return
    setSaving(true)
    try {
      await insertRow('vehicle_ownership', {
        vehicle_id: selectedVehicleId,
        owner_name: newTransfer.owner_name,
        transfer_type: newTransfer.transfer_type,
        transfer_date: new Date().toISOString().split('T')[0],
        verified: false,
        notes: newTransfer.notes
      })
      setShowModal(false)
      setNewTransfer({ owner_name: '', transfer_type: 'sale', notes: '' })
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const loading = vehiclesLoading || chainLoading

  return (
    <div className="page-container" ref={pageRef}>
      <div className="section-header">
        <div className="section-badge"><Link2 size={12} /> Blockchain Provenance</div>
        <h1 className="section-title">
          Ownership <span className="gradient-text">Transfer Chain</span>
        </h1>
        <p className="section-subtitle">
          Every ownership change is cryptographically hashed into a tamper-proof blockchain.
          Switch to Graph Database View to see Neo4j-style relationships.
        </p>
      </div>

      {/* Vehicle Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {vehicles.map(v => (
          <button
            key={v.id}
            className={`btn ${selectedVehicleId === v.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSelectedVehicleId(v.id)}
          >
            {v.make} {v.model} ({v.registration_number})
          </button>
        ))}
        {vehicles.length === 0 && !loading && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Register a vehicle in the Vault first, then add ownership transfers here.
          </span>
        )}
      </div>

      {selectedVehicleId && (
        <>
          {/* Stats */}
          <div className="stats-row" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="stat-card">
              <div className="stat-value">{blockchain.length}</div>
              <div className="stat-label">Blocks Mined</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{chain.filter(b => b.verified).length}</div>
              <div className="stat-label">Verified</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{blockchain.length > 0 ? formatDate(blockchain[blockchain.length - 1].transfer_date) : 'N/A'}</div>
              <div className="stat-label">Last Block</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{
                background: chainVerification?.valid ? 'var(--gradient-success)' : chain.length === 0 ? 'var(--gradient-primary)' : 'var(--gradient-danger)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                {chain.length === 0 ? 'Empty' : chainVerification?.valid ? '✓ Valid' : '✗ Broken'}
              </div>
              <div className="stat-label">Chain Integrity</div>
            </div>
          </div>

          {/* Blockchain Verification Banner */}
          {chainVerification && (
            <div className="glass-card-static" style={{
              marginBottom: 'var(--space-xl)',
              background: chainVerification.valid ? 'rgba(6, 255, 165, 0.03)' : 'rgba(255, 51, 102, 0.05)',
              border: `1px solid ${chainVerification.valid ? 'rgba(6, 255, 165, 0.15)' : 'rgba(255, 51, 102, 0.2)'}`,
              display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
              padding: 'var(--space-md) var(--space-lg)'
            }}>
              {chainVerification.valid ? <Lock size={20} style={{ color: 'var(--accent-tertiary)', flexShrink: 0 }} /> : <Unlock size={20} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />}
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: chainVerification.valid ? 'var(--accent-tertiary)' : 'var(--accent-danger)' }}>
                    {chainVerification.valid ? 'Blockchain Verified' : 'Chain Integrity Compromised'}
                  </strong> — {chainVerification.message}
                  {blockchain.length > 0 && (
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginLeft: '8px' }}>
                      Latest: {shortHash(blockchain[blockchain.length - 1]?.blockHash)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* AI Fraud Detection */}
          {fraudAnalysis && fraudAnalysis.anomalies.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <AIInsightsPanel
                title="AI Fraud Detection"
                insights={fraudAnalysis.anomalies.map(a => ({ type: a.severity, text: `${a.message} — ${a.suggestion}` }))}
                expanded={true}
              />
            </div>
          )}

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
            <button className={`btn ${!showGraphView ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setShowGraphView(false)}>
              <GitBranch size={14} /> Timeline View
            </button>
            <button className={`btn ${showGraphView ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setShowGraphView(true)}>
              <Network size={14} /> Graph Database View
            </button>
          </div>

          {/* Graph View */}
          {showGraphView && (
            <div className="glass-card-static" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-sm)', width: '100%' }}>
                <Network size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Graph Relationship View
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)', width: '100%' }}>
                Neo4j-inspired graph showing Owner → Vehicle → Block relationships.
                Each block contains a SHA-256 hash linking to the previous block.
              </p>
              {chain.length > 0 ? (
                <GraphView nodes={graphData.nodes} edges={graphData.edges} width={700} height={400} />
              ) : (
                <div style={{ padding: 'var(--space-2xl)', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Add ownership transfers to see the graph visualization.
                </div>
              )}
              <div style={{
                marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem', color: 'var(--text-muted)', width: '100%'
              }}>
                <strong>Relationships:</strong> (Owner)-[:TRANSFERRED_TO]→(Owner) · (Owner)-[:RECORDED_IN]→(Block) · (Block)-[:HASH_LINK]→(Block) · (Owner)-[:CURRENTLY_OWNS]→(Vehicle)
              </div>
            </div>
          )}

          {/* Timeline View */}
          {!showGraphView && (
            <div className="chain-timeline" ref={timelineRef}>
              {chainLoading && (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: 'var(--space-sm)' }}>Loading chain...</p>
                </div>
              )}
              {blockchain.map((block, i) => (
                <div key={block.id} className="chain-node visible">
                  <div className="chain-node-content">
                    <div className="chain-node-header">
                      <div className="chain-node-title">{block.owner_name}</div>
                      <div className="chain-node-date">{formatDate(block.transfer_date)}</div>
                    </div>
                    <span className={`chain-node-type ${block.transfer_type}`}>
                      {block.transfer_type === 'sale' && '💰'}
                      {block.transfer_type === 'inheritance' && '🏛️'}
                      {block.transfer_type === 'gift' && '🎁'}
                      {block.transfer_type === 'registration' && '📋'}
                      {' '}{block.transfer_type}
                    </span>
                    <p className="chain-node-notes">{block.notes}</p>

                    {/* Hash Info */}
                    <div style={{
                      marginTop: 'var(--space-md)', padding: 'var(--space-sm)',
                      background: 'rgba(6, 255, 165, 0.03)', border: '1px solid rgba(6, 255, 165, 0.1)',
                      borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}><Hash size={10} style={{ verticalAlign: 'middle' }} /> Block #{i}</span>
                        <span style={{ color: 'var(--accent-tertiary)' }}>SHA-256</span>
                      </div>
                      <div style={{ color: 'var(--accent-tertiary)', wordBreak: 'break-all', marginBottom: '4px' }}>Hash: {shortHash(block.blockHash)}</div>
                      <div style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>Prev: {i === 0 ? 'GENESIS (0x000...)' : shortHash(block.previousHash)}</div>
                    </div>

                    <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {block.verified ? (
                        <span className="status-badge status-active"><Check size={10} /> Verified</span>
                      ) : (
                        <span className="status-badge status-warning">Pending Verification</span>
                      )}
                    </div>
                  </div>
                  {i < blockchain.length - 1 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-sm) 0', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent-tertiary)' }}>⛓ HASH_LINK</span>
                      <ArrowDown size={16} />
                    </div>
                  )}
                </div>
              ))}
              {chain.length === 0 && !chainLoading && (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                  No ownership records yet. Click "Mine New Block" to add the first transfer.
                </div>
              )}
            </div>
          )}

          {/* Add Transfer */}
          <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
            <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Mine New Block (Record Transfer)
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            <h2 className="modal-title">⛓ Record Ownership Transfer</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-lg)' }}>
              This transfer will be cryptographically hashed and saved to Supabase. Once recorded, it <strong>cannot be modified</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">New Owner Name *</label>
                <input className="form-input" placeholder="Full legal name" value={newTransfer.owner_name} onChange={e => setNewTransfer({...newTransfer, owner_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Transfer Type</label>
                <select className="form-select" value={newTransfer.transfer_type} onChange={e => setNewTransfer({...newTransfer, transfer_type: e.target.value})}>
                  <option value="sale">Sale</option>
                  <option value="inheritance">Inheritance</option>
                  <option value="gift">Gift</option>
                  <option value="registration">First Registration</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" placeholder="Additional details..." value={newTransfer.notes} onChange={e => setNewTransfer({...newTransfer, notes: e.target.value})} />
              </div>
              <div style={{ padding: 'var(--space-sm)', background: 'rgba(6, 255, 165, 0.03)', border: '1px solid rgba(6, 255, 165, 0.1)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <Hash size={10} /> Previous hash: {blockchain.length > 0 ? shortHash(blockchain[blockchain.length - 1].blockHash) : 'GENESIS'}
              </div>
              <button className="btn btn-primary btn-lg" onClick={handleAddTransfer} disabled={saving}>
                {saving ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Mining...</> : <><Lock size={18} /> Mine Block & Record</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
