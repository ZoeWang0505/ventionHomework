import { afterAll, afterEach, describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import SceneCanvas from './SceneCanvas'
import { cleanup } from 'vitest-browser-react'
import { act } from 'react'
import {
  BoxGeometry,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector3
} from 'three'

import { beforeEach } from 'vitest'
import ThreeEngineController from '../3d/engine'
import { ControllerProvider,type ControllerContextValue } from '../3d/MainViewController'

beforeEach(() => {
  // Reset engine singleton BEFORE each test
  ThreeEngineController.dispose?.()
})

afterEach(() => {
  // CRITICAL: unmount SceneCanvas and stop render loop
  cleanup()
  // Reset engine singleton AFTER unmount
  ThreeEngineController.dispose?.()
})

afterAll(() => cleanup())

describe('SceneCanvas', () => {
  let controller: ControllerContextValue;
  
  async function renderSceneCanvas() {
    const { getByTestId } = await render(
      <NotificationProvider>
        <ControllerProvider>
          <TestController callback={(ctx) => (controller = ctx)} />
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
      controller.createShape('sphere')
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

    test("deleteSelectedShape removes mesh", async () => {
      mockNewMesh({ color: "rgb(255,0,0)" });

      const { canvas } = await renderSceneCanvas()
      act(() => {
        controller.createShape('sphere')
      })
      expect(controller.view.getObjectsInScene().length).toBe(1)

      const $canvas = canvas.element()
      const middleOfCanvas = {
        clientX: $canvas.clientWidth / 2,
        clientY: $canvas.clientHeight / 2
      }
      await canvas.click(middleOfCanvas)
      act(() => {
        controller.deleteSelectedShape();
      })

      expect(controller.view.getObjectsInScene().length).toBe(0)
      expect(controller.selectedShape).toBe(null)
    });
})

import * as exports from '../3d/buildShape'

import { TestController } from '../3d/testController'
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
