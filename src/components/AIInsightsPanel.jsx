import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react'

/**
 * AI Insights Panel — Reusable component for displaying AI analysis results
 */
export default function AIInsightsPanel({ title = 'AI Analysis', insights = [], riskScore = null, expanded: defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const getInsightIcon = (type) => {
    switch (type) {
      case 'danger': case 'critical': case 'high': return <AlertTriangle size={14} style={{ color: 'var(--accent-danger)' }} />
      case 'warning': case 'medium': return <AlertTriangle size={14} style={{ color: 'var(--accent-warning)' }} />
      case 'success': case 'done': return <CheckCircle size={14} style={{ color: 'var(--accent-tertiary)' }} />
      case 'info': case 'pattern': case 'stat': case 'hotspot': return <Info size={14} style={{ color: 'var(--accent-primary)' }} />
      default: return <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
    }
  }

  const getInsightColor = (type) => {
    switch (type) {
      case 'danger': case 'critical': case 'high': return 'rgba(255, 51, 102, 0.06)'
      case 'warning': case 'medium': return 'rgba(255, 107, 53, 0.06)'
      case 'success': case 'done': return 'rgba(6, 255, 165, 0.06)'
      default: return 'rgba(0, 212, 255, 0.06)'
    }
  }

  return (
    <div style={{
      background: 'rgba(124, 58, 237, 0.04)',
      border: '1px solid rgba(124, 58, 237, 0.15)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 'var(--space-md) var(--space-lg)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Brain size={18} style={{ color: 'var(--accent-secondary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>{title}</span>
          {riskScore && (
            <span style={{
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              background: `${riskScore.gradeColor}15`,
              color: riskScore.gradeColor,
              border: `1px solid ${riskScore.gradeColor}30`
            }}>
              {riskScore.grade} ({riskScore.score}/100)
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Insights */}
      {expanded && (
        <div style={{ padding: '0 var(--space-lg) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {insights.map((insight, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'start', gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: getInsightColor(insight.type || insight.severity || insight.priority),
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}>
              <span style={{ marginTop: '2px', flexShrink: 0 }}>{getInsightIcon(insight.type || insight.severity || insight.priority)}</span>
              <span>{insight.text || insight.message || insight.detail}</span>
            </div>
          ))}

          {/* Risk factors */}
          {riskScore?.factors?.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Risk Factors
              </div>
              {riskScore.factors.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '4px var(--space-sm)',
                  fontSize: '0.78rem', color: 'var(--text-secondary)'
                }}>
                  <span>{f.factor}: {f.detail}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    color: f.impact < 0 ? 'var(--accent-danger)' : 'var(--accent-tertiary)'
                  }}>
                    {f.impact > 0 ? '+' : ''}{f.impact}
                  </span>
                </div>
              ))}
            </div>
          )}

          {insights.length === 0 && !riskScore && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
              No data available for analysis. Add records to see AI-powered insights.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
