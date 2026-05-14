import * as THREE from 'three'
import { getNotificationCenter } from '../notification'
import ThreeEngineController from './engine'
import { RayCastService } from './raycaster'
import { buildShape, type Shape } from './buildShape'

export interface MainViewController {
  createShape(shape: Shape): void
  selectShape(point: [number, number]): void
  deleteSelectedShape(): void
  deleteShape(shape: THREE.Mesh): void
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

  /**
   * highlight or unhighlight an object
   * @param obj 
   * @param highlight boolean, true to highlight, false to unhighlight
   */
  function highlightObject(obj: THREE.Object3D, highlight: boolean) {
    obj.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.userData.isSelected = highlight

        if (highlight) {
          node.material = highlightedMaterial;
        } else {
          if (node.userData.originalMaterial) {
            node.material = node.userData.originalMaterial;
          }
        }
      }
    });
  }

  function deleteShape(shape: THREE.Mesh)  {
    if (shape) {
      shape.parent?.remove(shape)
      getNotificationCenter().notify('shapeRemoved', view.getObjectsInScene())
    }
  }

  getNotificationCenter().subscribe(
    'shapeSelected',
    (mesh: THREE.Mesh | null) => {
      const objects = view.getObjectsInScene()
      objects.forEach(obj => {
        highlightObject(obj as THREE.Mesh, false)
        obj.traverse(child => highlightObject(child as THREE.Mesh, false))
      })

      if (mesh === null) {
        selectedShape = null
        return
      }

      mesh.userData.isSelected = true
      highlightObject(mesh as THREE.Mesh, true)
      mesh.traverse(child => highlightObject(child as THREE.Mesh, true))
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
        deleteShape(selectedShape)
        getNotificationCenter().notify('shapeSelected', null)
      }
    },
    deleteShape
  }
}
