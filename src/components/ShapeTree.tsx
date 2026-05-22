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

  const refreshTree = useCallback(() => {
    Promise.all([shapeStore.buildTree(), shapeStore.getAllShapes()])
      .then(([treeDocs, allDocs]) => {
        setTree(treeDocs)
        setTotal(allDocs.length)
      })
      .catch(() => null)
  }, [shapeStore])

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

  const totalPages = Math.max(1, Math.ceil(flattenedTree.length / PAGE_SIZE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const displayedTree = flattenedTree.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
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
        {displayedTree.map(node => (
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

