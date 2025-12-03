import React, { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { getConePosition, getSpherePosition, pseudoRandom } from '../utils/math'
import { useGameStore } from '../store/gameStore'

// 自定义材质组件，确保纹理加载安全
const SafeImageMesh: React.FC<{ url: string }> = ({ url }) => {
  const texture = useLoader(THREE.TextureLoader, url)
  
  return (
    <mesh position={[0, 0.15, 0.01]} scale={[1, 1, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  )
}

// 单张拍立得组件
const PolaroidItem: React.FC<{
  url: string
  featured: boolean
  positionData: { target: THREE.Vector3, chaos: THREE.Vector3, rotationZ: number }
}> = ({ url, featured, positionData }) => {
  const groupRef = useRef<THREE.Group>(null)
  const mode = useGameStore(s => s.mode)
  
  const currentPos = useRef(positionData.target.clone())
  
  useFrame(() => {
    if (!groupRef.current) return
    
    const isChaos = mode === 'CHAOS'
    const dest = featured ? positionData.target : isChaos ? positionData.chaos : positionData.target
    
    currentPos.current.lerp(dest, featured ? 0.2 : 0.05)
    
    if (isNaN(currentPos.current.x)) currentPos.current.copy(positionData.target)

    groupRef.current.position.copy(currentPos.current)
    groupRef.current.rotation.set(0, 0, featured ? 0 : positionData.rotationZ)
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.2, 1.5]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      <React.Suspense fallback={<mesh><planeGeometry /><meshBasicMaterial color="gray" /></mesh>}>
         <SafeImageMesh url={url} />
      </React.Suspense>
    </group>
  )
}

const Polaroids: React.FC = () => {
  // 从 store 获取图片列表
  const urls = useGameStore(state => state.photos)
  console.log('当前照片列表', urls)
  
  const count = urls.length

  const data = useMemo(() => {
    return urls.map((url, i) => {
      const tPos = getConePosition(i, count, 8.5, 13.5, {
        layers: 12,
        layerGap: 0.15,
        jitter: 0.3,
      })

      const cPos = getSpherePosition(24, i * 1.91 + 4)

      // 新上传的照片（数组最后一个）固定在树前方，确保显眼
      const isFeatured = url.startsWith('blob:') && i === count - 1
      if (isFeatured) {
        tPos.set(0, 3.5, 2.5)
        cPos.set(0, 3.5, 2.5)
      }

      return {
        target: tPos,
        chaos: cPos,
        rotationZ: (pseudoRandom(i * 2.73 + 7) - 0.5) * 0.5,
        featured: isFeatured,
      }
    })
  }, [urls, count])

  return (
    <group>
      {urls.map((url, i) => (
        <PolaroidItem 
          key={`${url}-${i}`} 
          url={url} 
          featured={data[i].featured}
          positionData={data[i]} 
        />
      ))}
    </group>
  )
}

export default Polaroids
