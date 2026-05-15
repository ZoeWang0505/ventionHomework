import { Vector3, Mesh, BoxGeometry, MeshBasicMaterial, BufferGeometry } from "three"
import { vi } from "vitest"
import * as exports from '../3d/buildShape'
vi.mock('../3d/buildShape', { spy: true })

export function mockNewMesh({
  color = 'red',
  position = new Vector3(),
  mockedMesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color }))
}: {
  color?: string
  mockedMesh?: Mesh<BufferGeometry, MeshBasicMaterial>
  position?: Vector3
} = {}) {
  vi.spyOn(mockedMesh.position, 'copy').mockImplementationOnce(() => position)

  vi.mocked(exports.buildShape).mockImplementationOnce(() => mockedMesh)
  return mockedMesh
}