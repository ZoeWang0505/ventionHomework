import { Mesh, type Object3D } from "three";

/**
 * AI generated function
 * @param object 
 */
export const disposeObject = (object: Object3D) => {
  object.traverse((node) => {
    if (node instanceof Mesh) {
      // 1. Dispose Geometry
      if (node.geometry) {
        node.geometry.dispose();
      }

      // 2. Dispose Material(s)
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach(mat => mat.dispose());
        } else {
          node.material.dispose();
        }
      }
    }
  });

  // 3. Final removal from scene tree
  if (object.parent) {
    object.parent.remove(object);
  }
};