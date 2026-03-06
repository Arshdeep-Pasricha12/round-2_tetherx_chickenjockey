import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function CarModel({ color = '#00d4ff', wireframe = true }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: color,
    wireframe: wireframe,
    emissive: color,
    emissiveIntensity: wireframe ? 0.3 : 0.1,
    transparent: true,
    opacity: wireframe ? 0.7 : 1,
  }), [color, wireframe])

  const glassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7c3aed',
    wireframe: wireframe,
    emissive: '#7c3aed',
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.5,
  }), [wireframe])

  const wheelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#06ffa5',
    wireframe: wireframe,
    emissive: '#06ffa5',
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.6,
  }), [wireframe])

  return (
    <group ref={groupRef} scale={1.2}>
      {/* Car Body - Main */}
      <mesh position={[0, 0.35, 0]} material={bodyMaterial}>
        <boxGeometry args={[2.4, 0.5, 1.1]} />
      </mesh>

      {/* Car Body - Top / Cabin */}
      <mesh position={[0.1, 0.75, 0]} material={glassMaterial}>
        <boxGeometry args={[1.4, 0.45, 0.95]} />
      </mesh>

      {/* Front Hood slope */}
      <mesh position={[-0.85, 0.55, 0]} rotation={[0, 0, -0.3]} material={bodyMaterial}>
        <boxGeometry args={[0.5, 0.15, 1.0]} />
      </mesh>

      {/* Rear Trunk slope */}
      <mesh position={[0.95, 0.55, 0]} rotation={[0, 0, 0.25]} material={bodyMaterial}>
        <boxGeometry args={[0.4, 0.15, 1.0]} />
      </mesh>

      {/* Wheels */}
      {[[-0.75, 0.05, 0.6], [-0.75, 0.05, -0.6], [0.75, 0.05, 0.6], [0.75, 0.05, -0.6]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} material={wheelMaterial}>
          <torusGeometry args={[0.18, 0.07, 8, 16]} />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[-1.2, 0.35, 0.35]} material={new THREE.MeshStandardMaterial({ color: '#ffd700', emissive: '#ffd700', emissiveIntensity: 1 })}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </mesh>
      <mesh position={[-1.2, 0.35, -0.35]} material={new THREE.MeshStandardMaterial({ color: '#ffd700', emissive: '#ffd700', emissiveIntensity: 1 })}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </mesh>

      {/* Taillights */}
      <mesh position={[1.2, 0.35, 0.35]} material={new THREE.MeshStandardMaterial({ color: '#ff3366', emissive: '#ff3366', emissiveIntensity: 1 })}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </mesh>
      <mesh position={[1.2, 0.35, -0.35]} material={new THREE.MeshStandardMaterial({ color: '#ff3366', emissive: '#ff3366', emissiveIntensity: 1 })}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </mesh>

      {/* Ground reflection ring */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.2, 64]} />
        <meshStandardMaterial color={color} transparent opacity={0.05} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}
