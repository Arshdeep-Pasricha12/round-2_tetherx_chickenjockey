import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Shield, Link2, Car, AlertTriangle, Radio, Home } from 'lucide-react'
import Landing from './pages/Landing'
import VehicleVault from './pages/VehicleVault'
import OwnershipChain from './pages/OwnershipChain'
import InsuranceShield from './pages/InsuranceShield'
import EmergencySOS from './pages/EmergencySOS'
import StolenAlert from './pages/StolenAlert'
import LoadingScreen from './components/LoadingScreen'

function Navbar() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <nav className="navbar" style={{ background: isLanding ? 'transparent' : undefined, borderBottom: isLanding ? '1px solid transparent' : undefined }}>
      <NavLink to="/" className="navbar-logo">
        <Shield size={28} />
        VaultX
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <Home size={16} /> Home
        </NavLink>
        <NavLink to="/vault" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Car size={16} /> Vault
        </NavLink>
        <NavLink to="/ownership" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Link2 size={16} /> Chain
        </NavLink>
        <NavLink to="/insurance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Shield size={16} /> Shield
        </NavLink>
        <NavLink to="/sos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Radio size={16} /> SOS
        </NavLink>
        <NavLink to="/stolen" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={16} /> Alerts
        </NavLink>
      </div>
    </nav>
  )
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/vault" element={<VehicleVault />} />
          <Route path="/ownership" element={<OwnershipChain />} />
          <Route path="/insurance" element={<InsuranceShield />} />
          <Route path="/sos" element={<EmergencySOS />} />
          <Route path="/stolen" element={<StolenAlert />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
