import $ from 'jquery'
import React, { useEffect, useState, type PropsWithChildren } from 'react'
import { createRoot } from 'react-dom/client'
import '../../styles/shape_properties.css'
import styles from './ShapeTree.module.css'
import { getNotificationCenter } from '../notification'
import type { Mesh } from 'three'
import ThreeEngineController from '../3d/engine'

const ShapeList: React.FC = () => {
  const [projectName, setProjectName] = useState($('.project-name').text())
  const [numOfShapes, setNumOfShapes] = useState(0)
  const [shapes, setShapes] = useState<Mesh[]>([])
  const [selectedShape, setSelectedShape] = useState<Mesh | null>(null)

  getNotificationCenter().subscribe('projectName', newName => {
    setProjectName(newName)
  })

  useEffect(() => {
    getNotificationCenter().subscribe('shapeAdded', (shapes: Mesh[]) => {
      setShapes(shapes)
      setNumOfShapes(ThreeEngineController.getInstance().getObjectCount())
    })
    getNotificationCenter().subscribe('shapeRemoved', (shapes: Mesh[]) => {
      setShapes(shapes)
      setNumOfShapes(ThreeEngineController.getInstance().getObjectCount())
    })

    getNotificationCenter().subscribe('shapeSelected', (shape: Mesh | null) => {
      setSelectedShape(shape)
    })
  }, [])

  return (
    <div className={styles.container}>
      <h3>{projectName}</h3>
      <span>{numOfShapes} objects</span>

      <div className={styles.treeContainer}>
        {shapes.map((shape, index) => (
          <ShapeNode
            key={shape.uuid}
            shape={shape}
            selectedShape={selectedShape}
            index={index}
            level={0}
          />
        ))}
      </div>
    </div>
  )
}

interface ShapeNodeProps {
  shape: Mesh
  selectedShape: Mesh | null
  index: number
  level: number
}

const ShapeNode: React.FC<ShapeNodeProps> = ({
  shape,
  selectedShape,
  index,
  level
}) => {
  const label = level === 0 ? `Shape ${index + 1}` : `Child Shape ${index + 1}`
  return (
    <ShapeItem
      key={shape.uuid}
      shape={shape}
      isSelected={shape.uuid === selectedShape?.uuid}
    >
      {label}
      {shape.children.length > 0 && (
        <div style={{ marginLeft: '10px' }}>
          {shape.children.map((child, childIndex) => (
            <ShapeNode
              key={child.uuid}
              shape={child as Mesh}
              selectedShape={selectedShape}
              index={childIndex}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </ShapeItem>
  )
}

function ShapeItem({
  children,
  isSelected,
  shape
}: PropsWithChildren<{ isSelected: boolean; shape: Mesh }>) {
  return (
    <div
      className='shape-item'
      style={{
        backgroundColor: isSelected ? '#ffff00' : 'transparent'
      }}
      onClick={e => {
        getNotificationCenter().notify('shapeSelected', shape)
        e.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}

export function createShapeList() {
  const listRoot = document.getElementById('shape-properties')
  if (listRoot) {
    createRoot(listRoot).render(<ShapeList />)
  }
}
