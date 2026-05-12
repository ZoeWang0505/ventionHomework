import React from 'react'

type ButtonProps = {
  label: string
  onClick: () => void
}

const ShapeButton: React.FC<ButtonProps> = ({ label, onClick }) => {
  const _onClick = () => {
    onClick()
  }
  return <button onClick={_onClick}>Add {label}</button>
}

export default ShapeButton
