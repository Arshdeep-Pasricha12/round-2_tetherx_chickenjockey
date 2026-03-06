/**
 * VaultX AI Analysis Engine
 * 
 * Provides intelligent analysis across all features:
 * - Vehicle risk scoring
 * - Insurance health analysis
 * - Ownership fraud detection
 * - Stolen vehicle pattern matching
 * - Emergency response optimization
 * 
 * This runs locally using rule-based + statistical analysis.
 * Can be extended with Gemini/OpenAI API for natural language insights.
 */

// ============================================
// VEHICLE RISK SCORING
// ============================================
export function calculateVehicleRiskScore(vehicle, ownership = [], insurance = null) {
  let score = 100 // Start at 100 (perfect)
  const factors = []

  // Age factor
  const age = new Date().getFullYear() - (vehicle.year || 2024)
  if (age > 15) {
    score -= 25
    factors.push({ factor: 'Vehicle Age', impact: -25, detail: `${age} years old — high maintenance risk` })
  } else if (age > 10) {
    score -= 15
    factors.push({ factor: 'Vehicle Age', impact: -15, detail: `${age} years old — moderate risk` })
  } else if (age > 5) {
    score -= 5
    factors.push({ factor: 'Vehicle Age', impact: -5, detail: `${age} years old — low risk` })
  }

  // Insurance factor
  if (!insurance || insurance.status === 'expired') {
    score -= 30
    factors.push({ factor: 'Insurance', impact: -30, detail: 'No active insurance — CRITICAL risk' })
  } else {
    const daysToExpiry = Math.ceil((new Date(insurance.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysToExpiry < 7) {
      score -= 15
      factors.push({ factor: 'Insurance Expiry', impact: -15, detail: `Expires in ${daysToExpiry} days` })
    } else if (daysToExpiry < 30) {
      score -= 5
      factors.push({ factor: 'Insurance Expiry', impact: -5, detail: `Expires in ${daysToExpiry} days` })
    }
  }

  // Ownership frequency
  if (ownership.length > 5) {
    score -= 15
    factors.push({ factor: 'Ownership Changes', impact: -15, detail: `${ownership.length} owners — unusually high turnover` })
  } else if (ownership.length > 3) {
    score -= 5
    factors.push({ factor: 'Ownership Changes', impact: -5, detail: `${ownership.length} owners` })
  }

  // Stolen status
  if (vehicle.status === 'stolen') {
    score -= 50
    factors.push({ factor: 'Stolen Status', impact: -50, detail: 'Vehicle reported stolen' })
  }

  // Unverified transfers
  const unverified = ownership.filter(t => !t.verified).length
  if (unverified > 0) {
    score -= unverified * 8
    factors.push({ factor: 'Unverified Transfers', impact: -(unverified * 8), detail: `${unverified} transfer(s) pending verification` })
  }

  score = Math.max(0, Math.min(100, score))

  let grade, gradeColor
  if (score >= 85) { grade = 'A+'; gradeColor = '#06ffa5' }
  else if (score >= 70) { grade = 'A'; gradeColor = '#06ffa5' }
  else if (score >= 55) { grade = 'B'; gradeColor = '#00d4ff' }
  else if (score >= 40) { grade = 'C'; gradeColor = '#ff6b35' }
  else if (score >= 25) { grade = 'D'; gradeColor = '#ff3366' }
  else { grade = 'F'; gradeColor = '#ff3366' }

  return { score, grade, gradeColor, factors }
}

// ============================================
// INSURANCE HEALTH ANALYSIS
// ============================================
export function analyzeInsuranceHealth(policies) {
  const insights = []
  const now = new Date()

  if (!policies || policies.length === 0) {
    return {
      status: 'critical',
      insights: [{ type: 'danger', text: 'No insurance policies found. Driving without insurance is illegal in India under Motor Vehicles Act.' }]
    }
  }

  const activePolicies = policies.filter(p => new Date(p.end_date) > now)
  const expiredPolicies = policies.filter(p => new Date(p.end_date) <= now)

  if (activePolicies.length === 0) {
    insights.push({ type: 'danger', text: 'All insurance policies have expired! Immediate renewal required.' })
  }

  activePolicies.forEach(p => {
    const daysLeft = Math.ceil((new Date(p.end_date) - now) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 7) {
      insights.push({ type: 'danger', text: `Policy ${p.policy_number} expires in ${daysLeft} day(s)! Renew immediately.` })
    } else if (daysLeft <= 30) {
      insights.push({ type: 'warning', text: `Policy ${p.policy_number} expires in ${daysLeft} days. Schedule renewal.` })
    } else {
      insights.push({ type: 'success', text: `Policy ${p.policy_number} is active with ${daysLeft} days remaining.` })
    }

    if (p.coverage_type === 'third_party') {
      insights.push({ type: 'info', text: `Consider upgrading from Third Party to Comprehensive for full protection.` })
    }
  })

  // Gap analysis
  if (expiredPolicies.length > 0 && activePolicies.length > 0) {
    const lastExpiry = new Date(Math.max(...expiredPolicies.map(p => new Date(p.end_date))))
    const firstActive = new Date(Math.min(...activePolicies.map(p => new Date(p.start_date))))
    const gapDays = Math.ceil((firstActive - lastExpiry) / (1000 * 60 * 60 * 24))
    if (gapDays > 0) {
      insights.push({ type: 'warning', text: `Insurance gap of ${gapDays} day(s) detected between policies. This may affect claims.` })
    }
  }

  const status = insights.some(i => i.type === 'danger') ? 'critical' :
    insights.some(i => i.type === 'warning') ? 'warning' : 'healthy'

  return { status, insights }
}

// ============================================
// OWNERSHIP FRAUD DETECTION
// ============================================
export function detectOwnershipAnomalies(chain) {
  const anomalies = []

  if (chain.length < 2) return { safe: true, anomalies }

  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1]
    const curr = chain[i]

    // Rapid succession transfer (within 30 days)
    const daysBetween = Math.ceil(
      (new Date(curr.transfer_date) - new Date(prev.transfer_date)) / (1000 * 60 * 60 * 24)
    )

    if (daysBetween < 30) {
      anomalies.push({
        severity: 'high',
        type: 'rapid_transfer',
        message: `Suspicious: Transfer from "${prev.owner_name}" to "${curr.owner_name}" in just ${daysBetween} days.`,
        suggestion: 'Rapidly resold vehicles may indicate fraud, price inflation, or title washing.'
      })
    }

    // Unverified transfer in the middle of verified ones
    if (!curr.verified && prev.verified && i < chain.length - 1) {
      anomalies.push({
        severity: 'medium',
        type: 'unverified_gap',
        message: `Unverified transfer to "${curr.owner_name}" breaks the verification chain.`,
        suggestion: 'Request original transfer documents to verify this transaction.'
      })
    }

    // Same owner appearing twice (circular ownership)
    const ownerCount = chain.filter(c => c.owner_name === curr.owner_name).length
    if (ownerCount > 1) {
      anomalies.push({
        severity: 'medium',
        type: 'circular_ownership',
        message: `"${curr.owner_name}" appears ${ownerCount} times in the chain.`,
        suggestion: 'Circular ownership can indicate title-washing fraud.'
      })
    }
  }

  // Too many transfers total
  if (chain.length > 6) {
    anomalies.push({
      severity: 'low',
      type: 'high_turnover',
      message: `Vehicle has changed hands ${chain.length} times — above average.`,
      suggestion: 'High turnover could indicate recurring issues with the vehicle.'
    })
  }

  return { safe: anomalies.length === 0, anomalies }
}

// ============================================
// STOLEN VEHICLE PATTERN ANALYSIS
// ============================================
export function analyzeStolenPatterns(alerts) {
  const insights = []

  if (alerts.length === 0) return { insights }

  // Time-of-day analysis
  const nightAlerts = alerts.filter(a => {
    const hour = new Date(a.created_at).getHours()
    return hour >= 22 || hour <= 5
  })

  if (nightAlerts.length > alerts.length * 0.5) {
    insights.push({
      type: 'pattern',
      text: `${Math.round((nightAlerts.length / alerts.length) * 100)}% of thefts occur between 10 PM - 5 AM. Consider additional nighttime security.`
    })
  }

  // Location clustering
  const locations = {}
  alerts.forEach(a => {
    if (a.last_seen_location) {
      const area = a.last_seen_location.split(',')[0].trim()
      locations[area] = (locations[area] || 0) + 1
    }
  })

  const hotspots = Object.entries(locations)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])

  hotspots.forEach(([area, count]) => {
    insights.push({
      type: 'hotspot',
      text: `⚠️ ${area} is a theft hotspot with ${count} reported cases.`
    })
  })

  // Recovery rate
  const recovered = alerts.filter(a => a.status === 'recovered').length
  const rate = alerts.length > 0 ? Math.round((recovered / alerts.length) * 100) : 0
  insights.push({
    type: 'stat',
    text: `Recovery rate: ${rate}% (${recovered}/${alerts.length}). ${rate < 50 ? 'Community reporting helps improve this.' : 'Strong community engagement!'}`
  })

  // Sighting effectiveness
  const withSightings = alerts.filter(a => a.stolen_sightings && a.stolen_sightings.length > 0)
  if (withSightings.length > 0) {
    const avgSightings = Math.round(withSightings.reduce((sum, a) => sum + a.stolen_sightings.length, 0) / withSightings.length)
    insights.push({
      type: 'stat',
      text: `Average ${avgSightings} sighting(s) per alert. More sightings = faster recovery.`
    })
  }

  return { insights }
}

// ============================================
// EMERGENCY RESPONSE OPTIMIZATION
// ============================================
export function optimizeEmergencyResponse(owner, vehicle) {
  const checklist = []

  if (!owner?.blood_type) {
    checklist.push({ complete: false, text: 'Add blood type — critical for emergency transfusions', priority: 'critical' })
  } else {
    checklist.push({ complete: true, text: `Blood type: ${owner.blood_type}`, priority: 'done' })
  }

  if (!owner?.emergency_contact || !owner?.emergency_phone) {
    checklist.push({ complete: false, text: 'Add emergency contact — first person notified in an accident', priority: 'critical' })
  } else {
    checklist.push({ complete: true, text: `Emergency contact: ${owner.emergency_contact}`, priority: 'done' })
  }

  if (!owner?.phone) {
    checklist.push({ complete: false, text: 'Add your phone number', priority: 'high' })
  }

  if (!vehicle) {
    checklist.push({ complete: false, text: 'Link a vehicle to broadcast vehicle info in emergencies', priority: 'high' })
  }

  const readiness = Math.round((checklist.filter(c => c.complete).length / checklist.length) * 100)

  return { readiness, checklist }
}
