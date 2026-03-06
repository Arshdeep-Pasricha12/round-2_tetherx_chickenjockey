import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function AlertBeacon({ active = true }) {
  const beaconRef = useRef()
  const ringsRef = useRef([])
  const spikesRef = useRef()

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (beaconRef.current) {
      beaconRef.current.rotation.y += active ? 0.02 : 0.005
      beaconRef.current.position.y = Math.sin(time) * 0.1
    }

    ringsRef.current.forEach((ring, i) => {
      if (ring && active) {
        const phase = (time + i * 0.7) % 3
        ring.scale.setScalar(0.3 + phase * 0.8)
        ring.material.opacity = Math.max(0, 0.5 - phase * 0.17)
        ring.position.y = phase * 0.5
      }
    })

    if (spikesRef.current && active) {
      spikesRef.current.rotation.y -= 0.015
    }
  })

  return (
    <group>
      <group ref={beaconRef}>
        {/* Main beacon - triangle alert */}
        <mesh>
          <coneGeometry args={[0.8, 1.2, 3]} />
          <meshStandardMaterial
            color="#ff3366"
            wireframe
            emissive="#ff3366"
            emissiveIntensity={active ? 0.6 : 0.2}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Inner triangle */}
        <mesh scale={0.5}>
          <coneGeometry args={[0.8, 1.2, 3]} />
          <meshStandardMaterial
            color="#ff6b35"
            emissive="#ff6b35"
            emissiveIntensity={0.3}
            transparent
            opacity={0.2}
          />
        </mesh>

        {/* Exclamation mark */}
        <mesh position={[0, 0.1, 0.4]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, -0.2, 0.4]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Alert pulse rings */}
      {[0, 1, 2].map(i => (
        <mesh
          key={i}
          ref={el => ringsRef.current[i] = el}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.8, 0.85, 32]} />
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

      {/* Rotating spikes */}
      <group ref={spikesRef}>
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(angle) * 1.3, 0, Math.sin(angle) * 1.3]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.03, 0.03, 0.3]} />
              <meshStandardMaterial
                color="#ff6b35"
                emissive="#ff6b35"
                emissiveIntensity={0.4}
                transparent
                opacity={active ? 0.5 : 0.1}
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
