import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import HandController from './components/HandController'
import { Loader } from '@react-three/drei'
import { useGameStore } from './store/gameStore'

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addPhoto = useGameStore(state => state.addPhoto)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    console.log('上传成功，临时 URL:', url)
    addPhoto(url)
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ antialias: false, toneMapping: 1 }} 
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      
      <HandController />
      <Loader />
      
      {/* UI Overlay */}
      <div className="absolute bottom-8 left-8 pointer-events-none font-serif z-10">
        <h1 className="text-3xl font-bold mb-3 text-[#FFD700] drop-shadow-lg">GRAND LUXURY TREE</h1>
        <div className="text-base text-[#aaddbb] max-w-md space-y-1 font-sans bg-black/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
          <p className="flex items-center gap-2">
            <span className="text-[#FFD700] font-bold">🖐 张开手掌</span> 
            <span>释放混乱</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-[#FFD700] font-bold">✊ 握紧拳头</span> 
            <span>聚合成树</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-white/80">↔️ 移动手部</span> 
            <span>旋转视角</span>
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-2 left-8 text-[10px] text-gray-600 z-10 opacity-50">
         Powered by React 19 & R3F
      </div>

      {/* Upload Button */}
      <div className="absolute bottom-8 right-8 z-20">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-[#FFD700] text-black font-bold rounded-full shadow-lg hover:bg-[#FFFACD] transition-all transform hover:scale-105 cursor-pointer"
        >
          + ADD PHOTO
        </button>
      </div>
    </div>
  )
}

export default App
