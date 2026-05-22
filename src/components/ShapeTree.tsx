import $ from 'jquery'
import React, { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import '../styles/shape_properties.css'
import styles from './ShapeTree.module.css'
import { useController } from '../3d/MainViewController'
import Button from './ShapeButton'
import { useNotification } from '../notification'
import ShapeInfo from './ShapeInfo'
import { findMeshByInfoId, toHtmlColor } from '../3d/objectUtil'
import { useShapeStore, type ShapeTreeNode } from '../data/shapeStore'

const PAGE_SIZE = 10

type FlattenedShapeNode = ShapeTreeNode & { depth: number }

export const ShapeList: React.FC = () => {
  const { deleteSelectedShape } = useController()
  const { subscribe, unsubscribe, notify } = useNotification()
  const shapeStore = useShapeStore()
  const [projectName, setProjectName] = useState($('.project-name').text())
  const [tree, setTree] = useState<ShapeTreeNode[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const refreshTree = useCallback(() => {
    shapeStore.getShapesPage({ page, pageSize: PAGE_SIZE })
      .then(({ docs, total: t, totalPages: tp }) => {
        const map = new Map<string, ShapeTreeNode>()
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
        setTree(roots)
        setTotal(t)
        setTotalPages(Math.max(1, tp))
      })
      .catch(() => null)
  }, [shapeStore, page])

  useEffect(() => {
    const handleProjectName = (newName: string) => setProjectName(newName)
    subscribe<string>('projectName', handleProjectName)
    return () => unsubscribe<string>('projectName', handleProjectName)
  }, [subscribe, unsubscribe])

  useEffect(() => {
    refreshTree()
    const onChange = () => refreshTree()
    shapeStore.subscribe('shapeAdded', onChange)
    shapeStore.subscribe('shapeRemoved', onChange)
    shapeStore.subscribe('shapeUpdated', onChange)
    return () => {
      shapeStore.unsubscribe('shapeAdded', onChange)
      shapeStore.unsubscribe('shapeRemoved', onChange)
      shapeStore.unsubscribe('shapeUpdated', onChange)
    }
  }, [shapeStore, refreshTree])

  const flattenedTree = useMemo(() => {
    const flatten = (nodes: ShapeTreeNode[], depth = 0): FlattenedShapeNode[] =>
      nodes.flatMap(node => [
        { ...node, depth },
        ...flatten(node.children, depth + 1),
      ])

    return flatten(tree)
  }, [tree])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

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
        {flattenedTree.map(node => (
          <ShapeRow
            key={node.id}
            nodeId={node.id}
            isSelected={!!node.isSelected}
            notify={notify}
            depth={node.depth}
          >
            <ShapeInfo
              shape={node.meshType}
              color={toHtmlColor(node.color)}
              size={50}
              label={node.meshType}
            />
          </ShapeRow>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pager}>
          <button disabled={!hasPrev} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Prev
          </button>
          <span style={{ margin: '0 8px' }}>
            Page {page} / {totalPages}
          </span>
          <button disabled={!hasNext} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
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
  depth,
}: PropsWithChildren<{
  isSelected: boolean
  nodeId: string
  notify: ReturnType<typeof useNotification>['notify']
  depth: number
}>) {
  return (
    <div
      className='shape-item'
      style={{
        backgroundColor: isSelected ? '#ffff00' : 'transparent',
        width: '70%',
        paddingLeft: depth * 16,
      }}
      onClick={e => {
        const mesh = findMeshByInfoId(nodeId)
        notify('shapeSelected', mesh)
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}

