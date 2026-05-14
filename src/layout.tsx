// AppLayout.tsx
import { Toolbar } from './components/toolbar'
import SceneCanvas from './components/SceneCanvas'
import { ShapeList } from './components/ShapeTree'
import { ShapePanel } from './components/ShapePanel'
import CountComponent from './components/CountComponent'
import './styles/app.css'

export function AppLayout() {
  return (
    <div className="app-root">
      <nav className="top-toolbar">
        <Toolbar />
      </nav>

      <div className="main-container">
        <aside id="shape-panel" className="left-bar">
          <ShapePanel />
        </aside>

        <main id="main-view" className="center-area">
          <SceneCanvas />
        </main>

        <aside id="shape-properties" className="right-bar">
          <CountComponent />
          <ShapeList />
        </aside>
      </div>
    </div>
  )
}
