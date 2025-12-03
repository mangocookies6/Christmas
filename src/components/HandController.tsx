import React, { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import * as handpose from '@tensorflow-models/handpose'
import { useGameStore } from '../store/gameStore'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

const HandController: React.FC = () => {
  const webcamRef = useRef<Webcam>(null)
  const [model, setModel] = useState<handpose.HandPose | null>(null)
  const setMode = useGameStore((state) => state.setMode)
  const setCameraTarget = useGameStore((state) => state.setCameraTarget)
  
  // 初始化模型
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready()
        const loadedModel = await handpose.load()
        setModel(loadedModel)
        console.log('Handpose model loaded')
      } catch (e) {
        console.error('Failed to load handpose', e)
      }
    }
    loadModel()
  }, [])

  // 检测循环
  useFrame(async ({ clock }) => {
    // 限制检测频率
    if (!model || !webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4) return
    if (clock.elapsedTime % 0.2 > 0.05) return 

    const video = webcamRef.current.video
    try {
        const predictions = await model.estimateHands(video)

        if (predictions.length > 0) {
        const hand = predictions[0]
        const landmarks = hand.landmarks as number[][]

        // 手指张开检测算法 (Comparison of Tip-Palm vs Knuckle-Palm distance)
        const palm = landmarks[0]
        const knuckles = [5, 9, 13, 17]
        const tips = [8, 12, 16, 20]

        const getDist = (idx: number) => {
            const p = landmarks[idx]
            return Math.sqrt(Math.pow(p[0]-palm[0],2) + Math.pow(p[1]-palm[1],2) + Math.pow(p[2]-palm[2],2))
        }

        let avgKnuckleDist = 0
        let avgTipDist = 0
        knuckles.forEach(i => avgKnuckleDist += getDist(i))
        tips.forEach(i => avgTipDist += getDist(i))
        avgKnuckleDist /= 4
        avgTipDist /= 4

        const ratio = avgTipDist / (avgKnuckleDist + 0.01) // prevent div by 0
        
        // 阈值调整
        if (ratio > 1.5) {
            setMode('CHAOS') // Open hand
        } else if (ratio < 1.2) {
            setMode('FORMED') // Fist
        }

        // 2. 视角控制
        const handX = landmarks[0][0]
        const handY = landmarks[0][1]
        
        // Video is 640x480
        const normalizedX = (handX / 640) * 2 - 1
        const normalizedY = -(handY / 480) * 2 + 1 
        
        setCameraTarget(normalizedX * 2, normalizedY * 0.5) 
        }
    } catch {
        // ignore frame errors
    }
  })

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="fixed top-4 right-4 w-48 h-36 z-50 opacity-60 border-2 border-[#FFD700] rounded overflow-hidden pointer-events-none bg-black">
        <Webcam
          ref={webcamRef}
          className="w-full h-full object-cover transform scale-x-[-1]"
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
        />
      </div>
    </Html>
  )
}

export default HandController

