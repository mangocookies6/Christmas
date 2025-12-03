import { create } from 'zustand'
import * as THREE from 'three'

interface GameState {
  mode: 'CHAOS' | 'FORMED'
  chaosFactor: number // 0 (FORMED) to 1 (CHAOS)
  cameraTarget: THREE.Vector2 // Normalized -1 to 1 based on hand position
  pointer: THREE.Vector2
  photos: string[]
  setMode: (mode: 'CHAOS' | 'FORMED') => void
  setCameraTarget: (x: number, y: number) => void
  setPointer: (x: number, y: number) => void
  addPhoto: (url: string) => void
}

const defaultPhotos = [
  '/photos/1.jpg',
  '/photos/2.jpg',
  '/photos/3.jpg',
  '/photos/4.jpg',
  '/photos/5.jpg',
  '/photos/6.jpg',
  '/photos/7.jpg',
]

export const useGameStore = create<GameState>((set) => ({
  mode: 'FORMED',
  chaosFactor: 0,
  cameraTarget: new THREE.Vector2(0, 0),
  pointer: new THREE.Vector2(0, 0),
  photos: defaultPhotos,
  setMode: (mode) => set({ mode }),
  setCameraTarget: (x, y) => set({ cameraTarget: new THREE.Vector2(x, y) }),
  setPointer: (x, y) => set({ pointer: new THREE.Vector2(x, y) }),
  addPhoto: (url) => set((state) => ({ photos: [...state.photos, url] })),
}))
