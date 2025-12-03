import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pseudoRandom } from '../utils/math'
import { useGameStore } from '../store/gameStore'

// 复用 Foliage 的配色方案，但改为纯金色系，且粒子更小
const AmbientShaderMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    // 纯金色系，不同深浅
    uColor1: { value: new THREE.Color('#FFD700') }, // 纯金
    uColor2: { value: new THREE.Color('#FFFACD') }, // 柠檬绸色（浅金）
    uGold: { value: new THREE.Color('#FFFFFF') },   // 高光白金
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerRadius: { value: 6.0 }, 
  },
  vertexShader: `
    uniform float uTime;
    uniform vec2 uPointer;
    uniform float uPointerRadius;
    
    attribute float aRandom;
    attribute float aSize;
    
    varying float vRand;
    varying float vPointerFade;

    void main() {
      vRand = aRandom;
      
      vec3 pos = position;
      
      // 简单的漂浮动画
      float t = uTime * 0.2;
      pos.x += sin(t + aRandom * 10.0) * 1.5;
      pos.y += cos(t * 0.8 + aRandom * 20.0) * 1.5;
      pos.z += sin(t * 0.6 + aRandom * 30.0) * 1.5;

      float dist = length(pos.xy - uPointer);
      
      vPointerFade = smoothstep(uPointerRadius * 0.3, uPointerRadius, dist);

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      float zDist = max(-mvPosition.z, 0.1);
      // 减小粒子基础尺寸倍率 (原为 300.0 -> 150.0)
      gl_PointSize = aSize * (150.0 / zDist);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uGold;
    
    varying float vRand;
    varying float vPointerFade;

    void main() {
      vec2 center = gl_PointCoord - 0.5;
      if (length(center) > 0.5) discard;
      
      vec3 color = mix(uColor1, uColor2, vRand);
      
      if (vRand > 0.95) color = uGold;
      
      float alpha = 0.6 * vPointerFade;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
})

const generateBackgroundParticles = (count: number) => {
  const positions = new Float32Array(count * 3)
  const randoms = new Float32Array(count)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const x = (pseudoRandom(i * 1.1) - 0.5) * 80
    const y = (pseudoRandom(i * 2.2 + 1) - 0.5) * 60
    const z = (pseudoRandom(i * 3.3 + 2) - 0.5) * 60 + 10 

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    
    randoms[i] = pseudoRandom(i * 4.4 + 3)
    // 减小随机尺寸范围 (原为 0.5~2.0 -> 0.3~1.2)
    sizes[i] = 0.3 + pseudoRandom(i * 5.5 + 4) * 0.9 
  }
  
  return { positions, randoms, sizes }
}

const AuraParticles: React.FC = () => {
  const pointerRef = useRef(new THREE.Vector2())
  const pointerWorld = useRef(new THREE.Vector2())
  
  const count = 4000
  const { positions, randoms, sizes } = useMemo(() => generateBackgroundParticles(count), [])

  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => state.pointer,
      (pointer) => {
        pointerRef.current.copy(pointer)
      }
    )
    return () => unsub()
  }, [])

  useFrame((state) => {
    AmbientShaderMaterial.uniforms.uTime.value = state.clock.elapsedTime
    
    const pointer = pointerRef.current
    pointerWorld.current.set(pointer.x * 15, pointer.y * 15)
    AmbientShaderMaterial.uniforms.uPointer.value.copy(pointerWorld.current)
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={AmbientShaderMaterial} attach="material" />
    </points>
  )
}

export default AuraParticles
