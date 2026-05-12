import { Camera, Object3D, Raycaster, Vector2 } from 'three'

export class RayCastService {
  private raycaster = new Raycaster()
  private mousePointer = new Vector2()

  update(point2D: [number, number], camera: Camera) {
    this.raycaster.setFromCamera(this.mousePointer.fromArray(point2D), camera)

    return this
  }

  getIntersections(objects: Object3D[]) {
    return this.raycaster.intersectObjects(objects, true)
  }

  getRaycaster() {
    return this.raycaster
  }
}
