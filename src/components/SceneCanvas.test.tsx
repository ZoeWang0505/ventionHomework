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
import { ShapeStoreProvider } from '../data/shapeStore'

// Swap PouchDB's browser build (which pulls Node-style `events`/`inherits`
// that don't load cleanly in vitest-browser-chromium) for a minimal
// in-memory fake that only implements the surface ShapeStore actually uses.
// Avoids dragging pouchdb-core/-memory through the same CJS-interop swamp.
vi.mock('pouchdb-browser', () => {
  type Doc = Record<string, unknown> & { _id?: string; _rev?: string }
  type ChangeCb = (c: { id: string; deleted?: boolean; doc?: Doc }) => void
  return {
    default: class MemPouch {
      // Static no-op so `PouchDB.plugin(PouchFind)` at module load doesn't blow up.
      static plugin(_p: unknown) {
        return MemPouch
      }
      private docs = new Map<string, Doc>()
      private revCounter = 0
      private listeners: ChangeCb[] = []
      constructor(_name: string, _opts?: unknown) {}
      private nextRev(prev?: string) {
        const n = prev ? parseInt(prev.split('-')[0], 10) + 1 : 1
        return `${n}-${++this.revCounter}`
      }
      async post(doc: Doc) {
        const id = `doc-${++this.revCounter}`
        const rev = this.nextRev()
        const stored = { ...doc, _id: id, _rev: rev }
        this.docs.set(id, stored)
        queueMicrotask(() =>
          this.listeners.forEach(cb => cb({ id, doc: stored })),
        )
        return { id, rev, ok: true }
      }
      async get(id: string) {
        const d = this.docs.get(id)
        if (!d) throw new Error(`not found: ${id}`)
        return d
      }
      async put(doc: Doc) {
        if (!doc._id) throw new Error('put requires _id')
        const rev = this.nextRev(doc._rev)
        const stored = { ...doc, _rev: rev }
        this.docs.set(doc._id, stored)
        queueMicrotask(() =>
          this.listeners.forEach(cb => cb({ id: doc._id!, doc: stored })),
        )
        return { id: doc._id, rev, ok: true }
      }
      async remove(doc: Doc) {
        if (!doc._id) throw new Error('remove requires _id')
        this.docs.delete(doc._id)
        queueMicrotask(() =>
          this.listeners.forEach(cb => cb({ id: doc._id!, deleted: true })),
        )
        return { id: doc._id, ok: true }
      }
      async destroy() {
        this.docs.clear()
        return { ok: true }
      }
      async allDocs(opts: { limit?: number; skip?: number } = {}) {
        let rows = Array.from(this.docs.values()).map(doc => ({ id: doc._id, doc }))
        if (typeof opts.skip === 'number') rows = rows.slice(opts.skip)
        if (typeof opts.limit === 'number') rows = rows.slice(0, opts.limit)
        return { rows }
      }
      async info() {
        return { doc_count: this.docs.size }
      }
      // pouchdb-find surface — no-op index, simple equality selector.
      async createIndex(_def: unknown) {
        return { result: 'created' as const }
      }
      async find(opts: { selector: Record<string, unknown> }) {
        const sel = opts.selector ?? {}
        const docs = Array.from(this.docs.values()).filter(doc =>
          Object.entries(sel).every(([k, v]) => (doc as Record<string, unknown>)[k] === v),
        )
        return { docs }
      }
      changes() {
        return {
          on: (event: string, cb: ChangeCb) => {
            if (event === 'change') this.listeners.push(cb)
          },
          cancel: () => {
            this.listeners = []
          },
        }
      }
    },
  }
})

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
        <ShapeStoreProvider>
          <ControllerProvider>
            <TestController callback={(ctx) => (controller = ctx)} />
            <SceneCanvas />
          </ControllerProvider>
        </ShapeStoreProvider>
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
