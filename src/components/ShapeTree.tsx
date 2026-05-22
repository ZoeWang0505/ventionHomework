import $ from 'jquery'
import React, { useCallback, useEffect, useState, type PropsWithChildren } from 'react'

import '../styles/shape_properties.css'
import styles from './ShapeTree.module.css'
import type { Mesh } from 'three'
import ThreeEngineController from '../3d/engine'
import { useController } from '../3d/MainViewController'
import Button from './ShapeButton'
import { useNotification } from '../notification'
import ShapeInfo from './ShapeInfo'
import { toHtmlColor } from '../3d/objectUtil'
import { useShapeStore, type ShapeDoc } from '../data/shapeStore'

const PAGE_SIZE = 100

// Helper to compute depth (parentId chain) for proper indentation
const computeDepth = (doc: ShapeDoc, docMap: Map<string, ShapeDoc>): number => {
  if (!doc.parentId) return 0
  const parent = docMap.get(doc.parentId)
  if (!parent) return 0
  return 1 + computeDepth(parent, docMap)
}

export const ShapeList: React.FC = () => {
  const { deleteSelectedShape } = useController()
  const { subscribe, unsubscribe, notify } = useNotification()
  const shapeStore = useShapeStore()
  const [projectName, setProjectName] = useState($('.project-name').text())
  const [page, setPage] = useState(1)
  const [docs, setDocs] = useState<ShapeDoc[]>([])
  const [docMap, setDocMap] = useState<Map<string, ShapeDoc>>(new Map())
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const refreshPage = useCallback(
    (targetPage = page) => {
      shapeStore
        .getShapesPage({ page: targetPage, pageSize: PAGE_SIZE })
        .then(res => {
          setDocs(res.docs)
          // Build map for quick parent lookup
          const map = new Map<string, ShapeDoc>()
          for (const doc of res.docs) {
            if (doc._id) map.set(doc._id, doc)
          }
          setDocMap(map)
          setTotal(res.total)
          setTotalPages(res.totalPages)
          // If a page becomes empty after deletes, step back automatically.
          if (res.docs.length === 0 && targetPage > 1) setPage(targetPage - 1)
        })
        .catch(() => null)
    },
    [shapeStore, page],
  )

  useEffect(() => {
    const handleProjectName = (newName: string) => setProjectName(newName)
    subscribe<string>('projectName', handleProjectName)
    return () => unsubscribe<string>('projectName', handleProjectName)
  }, [subscribe, unsubscribe])

  useEffect(() => {
    refreshPage(page)
    const onChange = () => refreshPage(page)
    shapeStore.subscribe('shapeAdded', onChange)
    shapeStore.subscribe('shapeRemoved', onChange)
    shapeStore.subscribe('shapeUpdated', onChange)
    return () => {
      shapeStore.unsubscribe('shapeAdded', onChange)
      shapeStore.unsubscribe('shapeRemoved', onChange)
      shapeStore.unsubscribe('shapeUpdated', onChange)
    }
  }, [shapeStore, page, refreshPage])

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className={styles.container}>
      <h3>{projectName}</h3>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <span>{total} objects</span>
        <div style={{ width: '30%' }}>
          <Button label={'delete'} onClick={() => deleteSelectedShape()} />
        </div>
      </div>

      <div className={styles.treeContainer}>
        {docs.map((doc, index) => {
          const depth = computeDepth(doc, docMap)
          return (
            <ShapeRow
              key={doc._id ?? index}
              nodeId={doc._id ?? ''}
              isSelected={!!doc.isSelected}
              notify={notify}
              depth={depth}
            >
              <ShapeInfo
                shape={doc.meshType}
                color={toHtmlColor(doc.color)}
                size={50}
                label={`Shape ${index + 1}`}
              />
            </ShapeRow>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className={styles.pager}>
          <button disabled={!hasPrev} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Prev
          </button>
          <span style={{ margin: '0 8px' }}>
            Page {page} / {totalPages}
          </span>
          <button disabled={!hasNext} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function ShapeRow({
  children,
  isSelected,
  nodeId,
  notify,
  depth = 0,
}: PropsWithChildren<{
  isSelected: boolean
  nodeId: string
  notify: ReturnType<typeof useNotification>['notify']
  depth?: number
}>) {
  return (
    <div
      className='shape-item'
      style={{
        backgroundColor: isSelected ? '#ffff00' : 'transparent',
        width: '70%',
        marginLeft: `${depth * 16}px`,
      }}
      onClick={e => {
        // Resolve the mesh in the scene by infoId so the existing
        // 'shapeSelected' handler (which expects a Mesh) can route it
        // through the store.
        const mesh = findMeshByInfoId(nodeId)
        notify('shapeSelected', mesh)
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}

function findMeshByInfoId(id: string): Mesh | null {
  let found: Mesh | null = null
  ThreeEngineController.getInstance()
    .getObjectsInScene()
    .forEach(root => {
      root.traverse(node => {
        const m = node as Mesh
        if (!found && (m as { isMesh?: boolean }).isMesh && node.userData?.infoId === id) {
          found = m
        }
      })
    })
  return found
}
