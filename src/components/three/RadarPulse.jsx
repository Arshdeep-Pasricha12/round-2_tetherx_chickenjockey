import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function RadarPulse({ active = false }) {
  const ringsRef = useRef([])
  const coreRef = useRef()
  const beamsRef = useRef()

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Pulse the core
    if (coreRef.current) {
      const scale = active ? 1 + Math.sin(time * 4) * 0.15 : 1
      coreRef.current.scale.setScalar(scale)
    }

    // Animate rings outward
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        if (active) {
          const phase = (time * 0.8 + i * 0.5) % 2
          const scale = 0.5 + phase * 1.5
          ring.scale.setScalar(scale)
          ring.material.opacity = Math.max(0, 0.6 - phase * 0.3)
        } else {
          ring.scale.setScalar(1 + i * 0.3)
          ring.material.opacity = 0.1
        }
      }
    })

    // Rotate scan beams
    if (beamsRef.current && active) {
      beamsRef.current.rotation.z += 0.03
    }
  })

  return (
    <group>
      {/* Central core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color={active ? '#ff3366' : '#ff6b35'}
          emissive={active ? '#ff3366' : '#ff6b35'}
          emissiveIntensity={active ? 1 : 0.3}
        />
      </mesh>

      {/* SOS Text ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[0.4, 0.03, 8, 32]} />
        <meshStandardMaterial 
          color="#ff3366"
          emissive="#ff3366"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Expanding pulse rings */}
      {[0, 1, 2, 3].map(i => (
        <mesh
          key={i}
          ref={el => ringsRef.current[i] = el}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.9, 0.95, 64]} />
          <meshStandardMaterial
            color="#ff3366"
            emissive="#ff3366"
            emissiveIntensity={0.3}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Scan beams */}
      <group ref={beamsRef}>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8]}>
            <boxGeometry args={[0.02, 0.02, 0.6]} />
            <meshStandardMaterial
              color="#ff6b35"
              emissive="#ff6b35"
              emissiveIntensity={0.5}
              transparent
              opacity={active ? 0.6 : 0.15}
            />
          </mesh>
        ))}
      </group>

      {/* Ambient glow */}
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial
          color="#ff3366"
          transparent
          opacity={active ? 0.04 : 0.01}
          emissive="#ff3366"
          emissiveIntensity={0.05}
        />
      </mesh>
    </group>
  )
}
