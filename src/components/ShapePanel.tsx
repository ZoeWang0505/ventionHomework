import React from 'react'

import '../styles/shape_panel.css'
import { useController } from '../3d/MainViewController'
import Button from './ShapeButton'

export const ShapePanel: React.FC = () => {
  const {createShape} = useController() 
  return (
    <div>
      <Button label='add sphere' onClick={() => createShape('sphere')} />
      <Button label='add cube' onClick={() => createShape('cube')} />
      <Button
        label='add cylinder'
        onClick={() => createShape('cylinder')}
      />
      
    </div>
  )
}
