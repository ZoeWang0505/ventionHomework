import React, { useState } from 'react'
import ThreeEngineController from '../3d/engine'
import { useNotification } from '../notification'

const CountComponent: React.FC = () => {
  const [count, setCount] = useState(0)
 const {subscribe} = useNotification()
  subscribe('shapeAdded', () => {
    setCount(ThreeEngineController.getInstance().getObjectCount())
  })
  subscribe('shapeRemoved', () => {
    setCount(ThreeEngineController.getInstance().getObjectCount())
  })
  return <h2>{count} objects</h2>
}

export default CountComponent
