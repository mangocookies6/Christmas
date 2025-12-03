import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getConePosition, getSpherePosition, pseudoRandom } from '../utils/math'
import { useGameStore } from '../store/gameStore'

interface Props {
  count?: number
  color?: string
  scale?: number
}

const BowOrnaments: React.FC<Props> = ({ count = 40, color = '#FF9FD6', scale = 1 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const mode = useGameStore((state) => state.mode)

  const data = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const target = getConePosition(i, count, 7.2, 13.5, {
        layers: 12,
        layerGap: 0.15,
        jitter: 0.35,
      })
      const chaosRadius = 23 + pseudoRandom(i * 1.41 + 9) * 12
      const chaos = getSpherePosition(chaosRadius, i * 2.74)
      return {
        target,
        chaos,
        current: target.clone(),
        scale: scale * (0.7 + pseudoRandom(i * 3.58 + 3) * 0.4),
        tilt: (pseudoRandom(i * 4.1 + 6) - 0.5) * 0.6,
      }
    })
  }, [count, scale])

  const dummy = new THREE.Object3D()

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const isChaos = mode === 'CHAOS'

    data.forEach((item, i) => {
      const dest = isChaos ? item.chaos : item.target
      const targetVec = dest.clone()
      item.current.lerp(targetVec, isChaos ? 0.08 : 0.05)

      if (isNaN(item.current.x)) item.current.copy(item.target)

      dummy.position.copy(item.current)
      dummy.rotation.set(
        isChaos ? state.clock.elapsedTime * 0.4 + i : 0,
        isChaos ? state.clock.elapsedTime * 0.3 : 0,
        item.tilt
      )
      dummy.scale.setScalar(item.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  })

  const geometry = useMemo(() => new THREE.TorusGeometry(0.45, 0.15, 16, 32), [])

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
    </instancedMesh>
  )
}

export default BowOrnaments


