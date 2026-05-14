import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import SceneCanvas from './SceneCanvas'
import { act } from 'react'
import {
  BoxGeometry,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector3
} from 'three'

describe('SceneCanvas', () => {
  const {createShape} = useController();
  async function renderSceneCanvas() {
    const { getByTestId } = await render(
      <NotificationProvider>
        <ControllerProvider>
                <SceneCanvas />
        </ControllerProvider>
      </NotificationProvider>
    )
    const canvas = getByTestId('scene-canvas')

    return { canvas }
  }

  test('should highlight a newly created shape on click', async () => {
    const mockedMesh = mockNewMesh({
      color: 'rgb(255, 0, 0)',
      position: new Vector3(0, 0, 0)
    })
    const { canvas } = await renderSceneCanvas()

    act(() => {
      createShape('sphere')
    })

    expect(mockedMesh.material.color.getStyle()).toBe('rgb(255,0,0)')
    expect(mockedMesh.userData.isSelected).toBeFalsy()

    const $canvas = canvas.element()
    const middleOfCanvas = {
      clientX: $canvas.clientWidth / 2,
      clientY: $canvas.clientHeight / 2
    }
    await canvas.click(middleOfCanvas)

    expect(mockedMesh.material.color.getStyle()).toBe('rgb(255,255,0)')
    expect(mockedMesh.userData.isSelected).toBe(true)
  })
})

import * as exports from '../3d/buildShape'
import { ControllerProvider, useController } from '../3d/MainViewController'
import { NotificationProvider } from '../notification'
vi.mock('../3d/buildShape', { spy: true })

function mockNewMesh({
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
