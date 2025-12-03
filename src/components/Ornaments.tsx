import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getConePosition, getSpherePosition, pseudoRandom } from '../utils/math'
import { useGameStore } from '../store/gameStore'

type OrnamentType = 'GIFT' | 'BAUBLE' | 'LIGHT'

interface Props {
  type: OrnamentType
  count: number
  color?: string
  scale?: number
  metalness?: number
  roughness?: number
  emissive?: string
  emissiveIntensity?: number
  opacity?: number
}

const Ornaments: React.FC<Props> = ({
  type,
  count,
  color = '#FFD700',
  scale = 1,
  metalness,
  roughness,
  emissive,
  emissiveIntensity,
  opacity,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const mode = useGameStore(s => s.mode)
  
  const weight = type === 'GIFT' ? 0.05 : type === 'BAUBLE' ? 0.08 : 0.12
  
  const data = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const tPos = getConePosition(i, count, 6.8, 15, {
        layers: 14,
        layerGap: 0.12,
        jitter: 0.25,
      })
      const chaosRadius = 20 + pseudoRandom(i * 1.87 + 2) * 15
      const cPos = getSpherePosition(chaosRadius, i * 2.33)
      
      temp.push({
        target: tPos,
        chaos: cPos,
        current: tPos.clone(),
        scale: scale * (0.8 + pseudoRandom(i * 3.12 + 5) * 0.4), 
        rotation: new THREE.Euler(
          pseudoRandom(i * 4.91 + 8) * Math.PI,
          pseudoRandom(i * 5.37 + 11) * Math.PI,
          0
        )
      })
    }
    return temp
  }, [count, scale])

  const dummy = new THREE.Object3D()

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const isChaos = mode === 'CHAOS'
    
    data.forEach((item, i) => {
      const dest = isChaos ? item.chaos : item.target
      
      const targetVec = dest.clone()
      if (isChaos) {
        targetVec.add(new THREE.Vector3(
          Math.sin(state.clock.elapsedTime + i) * 0.5,
          Math.cos(state.clock.elapsedTime * 0.8 + i) * 0.5,
          0
        ))
      }

      item.current.lerp(targetVec, weight)
      
      // NaN 安全检查
      if (isNaN(item.current.x) || isNaN(item.current.y) || isNaN(item.current.z)) {
          item.current.copy(item.target)
      }

      dummy.position.copy(item.current)
      dummy.scale.setScalar(item.scale)
      dummy.rotation.copy(item.rotation)
      
      if (isChaos) {
        dummy.rotation.x += delta * 0.5
        dummy.rotation.y += delta * 0.5
      }
      
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const geometry = useMemo(() => {
    if (type === 'GIFT') return new THREE.BoxGeometry(1, 1, 1)
    return new THREE.SphereGeometry(0.5, 16, 16)
  }, [type])

  const matMetalness = metalness ?? (type === 'LIGHT' ? 0 : 0.8)
  const matRoughness = roughness ?? 0.2
  const matEmissive = emissive ?? (type === 'LIGHT' ? color : '#000000')
  const matEmissiveIntensity = emissiveIntensity ?? (type === 'LIGHT' ? 2 : 0)
  const matOpacity = opacity ?? 1

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial 
        color={color} 
        roughness={matRoughness} 
        metalness={matMetalness}
        emissive={matEmissive}
        emissiveIntensity={matEmissiveIntensity}
        transparent={matOpacity < 1}
        opacity={matOpacity}
      />
    </instancedMesh>
  )
}

export default Ornaments
