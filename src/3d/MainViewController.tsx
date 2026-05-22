import * as THREE from 'three'
import ThreeEngineController from './engine'
import { RayCastService } from './raycaster'
import { buildShape, type Info, type Shape } from './buildShape'
import { disposeObject } from './objectUtil'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNotification } from '../notification'

declare global {
  interface Window {
    mainViewAPI?: {
      createShape: (shape: Shape) => void
      selectShape: (point: [number, number]) => void
      deleteSelectedShape: () => void
    }
  }
}

export interface ControllerContextValue {
  selectedShape: THREE.Mesh | null,
  view: ThreeEngineController,
  createShape: (shape: Shape) => void
  selectShape: (point: [number, number]) => void
  deleteSelectedShape: () => void
}

const ControllerContext = createContext<ControllerContextValue | null>(null)

export function ControllerProvider({ children }: { children: React.ReactNode }) {
  const {notify, subscribe, unsubscribe} = useNotification();
  const [view] = useState(ThreeEngineController.getInstance())
  const [raycaster] = useState(new RayCastService())

  const [selectedShape, setSelectedShape] = useState<THREE.Mesh|null>(null);
  const [highlightedColor] = useState(0xffff00)
  

  function randomPosition() {
    return new THREE.Vector3(
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
      Math.random() * 10 - 5
    )
  }

  /**
   * highlight or unhighlight an object
   * @param obj 
   * @param highlight boolean, true to highlight, false to unhighlight
   */
  const highlightObject = useCallback((obj: THREE.Object3D, highlight: boolean) => {
    obj.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const info = node.userData as Info
        info.isSelected = highlight

        if (highlight) {
          node.material.color.set(highlightedColor);
        } else {
          if (info.color) {
            node.material.color.set(info.color);
          }
        }
      }
    });
  }, [highlightedColor])

  const createShape = useCallback(
    (shape: Shape) => {
      const newMesh = buildShape(shape)

      if (newMesh) {
        newMesh.position.copy(randomPosition())

        if (selectedShape) {
          selectedShape.add(newMesh)
        } else {
          view.addToScene(newMesh)
        }
        notify('shapeAdded', view.getObjectsInScene())
      }
    }, [notify, view, selectedShape])

   const selectShape = useCallback((point: [number, number]) => {
      raycaster.update(point, view.getCamera())

      const objects = view.getObjectsInScene()
      const selectedObjects = raycaster.getIntersections(objects)
      if (!selectedObjects.length) {
        notify('shapeSelected', null)
        return
      }

      const firstObject = selectedObjects[0].object
      notify('shapeSelected', firstObject)
    },
    [notify, raycaster, view]
  )

  const deleteSelectedShape = useCallback(() => {
      if (selectedShape) {
        disposeObject(selectedShape)
        selectedShape.parent?.remove(selectedShape)
        setSelectedShape(null)
        notify('shapeRemoved', view.getObjectsInScene())
        notify('shapeSelected', null)
      }
    }, [selectedShape, notify, view])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedShape()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [deleteSelectedShape])

  useEffect(() => {
    const handleShapeSelected = (mesh: THREE.Mesh | null) => {
      const objects = view.getObjectsInScene()
      // Unhighlight all objects with a single traversal
      objects.forEach(obj => {
        if (obj instanceof THREE.Mesh) {
          highlightObject(obj, false)
        }
      })

      if (mesh === null) {
        setSelectedShape(null)
        return
      }
      
      mesh.userData.isSelected = true
      highlightObject(mesh, true)
      setSelectedShape(mesh)
    }

    subscribe<THREE.Mesh | null>('shapeSelected', handleShapeSelected)
    
    return () => {
      // Cleanup: unsubscribe when component unmounts
      unsubscribe('shapeSelected', handleShapeSelected)
    }
  }, [view, subscribe, unsubscribe, highlightObject])

  useEffect(() => {
    // Expose API to window so jQuery code can call it
    window.mainViewAPI = {
      createShape,
      selectShape,
      deleteSelectedShape,
    }
  }, [createShape, selectShape, deleteSelectedShape])



  return (
    <ControllerContext.Provider
      value={{
        selectedShape,
        view,
        createShape,
        selectShape,
        deleteSelectedShape,
      }}
    >
      {children}
    </ControllerContext.Provider>
  )
}

export function useController() {
  const ctx = useContext(ControllerContext)
  if (!ctx) {
    throw new Error('useMainView must be used inside <ControllerProvider>')
  }
  return ctx
}
