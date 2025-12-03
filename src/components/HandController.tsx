import React, { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import * as handpose from '@tensorflow-models/handpose'
import { useGameStore } from '../store/gameStore'

const HandController: React.FC = () => {
  const webcamRef = useRef<Webcam>(null)
  const [model, setModel] = useState<handpose.HandPose | null>(null)
  const setMode = useGameStore((state) => state.setMode)
  const setCameraTarget = useGameStore((state) => state.setCameraTarget)
  const [status, setStatus] = useState<string>('Loading...')
  
  // 初始化模型
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready()
        const loadedModel = await handpose.load()
        setModel(loadedModel)
        console.log('Handpose model loaded')
        setStatus('Ready')
      } catch (e) {
        console.error('Failed to load handpose', e)
        setStatus('Error')
      }
    }
    loadModel()
  }, [])

  // 检测循环 (使用 requestAnimationFrame 替代 useFrame)
  useEffect(() => {
    let animationFrameId: number
    let lastRun = 0

    const detect = async (now: number) => {
      // 限制频率 (每 100ms 检测一次，即 10fps)
      if (now - lastRun < 100) {
        animationFrameId = requestAnimationFrame(detect)
        return
      }
      lastRun = now

      if (model && webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video
        try {
            const predictions = await model.estimateHands(video)
    
            if (predictions.length > 0) {
              const hand = predictions[0]
              const landmarks = hand.landmarks as number[][]
    
              // 1. 更精准的手势识别算法 (Check Extension of each finger)
              // Fingers: Index(8), Middle(12), Ring(16), Pinky(20)
              // Knuckles: Index(5), Middle(9), Ring(13), Pinky(17)
              // Wrist: 0
              const wrist = landmarks[0]
              
              const isFingerExtended = (tipIdx: number, knuckleIdx: number) => {
                const tip = landmarks[tipIdx]
                const knuckle = landmarks[knuckleIdx]
                
                const tipDist = Math.hypot(tip[0]-wrist[0], tip[1]-wrist[1], tip[2]-wrist[2])
                const knuckleDist = Math.hypot(knuckle[0]-wrist[0], knuckle[1]-wrist[1], knuckle[2]-wrist[2])
                
                return tipDist > knuckleDist + 20 // 20 is a safe buffer
              }
    
              const extendedCount = [
                isFingerExtended(8, 5),   // Index
                isFingerExtended(12, 9),  // Middle
                isFingerExtended(16, 13), // Ring
                isFingerExtended(20, 17)  // Pinky
              ].filter(Boolean).length
    
              // Thumb check (special case)
              const thumbTip = landmarks[4]
              const thumbIp = landmarks[3]
              const isThumbExtended = Math.hypot(thumbTip[0]-wrist[0], thumbTip[1]-wrist[1]) > Math.hypot(thumbIp[0]-wrist[0], thumbIp[1]-wrist[1])
              
              const totalExtended = extendedCount + (isThumbExtended ? 1 : 0)
    
              if (totalExtended >= 4) {
                 setMode('CHAOS')
                 setStatus('Open Hand (Chaos)')
              } else if (totalExtended <= 1) {
                 setMode('FORMED')
                 setStatus('Fist (Formed)')
              } else {
                 setStatus('Tracking...')
              }
    
              // 2. 视角控制 - 平滑 & 死区 (Deadzone)
              const handX = landmarks[0][0]
              const handY = landmarks[0][1]
              
              // Video is 640x480. Normalized: -1 to 1
              let normalizedX = (handX / 640) * 2 - 1
              let normalizedY = -(handY / 480) * 2 + 1 
    
              // 增加死区，防止抖动
              if (Math.abs(normalizedX) < 0.15) normalizedX = 0
              if (Math.abs(normalizedY) < 0.15) normalizedY = 0
    
              // 平滑映射：加大 X 轴旋转范围，使旋转更明显
              // 使用指数平滑或直接映射
              const sensitivityX = 3.5 
              const sensitivityY = 0.8
    
              setCameraTarget(normalizedX * sensitivityX, normalizedY * sensitivityY) 
            } else {
              setStatus('No Hand Detected')
            }
        } catch {
            // ignore frame errors
        }
      }
      
      animationFrameId = requestAnimationFrame(detect)
    }

    detect(performance.now())

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [model, setMode, setCameraTarget])

  return (
    <div className="absolute top-4 left-4 flex flex-col items-start z-50 pointer-events-none">
      <div className="w-48 h-36 opacity-80 border-2 border-[#FFD700] rounded overflow-hidden bg-black shadow-[0_0_15px_rgba(255,215,0,0.3)]">
        <Webcam
          ref={webcamRef}
          className="w-full h-full object-cover transform scale-x-[-1]"
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
        />
      </div>
      <div className="mt-2 px-3 py-1 bg-black/80 text-[#FFD700] text-sm font-mono rounded border border-[#FFD700]/30 backdrop-blur-sm">
        {status}
      </div>
    </div>
  )
}

export default HandController
