import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Shield3D({ active = true }) {
  const shieldRef = useRef()
  const glowRef = useRef()
  const particlesRef = useRef()

  const shieldColor = active ? '#06ffa5' : '#ff3366'
  const emissiveIntensity = active ? 0.4 : 0.6

  useFrame((state) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.y += 0.008
      shieldRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05)
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y -= 0.005
      particlesRef.current.rotation.x += 0.002
    }
  })

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(150 * 3)
    for (let i = 0; i < 150; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 1.8 + Math.random() * 0.5
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    return positions
  }, [])

  return (
    <group>
      {/* Main Shield Shape */}
      <group ref={shieldRef}>
        {/* Shield body - octahedron as base */}
        <mesh>
          <octahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={shieldColor}
            wireframe
            emissive={shieldColor}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Inner shield */}
        <mesh scale={0.7}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={shieldColor}
            emissive={shieldColor}
            emissiveIntensity={0.2}
            transparent
            opacity={0.15}
          />
        </mesh>

        {/* Shield cross / check */}
        {active ? (
          <>
            <mesh position={[0, 0.1, 0.6]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.08, 0.5, 0.08]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[-0.15, -0.1, 0.6]} rotation={[0, 0, 0.6]}>
              <boxGeometry args={[0.08, 0.3, 0.08]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[0, 0, 0.6]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.6]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={0.8} />
            </mesh>
          </>
        )}

        {/* Cracks for expired */}
        {!active && (
          <>
            {[0, 1, 2].map(i => (
              <mesh key={i} position={[0.3 * (i - 1), 0.2 * (i - 1), 0.5]} rotation={[0, 0, 0.5 + i * 0.3]}>
                <boxGeometry args={[0.03, 0.4, 0.03]} />
                <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.6} transparent opacity={0.7} />
              </mesh>
            ))}
          </>
        )}
      </group>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial
          color={shieldColor}
          transparent
          opacity={0.03}
          emissive={shieldColor}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Floating particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={150}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={shieldColor}
          size={0.03}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
