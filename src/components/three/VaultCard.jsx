import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function VaultCard({ flipped = false, vehicleData = {} }) {
  const cardRef = useRef()
  const particlesRef = useRef()

  useFrame((state) => {
    if (cardRef.current) {
      const targetRotY = flipped ? Math.PI : 0
      cardRef.current.rotation.y += (targetRotY - cardRef.current.rotation.y) * 0.05
      cardRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.002
    }
  })

  return (
    <group>
      <group ref={cardRef}>
        {/* Card body */}
        <mesh>
          <boxGeometry args={[3, 1.8, 0.05]} />
          <meshStandardMaterial
            color="#1a1a2e"
            emissive="#00d4ff"
            emissiveIntensity={0.05}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Card border frame */}
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[3.05, 1.85, 0.01]} />
          <meshStandardMaterial
            color="#00d4ff"
            wireframe
            emissive="#00d4ff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Holographic stripe */}
        <mesh position={[0, 0.5, 0.04]}>
          <boxGeometry args={[2.8, 0.08, 0.01]} />
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#7c3aed"
            emissiveIntensity={0.6}
            transparent
            opacity={0.7}
          />
        </mesh>

        <mesh position={[0, -0.5, 0.04]}>
          <boxGeometry args={[2.8, 0.08, 0.01]} />
          <meshStandardMaterial
            color="#06ffa5"
            emissive="#06ffa5"
            emissiveIntensity={0.6}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Corner accents */}
        {[[-1.4, 0.8], [1.4, 0.8], [-1.4, -0.8], [1.4, -0.8]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.04]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={1}
            />
          </mesh>
        ))}

        {/* Back side - Shield icon */}
        <mesh position={[0, 0, -0.04]} rotation={[0, Math.PI, 0]}>
          <boxGeometry args={[3.05, 1.85, 0.01]} />
          <meshStandardMaterial
            color="#7c3aed"
            wireframe
            emissive="#7c3aed"
            emissiveIntensity={0.3}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Back shield icon */}
        <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color="#06ffa5"
            wireframe
            emissive="#06ffa5"
            emissiveIntensity={0.5}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      {/* Floating particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={80}
            array={new Float32Array(Array.from({ length: 240 }, () => (Math.random() - 0.5) * 5))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#00d4ff" size={0.02} transparent opacity={0.4} sizeAttenuation />
      </points>
    </group>
  )
}
