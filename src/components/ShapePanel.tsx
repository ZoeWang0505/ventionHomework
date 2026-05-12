import React from 'react'
import { createRoot } from 'react-dom/client'
import '../../styles/shape_panel.css'
import { type MainViewController } from '../3d/MainViewController'
import Button from './ShapeButton'

const ShapePanel: React.FC<{ controller: MainViewController }> = ({
  controller
}) => {
  return (
    <div>
      <Button label='add sphere' onClick={() => controller.createShape('sphere')} />
      <Button label='add cube' onClick={() => controller.createShape('cube')} />
      <Button
        label='add cylinder'
        onClick={() => controller.createShape('cylinder')}
      />
      
    </div>
  )
}

export function createShapePanel(controller: MainViewController) {
  const panelRoot = document.getElementById('shape-panel')
  if (panelRoot) {
    createRoot(panelRoot).render(<ShapePanel controller={controller} />)
  }
}
