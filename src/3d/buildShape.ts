import * as THREE from 'three'
import { Mesh } from 'three'

export type Shape = 'sphere' | 'cube' | 'cylinder'

export function buildShape(shape: Shape): Mesh {
  const colors = [0xff0000, 0x00ff00, 0x0000ff]

  const color = colors[Math.floor(Math.random() * colors.length)]
  switch (shape) {
    case 'sphere':
      return new Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshBasicMaterial({ color })
      )
    case 'cube':
      return new Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color })
      )
    case 'cylinder':
      return new Mesh(
        new THREE.CylinderGeometry(1, 1, 2, 32),
        new THREE.MeshBasicMaterial({ color })
      )
  }
}
