import React, { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

const MouseController: React.FC = () => {
  const setMode = useGameStore((state) => state.setMode)
  const setCameraTarget = useGameStore((state) => state.setCameraTarget)
  const setPointer = useGameStore((state) => state.setPointer)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 归一化坐标 -1 到 1
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      setCameraTarget(x * 2, y * 0.5)
      setPointer(x, y)
    }

    const handleMouseDown = () => {
        // 按住鼠标 = 炸开 (CHAOS)
        setMode('CHAOS')
    }

    const handleMouseUp = () => {
        // 松开 = 聚合 (FORMED)
        setMode('FORMED')
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setMode, setCameraTarget, setPointer])

  return null
}

export default MouseController

