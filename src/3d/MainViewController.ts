import * as THREE from 'three'
import { getNotificationCenter } from '../notification'
import ThreeEngineController from './engine'
import { RayCastService } from './raycaster'
import { buildShape, type Shape } from './buildShape'

export interface MainViewController {
  createShape(shape: Shape): void
  selectShape(point: [number, number]): void
  deleteSelectedShape(): void
}

export function createMainViewController(): MainViewController {
  const view = ThreeEngineController.getInstance()

  let selectedShape: THREE.Mesh | null = null
  const highlightedMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })

  function randomPosition() {
    return new THREE.Vector3(
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
      Math.random() * 10 - 5
    )
  }

  function highlightObject(obj: THREE.Mesh) {
    obj.userData.isSelected = false
    if (obj.userData.originalMaterial) {
      obj.material = obj.userData.originalMaterial
    }
  }

  getNotificationCenter().subscribe(
    'shapeSelected',
    (mesh: THREE.Mesh | null) => {
      const objects = view.getObjectsInScene()
      objects.forEach(obj => {
        highlightObject(obj as THREE.Mesh)
        obj.traverse(child => highlightObject(child as THREE.Mesh))
      })

      if (mesh === null) {
        selectedShape = null
        return
      }

      mesh.userData.isSelected = true
      mesh.userData.originalMaterial = mesh.material
      mesh.material = highlightedMaterial
      selectedShape = mesh
    }
  )

  return {
    createShape(shape: Shape) {
      const newMesh = buildShape(shape)

      if (newMesh) {
        newMesh.position.copy(randomPosition())

        if (selectedShape) {
          selectedShape.add(newMesh)
        } else {
          view.addToScene(newMesh)
        }

        getNotificationCenter().notify('shapeAdded', view.getObjectsInScene())
      }
    },
    selectShape(point: [number, number]) {
      const raycaster = new RayCastService()
      raycaster.update(point, view.getCamera())

      const objects = view.getObjectsInScene()
      const selectedObjects = raycaster.getIntersections(objects)
      if (!selectedObjects.length) {
        getNotificationCenter().notify('shapeSelected', null)
        return
      }

      const firstObject = selectedObjects[0].object
      getNotificationCenter().notify('shapeSelected', firstObject)
    },
    deleteSelectedShape() {
      if (selectedShape) {
        selectedShape.parent?.remove(selectedShape)
        getNotificationCenter().notify('shapeRemoved', view.getObjectsInScene())
        getNotificationCenter().notify('shapeSelected', null)
      }
    }
  }
}
