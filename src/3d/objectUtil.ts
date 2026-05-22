import { Mesh, type Object3D } from "three";
import ThreeEngineController from "./engine";
import { Octree as ThreeExampleOctree } from 'three/examples/jsm/math/Octree.js'

// Use the three.js example Octree when available; keep an id->mesh map for O(1) lookup.
const sceneOctree: any = new (ThreeExampleOctree as any)()
const idMap = new Map<string, Mesh>()

export function indexSceneIntoOctree() {
  const meshes: Mesh[] = []
  ThreeEngineController.getInstance()
    .getObjectsInScene()
    .forEach(root => {
      root.traverse(node => {
        if (node instanceof Mesh) meshes.push(node)
      })
    })

  idMap.clear()
  // reset octree if it exposes a `clear` or `set` method, otherwise recreate
  if (typeof sceneOctree.clear === 'function') sceneOctree.clear()
  else if (typeof sceneOctree.dispose === 'function') sceneOctree.dispose()

  for (const m of meshes) {
    const id = m.userData?.infoId
    if (typeof id === 'string') idMap.set(id, m)
    if (typeof sceneOctree.add === 'function') sceneOctree.add(m)
  }
}

export function addMeshToOctree(mesh: Mesh) {
  const id = mesh.userData?.infoId
  if (typeof id === 'string') idMap.set(id, mesh)
  if (typeof sceneOctree.add === 'function') sceneOctree.add(mesh)
}

export function removeMeshFromOctree(mesh: Mesh) {
  const id = mesh.userData?.infoId
  if (typeof id === 'string') idMap.delete(id)
  if (typeof sceneOctree.remove === 'function') sceneOctree.remove(mesh)
}

export function updateMeshInOctree(mesh: Mesh) {
  const id = mesh.userData?.infoId
  if (typeof id === 'string') idMap.set(id, mesh)
  if (typeof sceneOctree.update === 'function') sceneOctree.update(mesh)
}

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
  // Rely on the id->mesh map for O(1) lookup. Keep indexes correct elsewhere.
  return idMap.get(id) ?? null
}