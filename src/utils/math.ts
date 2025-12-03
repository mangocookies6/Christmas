import * as THREE from 'three'

export const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface ConeOptions {
  layers?: number
  layerGap?: number // 单层之间的空隙（0-1之间的比例）
  jitter?: number
}

// 生成圆锥形状的坐标 (Target)
export const getConePosition = (
  index: number,
  total: number,
  radius: number,
  height: number,
  options: ConeOptions = {}
) => {
  // 黄金角度螺旋
  const phi = Math.PI * (3 - Math.sqrt(5))

  const normalized = index / Math.max(total - 1, 1)
  let yNormalized = normalized

  // 分层处理：让树看上去更加层次分明
  if (options.layers && options.layers > 1) {
    const layers = options.layers
    const perLayer = 1 / layers
    const layerGap = (options.layerGap ?? 0.08) * perLayer // 在每层内保留一定空隙

    const layerIndex = Math.min(layers - 1, Math.floor(yNormalized * layers))
    const layerStart = layerIndex * perLayer
    const layerLocal = (yNormalized - layerStart) / perLayer

    yNormalized = THREE.MathUtils.clamp(layerStart + layerLocal * (perLayer - layerGap), 0, 1)
  }

  const yMapped = yNormalized * height // 0 to height
  
  // 圆锥半径随高度变化 (底部宽，顶部尖)
  const currentRadius = radius * (1 - (yMapped / height))
  
  const theta = phi * index
  
  const x = Math.cos(theta) * currentRadius
  const z = Math.sin(theta) * currentRadius
  
  // 稍微加上一点随机抖动，让树看起来更自然
  const jitter = options.jitter ?? 0.2
  const randX = pseudoRandom(index * 1.23 + 0.1)
  const randZ = pseudoRandom(index * 1.57 + 0.7)

  return new THREE.Vector3(
    x + (randX - 0.5) * jitter, 
    yMapped - height / 2, // Center vertically
    z + (randZ - 0.5) * jitter
  )
}

// 生成球体/混沌空间的坐标 (Chaos)
export const getSpherePosition = (radius: number, seed?: number) => {
  const u = seed !== undefined ? pseudoRandom(seed) : Math.random()
  const v = seed !== undefined ? pseudoRandom(seed + 1) : Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta)
  const z = radius * Math.cos(phi)
  
  return new THREE.Vector3(x, y, z)
}

