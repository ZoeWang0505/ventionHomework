import { Mesh, type Object3D } from "three";
import ThreeEngineController from "./engine";

/**
 * AI generated function, to disposeObject after delete
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

/**
 * Converts a hexadecimal number or string to a valid HTML hex color string.
 * @param {number|string} hex - The hex value (e.g., 0xff0000, "ff0000", "#ff0000")
 * @returns {string} The formatted HTML color string (e.g., "#ff0000")
 */
export const toHtmlColor = (hex): string => {
  // If it's already a number (like 0xff0000), convert it to a hex string
  if (typeof hex === 'number') {
    return '#' + hex.toString(16).padStart(6, '0');
  }

  // If it's a string, clean up any '0x' or '#' prefixes
  const cleaned = hex.toString().trim().replace(/^(0x|#)/i, '');

  // Ensure it's a valid 3 or 6 character hex length, default to black if invalid
  if (cleaned.length !== 3 && cleaned.length !== 6) {
    console.warn(`Invalid hex color: ${hex}. Defaulting to #000000.`);
    return '#000000';
  }

  return `#${cleaned.toLowerCase()}`;
}

export function findMeshByInfoId(id: string): Mesh | null {
  let found: Mesh | null = null
  ThreeEngineController.getInstance()
    .getObjectsInScene()
    .forEach(root => {
      root.traverse(node => {
        if (!found && node instanceof Mesh && node.userData?.infoId === id) {
          found = node
        }
      })
    })
  return found
}