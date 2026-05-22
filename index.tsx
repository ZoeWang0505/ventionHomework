import { createRoot } from 'react-dom/client'
import { ControllerProvider } from './src/3d/MainViewController'
import { NotificationProvider } from './src/notification'
import { ShapeStoreProvider } from './src/data/shapeStore'
import { AppLayout } from './src/layout'

function initializeApp() {
  const reactCanvasRoot = document.getElementById('app-root')
  if (reactCanvasRoot) {
    createRoot(reactCanvasRoot).render(
      <NotificationProvider>
        <ShapeStoreProvider>
          <ControllerProvider>
            <AppLayout />
          </ControllerProvider>
        </ShapeStoreProvider>
      </NotificationProvider>
    )
  }
}

export const app = initializeApp()
