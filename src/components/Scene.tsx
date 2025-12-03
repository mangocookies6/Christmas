import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, PerspectiveCamera, Float, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Foliage from './Foliage'
import Ornaments from './Ornaments'
import Polaroids from './Polaroids'
import { useGameStore } from '../store/gameStore'
import BowOrnaments from './BowOrnaments'
import AuraParticles from './AuraParticles'

const Scene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null)
  const targetXY = useGameStore(s => s.cameraTarget)
  
  // 摄像机平滑跟随手势
  useFrame((state, delta) => {
    if (groupRef.current) {
      // 目标旋转角度 (基于手势位置)
      const targetRotX = targetXY.y * 0.5 // 上下看
      const targetRotY = targetXY.x * 0.5 // 左右看
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 2)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 2)
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 35]} fov={50} />
      
      <Environment preset="lobby" background={false} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={200} castShadow color="#fffaed" />
      <pointLight position={[-10, -10, -10]} intensity={50} color="#004225" />
      {/* 环绕的小型暖光 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <pointLight
          key={i}
          position={[
            Math.sin((i / 5) * Math.PI * 2) * 8,
            2 + i,
            Math.cos((i / 5) * Math.PI * 2) * 8,
          ]}
          intensity={35}
          color="#FFEFB0"
        />
      ))}

      <group ref={groupRef}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            {/* 树干核心优化：替换单调的圆柱体 */}
            <group>
                {/* 1. 内部高亮能量柱 (Soul) */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.6, 13, 16]} />
                    <meshStandardMaterial 
                        color="#FFD700" 
                        emissive="#FF9900" 
                        emissiveIntensity={3} 
                        toneMapped={false} 
                        transparent
                        opacity={0.8}
                    />
                </mesh>

                {/* 2. 内部深邃暗核 (Depth) */}
                <mesh position={[0, 0, 0]}>
                    <coneGeometry args={[2.5, 14, 32]} />
                    <meshStandardMaterial 
                        color="#001105"
                        roughness={0.9}
                        metalness={0.1}
                    />
                </mesh>

                {/* 3. 外部幽灵光雾 (Volume) */}
                <mesh position={[0, -0.5, 0]}>
                    <coneGeometry args={[3.8, 14.5, 32, 1, true]} />
                    <meshBasicMaterial 
                        color="#004225" 
                        transparent 
                        opacity={0.08} 
                        side={THREE.DoubleSide} 
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            </group>

            <Foliage />
            <AuraParticles />
            
            {/* 装饰物 - 密度翻倍 */}
            {/* 礼物盒: 总数约 160 (原 95) */}
            <Ornaments type="GIFT" count={70} color="#8B0000" scale={0.8} /> {/* 红色礼物 */}
            <Ornaments type="GIFT" count={50} color="#FFD700" scale={0.75} /> {/* 金色礼物 */}
            <Ornaments type="GIFT" count={40} color="#0D8F5A" scale={0.7} /> {/* 祖母绿盒 */}

            {/* 球: 总数约 400 (原 270) */}
            <Ornaments type="BAUBLE" count={150} color="#C0C0C0" scale={0.5} /> {/* 银球 */}
            <Ornaments type="BAUBLE" count={150} color="#FF0000" scale={0.5} /> {/* 红球 */}
            <Ornaments
              type="BAUBLE"
              count={100}
              color="#5BC7FF"
              scale={0.55}
              metalness={0.65}
              roughness={0.25}
              opacity={0.85}
            /> {/* 蓝色金属玻璃球 */}

            {/* 灯光: 原 250 -> 400 */}
            <Ornaments type="LIGHT" count={400} color="#FFD700" scale={0.12} /> {/* 金色灯光 */}
            
            {/* 蝴蝶结: 原 36 -> 60 */}
            <BowOrnaments count={60} color="#FF9FD6" scale={0.8} /> 
            
            <Polaroids />

            {/* 树顶星芒 */}
            <group position={[0, 8.2, 0]}>
              <mesh>
                <octahedronGeometry args={[1.1, 0]} />
                <meshStandardMaterial
                  color="#FFE4A3"
                  emissive="#FFF7D1"
                  emissiveIntensity={4}
                  metalness={0.3}
                  roughness={0.2}
                />
              </mesh>
              <pointLight intensity={180} color="#FFF7B0" distance={15} />
            </group>

            {/* 星空闪烁 */}
            <Sparkles count={120} speed={0.4} opacity={0.7} color="#FFECC8" size={6} scale={[10, 14, 10]} />
        </Float>
      </group>

      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={0.9} 
            radius={0.45}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  )
}

export default Scene
