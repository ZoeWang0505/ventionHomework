import React, { useState } from 'react'
import { getNotificationCenter } from '../notification'
import ThreeEngineController from '../3d/engine'

const CountComponent: React.FC = () => {
  const [count, setCount] = useState(0)

  getNotificationCenter().subscribe('shapeAdded', () => {
    setCount(ThreeEngineController.getInstance().getObjectCount())
  })
  getNotificationCenter().subscribe('shapeRemoved', () => {
    setCount(ThreeEngineController.getInstance().getObjectCount())
  })
  return <h2>{count} objects</h2>
}

export default CountComponent
