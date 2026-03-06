import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'

/**
 * Interactive Graph Database Visualization
 * Renders Owner → Vehicle → Block relationships as an interactive force-directed graph
 */
export default function GraphView({ nodes = [], edges = [], width = 600, height = 400 }) {
  const canvasRef = useRef(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const containerRef = useRef(null)
  const animatedNodes = useRef([])

  // Compute layout positions (circular + force-inspired)
  useEffect(() => {
    if (!nodes.length) return

    const cx = width / 2
    const cy = height / 2

    const owners = nodes.filter(n => n.type === 'owner')
    const blocks = nodes.filter(n => n.type === 'block')
    const vehicles = nodes.filter(n => n.type === 'vehicle')

    const positioned = nodes.map(node => {
      let x, y, color, radius

      if (node.type === 'vehicle') {
        x = cx
        y = cy
        color = '#00d4ff'
        radius = 28
      } else if (node.type === 'owner') {
        const idx = owners.indexOf(node)
        const angle = (idx / owners.length) * Math.PI * 2 - Math.PI / 2
        const r = Math.min(width, height) * 0.32
        x = cx + Math.cos(angle) * r
        y = cy + Math.sin(angle) * r
        color = '#7c3aed'
        radius = 22
      } else {
        const idx = blocks.indexOf(node)
        const angle = (idx / blocks.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / blocks.length
        const r = Math.min(width, height) * 0.18
        x = cx + Math.cos(angle) * r
        y = cy + Math.sin(angle) * r
        color = '#06ffa5'
        radius = 16
      }

      return { ...node, x, y, color, radius }
    })

    animatedNodes.current = positioned
    drawGraph()
  }, [nodes, edges, width, height])

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const posMap = {}
    animatedNodes.current.forEach(n => { posMap[n.id] = n })

    // Draw edges
    edges.forEach(edge => {
      const from = posMap[edge.from]
      const to = posMap[edge.to]
      if (!from || !to) return

      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)

      if (edge.type === 'active') {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([])
      } else if (edge.type === 'transfer') {
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 5])
      } else if (edge.type === 'hash') {
        ctx.strokeStyle = 'rgba(6, 255, 165, 0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 0.8
        ctx.setLineDash([2, 4])
      }

      ctx.stroke()
      ctx.setLineDash([])

      // Edge label
      const mx = (from.x + to.x) / 2
      const my = (from.y + to.y) / 2
      ctx.font = '8px "Space Grotesk"'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.textAlign = 'center'
      ctx.fillText(edge.label, mx, my - 4)

      // Arrowhead
      const angle = Math.atan2(to.y - from.y, to.x - from.x)
      const arrowLen = 8
      const ax = to.x - Math.cos(angle) * (to.radius + 4)
      const ay = to.y - Math.sin(angle) * (to.radius + 4)

      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax - arrowLen * Math.cos(angle - 0.4), ay - arrowLen * Math.sin(angle - 0.4))
      ctx.lineTo(ax - arrowLen * Math.cos(angle + 0.4), ay - arrowLen * Math.sin(angle + 0.4))
      ctx.closePath()
      ctx.fillStyle = edge.type === 'active' ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)'
      ctx.fill()
    })

    // Draw nodes
    animatedNodes.current.forEach(node => {
      const isHovered = hoveredNode === node.id

      // Glow
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius + (isHovered ? 8 : 4), 0, Math.PI * 2)
      ctx.fillStyle = node.color.replace(')', ', 0.08)')
        .replace('rgb', 'rgba')
        .replace('#', '')
      const gradient = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, node.radius + 12)
      gradient.addColorStop(0, `${node.color}22`)
      gradient.addColorStop(1, `${node.color}00`)
      ctx.fillStyle = gradient
      ctx.fill()

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#12121a'
      ctx.fill()
      ctx.strokeStyle = node.color
      ctx.lineWidth = isHovered ? 2.5 : 1.5
      ctx.stroke()

      // Icon/text
      ctx.font = node.type === 'vehicle' ? 'bold 11px "Space Grotesk"' : '9px "Space Grotesk"'
      ctx.fillStyle = node.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (node.type === 'vehicle') {
        ctx.fillText('🚗', node.x, node.y)
      } else if (node.type === 'owner') {
        ctx.fillText('👤', node.x, node.y - 2)
        ctx.font = '8px "Space Grotesk"'
        ctx.fillStyle = '#e8e8f0'
        const name = node.label.split(' ')[0] 
        ctx.fillText(name, node.x, node.y + 10)
      } else {
        ctx.fillText('#' + node.label.split('#')[1], node.x, node.y)
      }

      // Label below node
      ctx.font = '9px "Space Grotesk"'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.textAlign = 'center'
      if (node.type !== 'owner') {
        ctx.fillText(node.label, node.x, node.y + node.radius + 14)
      }
    })
  }

  // Redraw on hover change
  useEffect(() => { drawGraph() }, [hoveredNode])

  const handleMouse = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let found = null
    animatedNodes.current.forEach(node => {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist < node.radius + 5) found = node.id
    })
    setHoveredNode(found)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height, cursor: hoveredNode ? 'pointer' : 'default' }}
        onMouseMove={handleMouse}
        onMouseLeave={() => setHoveredNode(null)}
      />
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center' }}>
        {[
          { color: '#7c3aed', label: 'Owner Node' },
          { color: '#00d4ff', label: 'Vehicle Node' },
          { color: '#06ffa5', label: 'Block Node' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
