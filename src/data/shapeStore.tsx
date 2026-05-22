import PouchDB from 'pouchdb-browser'
import PouchFind from 'pouchdb-find'
import { createContext, useContext, useRef, type ReactNode } from 'react'

PouchDB.plugin(PouchFind)

export type ShapeDoc = {
  _id?: string
  _rev?: string
  type: 'shape'
  meshType: 'sphere' | 'cube' | 'cylinder'
  color: number
  position: { x: number; y: number; z: number }
  parentId?: string | null
  isSelected?: boolean
}

export type ShapeEvent = Partial<ShapeDoc> & { _id?: string; type: 'shape' }
export type ShapeTreeNode = {
  id: string
  meshType: ShapeDoc['meshType']
  color: number
  position: { x: number; y: number; z: number }
  isSelected?: boolean
  children: ShapeTreeNode[]
}

export type ShapeStoreEvent = 'shapeAdded' | 'shapeRemoved' | 'shapeUpdated'
export type ShapeListener = (doc: ShapeEvent) => void

class ShapeStore {
  private db: PouchDB.Database<ShapeDoc>
  private feed?: PouchDB.Core.Changes<ShapeDoc>
  private knownIds = new Set<string>()
  private listeners: Record<ShapeStoreEvent, Set<ShapeListener>> = {
    shapeAdded: new Set(),
    shapeRemoved: new Set(),
    shapeUpdated: new Set(),
  }
  private ready: Promise<void>

  constructor() {
    this.db = new PouchDB('shapes')
    this.ready = this.resetDatabase()
  }

  private async resetDatabase() {
    await new PouchDB('shapes').destroy().catch(() => null)
    this.db = new PouchDB('shapes')
    await Promise.all([
      this.db.createIndex({ index: { fields: ['type'] } }).catch(() => null),
      this.db.createIndex({ index: { fields: ['parentId'] } }).catch(() => null),
    ])
    await this.initChangeFeed()
  }

  private async initChangeFeed() {
    // Seed knownIds so subsequent changes can be classified as added vs updated.
    const docs = await this.getAllShapesInternal()
    for (const d of docs) if (d._id) this.knownIds.add(d._id)

    this.feed = this.db.changes({ live: true, include_docs: true, since: 'now' })
    this.feed.on('change', change => {
      const id = change.id
      if (change.deleted) {
        this.knownIds.delete(id)
        // Pouch doesn't include the deleted body; emit a stub identifying the row.
        this.emit('shapeRemoved', { _id: id, type: 'shape' } as ShapeDoc)
        return
      }
      const doc = change.doc as ShapeDoc | undefined
      if (!doc) return
      if (this.knownIds.has(id)) {
        this.emit('shapeUpdated', doc)
      } else {
        this.knownIds.add(id)
        this.emit('shapeAdded', doc)
      }
    })
  }

  subscribe(event: ShapeStoreEvent, cb: ShapeListener) {
    this.listeners[event].add(cb)
  }

  unsubscribe(event: ShapeStoreEvent, cb: ShapeListener) {
    this.listeners[event].delete(cb)
  }

  private emit(event: ShapeStoreEvent, doc: ShapeEvent) {
    this.listeners[event].forEach(cb => cb(doc))
  }

  async addShape(doc: Omit<ShapeDoc, '_id' | '_rev'>) {
    await this.ready
    const res = await this.db.post(doc)
    const added = { ...doc, _id: res.id, _rev: res.rev }
    this.knownIds.add(res.id)
    this.emit('shapeAdded', added)
    return added
  }

  async removeShape(id: string) {
    await this.ready
    try {
      const doc = await this.db.get(id)
      const res = await this.db.remove(doc)
      this.knownIds.delete(id)
      this.emit('shapeRemoved', { _id: id, type: 'shape' })
      return res
    } catch (e) {
      return null
    }
  }

  async updateShape(id: string, partial: Partial<Omit<ShapeDoc, '_id' | '_rev' | 'type'>>) {
    await this.ready
    try {
      const doc = await this.db.get(id)
      const next = { ...doc, ...partial }
      const res = await this.db.put(next)
      const updated = { ...next, _rev: res.rev }
      this.emit('shapeUpdated', updated)
      return updated
    } catch (e) {
      return null
    }
  }

  /**
   * Set selection state to `id` (or null to clear). Writes `isSelected` flags
   * to PouchDB so the change feed re-emits the resulting `shapeUpdated` events
   * as the single source of truth for selection.
   */
  async selectShape(id: string | null) {
    await this.ready
    const all = await this.getAllShapesInternal()
    const writes: Promise<unknown>[] = []
    for (const doc of all) {
      if (!doc._id) continue
      if (doc.isSelected && doc._id !== id) {
        writes.push(this.updateShape(doc._id, { isSelected: false }))
      }
    }
    if (id) {
      const target = all.find(d => d._id === id)
      if (target && !target.isSelected) {
        writes.push(this.updateShape(id, { isSelected: true }))
      }
    }
    await Promise.all(writes)
  }

  private async getAllShapesInternal() {
    const res = await this.db.find({ selector: { type: 'shape' } })
    return res.docs as ShapeDoc[]
  }

  async getAllShapes() {
    await this.ready
    return this.getAllShapesInternal()
  }

  /**
   * Build a nested tree representation of shapes based on their `parentId`.
   * Returns an array of root nodes, each with `children` recursively populated.
   */
  async buildTree(): Promise<ShapeTreeNode[]> {
    await this.ready
    const docs = await this.getAllShapesInternal()
    const map = new Map<string, ShapeTreeNode>()

    // create node entries
    for (const d of docs) {
      if (!d._id) continue
      map.set(d._id, {
        id: d._id,
        meshType: d.meshType,
        color: d.color,
        position: d.position,
        isSelected: d.isSelected,
        children: [],
      })
    }

    const roots: ShapeTreeNode[] = []

    // attach children to parents
    for (const d of docs) {
      if (!d._id) continue
      const node = map.get(d._id)!
      const parentId = d.parentId ?? null
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }

  /**
   * Indexed lookup of direct children of `parentId` (or root shapes when null).
   * Backed by the `parentId` Mango index created in the constructor.
   */
  async findByParent(parentId: string | null) {
    await this.ready
    const res = await this.db.find({
      selector: { parentId: parentId ?? null },
    })
    return res.docs as ShapeDoc[]
  }

  /**
   * Return a single page of shapes for large datasets.
   * Uses Mango `find` with the `type` index so design docs are excluded.
   * Total = `db.info().doc_count` minus the number of `_design/...` docs.
   * Note: `skip` is inefficient for very large offsets; for ~10k rows acceptable.
   */
  async getShapesPage({
    page = 1,
    pageSize = 100,
  }: {
    page?: number
    pageSize?: number
  } = {}) {
    await this.ready
    const safePage = Math.max(1, Math.floor(page))
    const safePageSize = Math.max(1, Math.floor(pageSize))
    const skip = (safePage - 1) * safePageSize

    const [info, designDocs, found] = await Promise.all([
      this.db.info(),
      this.db.allDocs({ startkey: '_design/', endkey: '_design/￰' }),
      this.db.find({
        selector: { type: 'shape' },
        skip,
        limit: safePageSize,
      }),
    ])
    const total = Math.max(0, info.doc_count - designDocs.rows.length)
    const docs = found.docs as ShapeDoc[]

    return {
      docs,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize) || 0,
    }
  }

}

// React context + provider for ShapeStore
type ShapeStoreApi = ShapeStore

const ShapeStoreContext = createContext<ShapeStoreApi | null>(null)

export function ShapeStoreProvider({ children }: { children: ReactNode }) {
  const ref = useRef<ShapeStoreApi | null>(null)
  if (!ref.current) ref.current = new ShapeStore()
  return <ShapeStoreContext.Provider value={ref.current}>{children}</ShapeStoreContext.Provider>
}

export function useShapeStore() {
  const ctx = useContext(ShapeStoreContext)
  if (!ctx) throw new Error('useShapeStore must be used inside <ShapeStoreProvider>')
  return ctx
}

