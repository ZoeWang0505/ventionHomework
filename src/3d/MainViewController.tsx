import * as THREE from 'three'
import ThreeEngineController from './engine'
import { RayCastService } from './raycaster'
import { buildShape, type RenderInfo, type Shape } from './buildShape'
import { disposeObject, findMeshByInfoId } from './objectUtil'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNotification } from '../notification'
import { useShapeStore, type ShapeDoc } from '../data/shapeStore'

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
  const shapeStore = useShapeStore()
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
        const info = node.userData as RenderInfo
        info.isSelected = highlight

        if (highlight) {
          node.material.color.set(highlightedColor)
        } else {
          node.material.color.set(info.renderColor)
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

        const material = newMesh.material as THREE.MeshBasicMaterial
        const parentId =
          selectedShape && typeof selectedShape.userData?.infoId === 'string'
            ? selectedShape.userData.infoId
            : null

        ;(async () => {
          const doc = await shapeStore.addShape({
            type: 'shape',
            meshType: shape,
            color: material.color.getHex(),
            position: {
              x: newMesh.position.x,
              y: newMesh.position.y,
              z: newMesh.position.z,
            },
            isSelected: false,
            parentId,
          })
          // attach a reference to the persisted doc
          newMesh.userData.infoId = doc._id
        })()
      }
    }, [view, selectedShape, shapeStore])

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
        // remove persisted UI doc if present
        const infoId =
          typeof selectedShape.userData?.infoId === 'string'
            ? selectedShape.userData.infoId
            : undefined
        if (infoId) {
          shapeStore.removeShape(infoId).catch(() => null)
        }
        disposeObject(selectedShape)
        selectedShape.parent?.remove(selectedShape)
        setSelectedShape(null)
      }
    }, [selectedShape, view, shapeStore])

  // React to selection state changes from the store (the single source of truth
  // for which doc is selected). The store fires `shapeUpdated` whenever a doc's
  // `isSelected` toggles; we mirror that into mesh highlight + local mesh ref.
  useEffect(() => {
    const handleUpdated = (doc: ShapeDoc) => {
      if (!doc._id) return
      const mesh = findMeshByInfoId(doc._id)
      if (!mesh) return
      if (doc.isSelected) {
        highlightObject(mesh, true)
        setSelectedShape(mesh)
      } else {
        highlightObject(mesh, false)
        setSelectedShape(prev => (prev === mesh ? null : prev))
      }
    }

    shapeStore.subscribe('shapeUpdated', handleUpdated)
    return () => shapeStore.unsubscribe('shapeUpdated', handleUpdated)
  }, [shapeStore, findMeshByInfoId, highlightObject])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedShape()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [deleteSelectedShape])

  // UI click bus → DB write. The store's `shapeUpdated` event then drives
  // highlight + local mesh ref via the effect above. Unidirectional flow:
  // user intent (NotificationProvider) → mutate store → state event → render.
  useEffect(() => {
    const handleShapeSelected = (mesh: THREE.Mesh | null) => {
      if (mesh === null) {
        void shapeStore.selectShape(null)
        return
      }
      const infoId =
        typeof mesh.userData?.infoId === 'string'
          ? mesh.userData.infoId
          : undefined
      // A freshly created mesh may not yet have an infoId (persisted async);
      // such a click can't be routed through the store, so it's dropped.
      if (!infoId) return
      void shapeStore.selectShape(infoId)
    }

    subscribe<THREE.Mesh | null>('shapeSelected', handleShapeSelected)
    return () => unsubscribe('shapeSelected', handleShapeSelected)
  }, [subscribe, unsubscribe, shapeStore])

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
