import React, { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import MouseController from './components/MouseController'
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
          <MouseController />
        </Suspense>
      </Canvas>
      
      <Loader />
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-8 text-gold pointer-events-none font-serif z-10">
        <h1 className="text-5xl font-bold mb-2 text-[#FFD700] drop-shadow-lg">GRAND LUXURY TREE</h1>
        <p className="text-xl text-[#aaddbb] max-w-md">
          <span className="text-white font-bold">CLICK & HOLD</span> to unleash chaos.
          <br />
          <span className="text-white font-bold">RELEASE</span> to form the tree.
          <br />
          Move mouse to rotate view.
        </p>
      </div>
      
      <div className="absolute bottom-8 left-8 text-xs text-gray-500 z-10">
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
