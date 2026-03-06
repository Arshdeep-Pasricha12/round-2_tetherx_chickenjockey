import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://cshzxltrhpmmupbqnvlw.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaHp4bHRyaHBtbXVwYnFudmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODcxNjksImV4cCI6MjA4ODM2MzE2OX0.FwIt7qNliLZUWM6EV4ZV4_Ro2sckkyTHLpZFIVjk9cw'
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// VEHICLES
// ============================================
app.get('/api/vehicles', async (req, res) => {
  const { data, error } = await supabase.from('vehicles').select('*, vehicle_ownership(*), insurance_policies(*)')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/vehicles/:id', async (req, res) => {
  const { data, error } = await supabase.from('vehicles').select('*, vehicle_ownership(*), insurance_policies(*)').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Vehicle not found' })
  res.json(data)
})

app.post('/api/vehicles', async (req, res) => {
  const { data, error } = await supabase.from('vehicles').insert(req.body).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

app.put('/api/vehicles/:id', async (req, res) => {
  const { data, error } = await supabase.from('vehicles').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// ============================================
// OWNERSHIP CHAIN
// ============================================
app.get('/api/ownership/:vehicleId', async (req, res) => {
  const { data, error } = await supabase
    .from('vehicle_ownership')
    .select('*')
    .eq('vehicle_id', req.params.vehicleId)
    .order('transfer_date', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/ownership', async (req, res) => {
  const { data, error } = await supabase.from('vehicle_ownership').insert(req.body).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

// ============================================
// INSURANCE
// ============================================
app.get('/api/insurance/:vehicleId', async (req, res) => {
  const { data, error } = await supabase
    .from('insurance_policies')
    .select('*')
    .eq('vehicle_id', req.params.vehicleId)
    .order('end_date', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/insurance/verify/:regNumber', async (req, res) => {
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('registration_number', req.params.regNumber)
    .single()

  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found', insured: false })

  const { data: policy } = await supabase
    .from('insurance_policies')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  res.json({
    insured: !!policy,
    policy: policy || null,
    registration: req.params.regNumber
  })
})

app.post('/api/insurance', async (req, res) => {
  const { data, error } = await supabase.from('insurance_policies').insert(req.body).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

// ============================================
// EMERGENCY SOS
// ============================================
app.post('/api/emergency/broadcast', async (req, res) => {
  const { vehicle_id, owner_id, location_lat, location_lng } = req.body

  const { data, error } = await supabase
    .from('emergency_broadcasts')
    .insert({
      vehicle_id,
      owner_id,
      location_lat,
      location_lng,
      timestamp: new Date().toISOString(),
      status: 'active'
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  // In production: send SMS via Twilio, push notifications, etc.
  console.log(`🆘 EMERGENCY BROADCAST - Vehicle: ${vehicle_id}, Location: ${location_lat}, ${location_lng}`)

  res.status(201).json({ ...data, broadcast_url: `https://vaultx.app/sos/broadcast/${data.id}` })
})

app.put('/api/emergency/:id/cancel', async (req, res) => {
  const { data, error } = await supabase
    .from('emergency_broadcasts')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// ============================================
// STOLEN VEHICLE ALERTS
// ============================================
app.get('/api/stolen', async (req, res) => {
  const { data, error } = await supabase
    .from('stolen_alerts')
    .select('*, stolen_sightings(*)')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/stolen', async (req, res) => {
  const { vehicle_id } = req.body

  // Mark vehicle as stolen
  await supabase.from('vehicles').update({ status: 'stolen' }).eq('id', vehicle_id)

  const { data, error } = await supabase.from('stolen_alerts').insert(req.body).select().single()
  if (error) return res.status(400).json({ error: error.message })

  console.log(`🚨 STOLEN ALERT BROADCAST - Vehicle: ${vehicle_id}`)
  res.status(201).json(data)
})

app.post('/api/stolen/:alertId/sighting', async (req, res) => {
  const { data, error } = await supabase
    .from('stolen_sightings')
    .insert({
      ...req.body,
      alert_id: req.params.alertId,
      timestamp: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  console.log(`👁️ SIGHTING REPORTED for alert ${req.params.alertId}`)
  res.status(201).json(data)
})

app.put('/api/stolen/:alertId/recover', async (req, res) => {
  const { data: alert } = await supabase
    .from('stolen_alerts')
    .update({ status: 'recovered' })
    .eq('id', req.params.alertId)
    .select()
    .single()

  if (alert?.vehicle_id) {
    await supabase.from('vehicles').update({ status: 'active' }).eq('id', alert.vehicle_id)
  }

  res.json(alert)
})

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VaultX API', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n⛨  VaultX API Server running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})
