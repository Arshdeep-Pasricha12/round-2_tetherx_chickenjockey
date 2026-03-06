-- ============================================
-- VaultX — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. OWNERS TABLE
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  blood_type TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  registration_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'stolen', 'deregistered')),
  current_owner_id UUID REFERENCES owners(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VEHICLE OWNERSHIP (Append-only transfer chain)
CREATE TABLE IF NOT EXISTS vehicle_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  owner_id UUID REFERENCES owners(id),
  owner_name TEXT NOT NULL,
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('registration', 'sale', 'inheritance', 'gift')),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INSURANCE POLICIES
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  provider TEXT NOT NULL,
  policy_number TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  coverage_type TEXT DEFAULT 'comprehensive' CHECK (coverage_type IN ('comprehensive', 'third_party', 'own_damage')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EMERGENCY BROADCASTS
CREATE TABLE IF NOT EXISTS emergency_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  owner_id UUID REFERENCES owners(id),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOLEN ALERTS
CREATE TABLE IF NOT EXISTS stolen_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  reported_by TEXT NOT NULL,
  description TEXT,
  last_seen_location TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'recovered', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STOLEN SIGHTINGS
CREATE TABLE IF NOT EXISTS stolen_sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES stolen_alerts(id) NOT NULL,
  reported_by TEXT DEFAULT 'Anonymous',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location TEXT,
  description TEXT,
  photo_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_ownership_vehicle ON vehicle_ownership(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_insurance_vehicle ON insurance_policies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_insurance_end_date ON insurance_policies(end_date);
CREATE INDEX IF NOT EXISTS idx_stolen_status ON stolen_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sightings_alert ON stolen_sightings(alert_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stolen_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stolen_sightings ENABLE ROW LEVEL SECURITY;

-- Allow public read access for hackathon demo
CREATE POLICY "Allow public read" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON vehicles FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON owners FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON owners FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON vehicle_ownership FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON vehicle_ownership FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON insurance_policies FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON insurance_policies FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON emergency_broadcasts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON emergency_broadcasts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON emergency_broadcasts FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON stolen_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON stolen_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON stolen_alerts FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON stolen_sightings FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON stolen_sightings FOR INSERT WITH CHECK (true);
