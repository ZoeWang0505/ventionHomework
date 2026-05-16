import $ from 'jquery'
import React, { useEffect, useState, type PropsWithChildren } from 'react'

import '../styles/shape_properties.css'
import styles from './ShapeTree.module.css'
import type { Mesh } from 'three'
import ThreeEngineController from '../3d/engine'
import { useController } from '../3d/MainViewController'
import Button from './ShapeButton'
import { useNotification } from '../notification'
import ShapeInfo from './ShapeInfo'
import type { Info } from '../3d/buildShape'
import { toHtmlColor } from '../3d/objectUtil'

export const ShapeList: React.FC= () => {
  const {deleteSelectedShape} = useController()
  const {subscribe} = useNotification()
  const [projectName, setProjectName] = useState($('.project-name').text())
  const [numOfShapes, setNumOfShapes] = useState(0)
  const [shapes, setShapes] = useState<Mesh[]>([])
  const [selectedShape, setSelectedShape] = useState<Mesh | null>(null)

  subscribe('projectName', newName => {
    setProjectName(newName)
  })

  useEffect(() => {
    subscribe('shapeAdded', (shapes: Mesh[]) => {
      setShapes(shapes)
      setNumOfShapes(ThreeEngineController.getInstance().getObjectCount())
    })
    subscribe('shapeRemoved', (shapes: Mesh[]) => {
      setShapes(shapes)
      setNumOfShapes(ThreeEngineController.getInstance().getObjectCount())
    })

    subscribe('shapeSelected', (shape: Mesh | null) => {
      setSelectedShape(shape)
    })
  }, [])

  return (
    <div className={styles.container}>
      <h3>{projectName}</h3>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span>{numOfShapes} objects</span>
                  <div style={{width:"30%"}}>
                <Button label={"delete"} onClick={() => {
                      deleteSelectedShape()
                }} />
          </div>
      </div>

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
  level,
}) => {
  const label = level === 0 ? `Shape ${index + 1}` : `Child Shape ${index + 1}`
  const {color, meshType} = shape.userData as Info;
  return (
      <ShapeItem
        key={shape.uuid}
        shape={shape}
        isSelected={shape.uuid === selectedShape?.uuid}
      >
        <ShapeInfo shape={meshType} color={toHtmlColor(color)} size={50} label={label} />
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
  shape,
}: PropsWithChildren<{ isSelected: boolean; shape: Mesh}>) {
  const {notify} = useNotification()
  return (
      <div
        className='shape-item'
        style={{
          backgroundColor: isSelected ? '#ffff00' : 'transparent',
          width:"70%"
        }}
        onClick={e => {
          notify('shapeSelected', shape)
          e.stopPropagation()
        }}
      >
        {children}
      </div>
  )
}
