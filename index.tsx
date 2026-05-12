import { createRoot } from 'react-dom/client'
import { createMainViewController } from './src/3d/MainViewController'
import CountComponent from './src/components/CountComponent'
import { createShapeList } from './src/components/ShapeTree'
import { createShapePanel } from './src/components/ShapePanel'
import { createLayout } from './src/layout'
import { createToolbar } from './src/toolbar'
import SceneCanvas from './src/components/SceneCanvas'

function initializeApp() {
  createLayout()
  const shapeController = createMainViewController()

  window.addEventListener('keydown', event => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      shapeController.deleteSelectedShape()
    }
  })

  createToolbar(shapeController)
  const reactToolbarRoot = document.getElementById('react-toolbar-root')
  if (reactToolbarRoot) {
    createRoot(reactToolbarRoot).render(<CountComponent />)
  }
  const reactCanvasRoot = document.getElementById('main-view')
  if (reactCanvasRoot) {
    createRoot(reactCanvasRoot).render(
      <SceneCanvas controller={shapeController} />
    )
  }

  createShapePanel(shapeController)
  createShapeList()

  return {}
}

export const app = initializeApp()
