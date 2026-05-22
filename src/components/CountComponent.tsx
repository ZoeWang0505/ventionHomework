import React, { useCallback, useEffect, useState } from 'react'
import { useShapeStore } from '../data/shapeStore'

const CountComponent: React.FC = () => {
  const [count, setCount] = useState(0)
  const shapeStore = useShapeStore()

  const refresh = useCallback(() => {
    shapeStore.getAllShapes().then(docs => setCount(docs.length)).catch(() => null)
  }, [shapeStore])

  useEffect(() => {
    refresh()
    shapeStore.subscribe('shapeAdded', refresh)
    shapeStore.subscribe('shapeRemoved', refresh)
    return () => {
      shapeStore.unsubscribe('shapeAdded', refresh)
      shapeStore.unsubscribe('shapeRemoved', refresh)
    }
  }, [shapeStore, refresh])

  return <h2>{count} objects</h2>
}

export default CountComponent
