import { createRoot } from 'react-dom/client'
import { ControllerProvider } from './src/3d/MainViewController'
import { NotificationProvider } from './src/3d/notification'
import { AppLayout } from './src/layout'

function initializeApp() {
  const reactCanvasRoot = document.getElementById('app-root')
  if (reactCanvasRoot) {
    createRoot(reactCanvasRoot).render(
      <NotificationProvider>
        <ControllerProvider>
          <AppLayout />
        </ControllerProvider>
      </NotificationProvider>
    )
  }
}

export const app = initializeApp()
