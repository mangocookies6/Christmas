import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getConePosition, getSpherePosition, pseudoRandom } from '../utils/math'
import { useGameStore } from '../store/gameStore'

const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }, // 0 = Tree, 1 = Chaos
    uColor1: { value: new THREE.Color('#004225') }, // 深祖母绿
    uColor2: { value: new THREE.Color('#0a5c36') }, // 浅一点的绿
    uGold: { value: new THREE.Color('#FFD700') },    // 金色高光
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerRadius: { value: 2.2 },
    uPointerStrength: { value: 1.0 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    uniform vec2 uPointer;
    uniform float uPointerRadius;

    attribute vec3 aTargetPos;
    attribute vec3 aChaosPos;
    attribute float aRandom;
    
    varying vec2 vUv;
    varying float vRand;
    varying float vDepth;
    varying float vPointerFade;

    void main() {
      vUv = uv;
      vRand = aRandom;
      
      // 可以在这里添加一些基于噪声的漂浮动画
      vec3 chaos = aChaosPos + vec3(
        sin(uTime * aRandom + aTargetPos.x) * 0.5,
        cos(uTime * aRandom * 0.8 + aTargetPos.y) * 0.5,
        sin(uTime * 0.5 + aTargetPos.z) * 0.5
      );

      // 使用 smoothstep 进行安全的插值
      float t = smoothstep(0.0, 1.0, uProgress);
      vec3 basePos = mix(aTargetPos, chaos, t);

      // 鼠标指针影响范围，接近指针时逐渐透明
      float pointerDist = length(basePos.xy - uPointer.xy);
      float fade = smoothstep(uPointerRadius * 0.6, uPointerRadius, pointerDist);
      vPointerFade = fade;
      vec3 pos = basePos;
      
      // 粒子大小
      float size = 0.4;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // 安全的 PointSize 计算
      float zDist = max(-mvPosition.z, 0.1); 
      gl_PointSize = size * (300.0 / zDist);
      
      vDepth = -mvPosition.z;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uGold;
    varying float vRand;
    varying float vPointerFade;
    uniform float uPointerStrength;
    
    void main() {
      // 圆形粒子
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // 颜色混合
      vec3 color = mix(uColor1, uColor2, vRand);
      
      // 偶尔加入金色闪光点
      if (vRand > 0.95) {
        color = uGold;
      }
      
      float alpha = clamp(vPointerFade + (1.0 - uPointerStrength), 0.0, 1.0);
      gl_FragColor = vec4(color, alpha);
    }
  `
}

const Foliage: React.FC = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null)
  const count = 15000
  const mode = useGameStore(s => s.mode)
  const pointerRef = useRef(new THREE.Vector2())
  
  // 目标进度
  const targetProgress = useRef(0)
  const pointerWorld = useRef(new THREE.Vector2())

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      pointerRef.current.copy(state.pointer)
    })
    return () => unsub()
  }, [])

  const { positions, targetPositions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const targetPos = new Float32Array(count * 3)
    const rands = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Tree Shape
      const tPos = getConePosition(i, count, 6.5, 14.5, {
        layers: 14,
        layerGap: 0.12,
        jitter: 0.28,
      })
      targetPos[i * 3] = tPos.x
      targetPos[i * 3 + 1] = tPos.y
      targetPos[i * 3 + 2] = tPos.z

      // Chaos Shape
      const chaosRadius = 25 + pseudoRandom(i * 1.73 + 5) * 25
      const cPos = getSpherePosition(chaosRadius, i * 2.11)
      pos[i * 3] = cPos.x
      pos[i * 3 + 1] = cPos.y
      pos[i * 3 + 2] = cPos.z
      
      rands[i] = pseudoRandom(i * 3.17 + 1)
    }
    return { positions: pos, targetPositions: targetPos, randoms: rands }
  }, [])

  useFrame((state, delta) => {
    if (!shaderRef.current) return
    
    shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
    
    // 平滑过渡状态
    const target = mode === 'CHAOS' ? 1 : 0
    
    // 限制 delta 防止异常跳跃
    const dt = Math.min(delta, 0.1)
    
    let p = targetProgress.current
    p = THREE.MathUtils.lerp(p, target, dt * 2)
    
    // 强制 Clamp
    p = Math.max(0, Math.min(1, p))
    
    targetProgress.current = p
    shaderRef.current.uniforms.uProgress.value = p

    // 更新鼠标指针对应的世界坐标 (树平面)
    const pointer = pointerRef.current
    pointerWorld.current.set(pointer.x * 6, pointer.y * 7)
    shaderRef.current.uniforms.uPointer.value.copy(pointerWorld.current)
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          args={[targetPositions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          args={[randoms, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default Foliage
