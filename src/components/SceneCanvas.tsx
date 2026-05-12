import { useEffect, useLayoutEffect, useRef } from 'react'
import styles from './SceneCanvas.module.css'
import ThreeEngineController from '../3d/engine'
import type { MainViewController } from '../3d/MainViewController'

export default function SceneCanvas({
  controller
}: {
  controller: MainViewController
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const engine = ThreeEngineController.getInstance()

    const renderLoop = () => {
      engine.render()
      requestAnimationFrame(renderLoop)
    }
    renderLoop()
  }, [])

  useLayoutEffect(() => {
    const engine = ThreeEngineController.getInstance()
    const handleResize = () => {
      if (!canvasRef.current) return
      engine.updateSize(canvasRef.current)
    }

    if (canvasRef.current) {
      engine.install(canvasRef.current)
      window.addEventListener('resize', handleResize)
    }

    return () => {
      ThreeEngineController.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, [canvasRef])

  return (
    <canvas
      data-testid='scene-canvas'
      className={styles.threeCanvas}
      ref={canvasRef}
      onClick={event => {
        const engine = ThreeEngineController.getInstance()
        const point = engine.clientToNdc(event)
        controller.selectShape(point)
      }}
    />
  )
}
