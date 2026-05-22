// Toolbar.tsx
import { useState } from 'react'
import { useNotification } from '../notification'

// import '../styles/toolbar.css'

export function Toolbar() {
  const [name, setName] = useState('Project')
  const { notify } = useNotification()

  function handleChangeName() {
    const newName = prompt('Enter new name', name)
    if (!newName) return
    setName(newName)
    notify('projectName', newName)
  }

  return (
    <nav className="top-toolbar">
      <h2 className="project-name">{name}</h2>

      <div id="react-toolbar-root" >
        <button onClick={handleChangeName}>
          Change name
        </button>
      </div>
    </nav>
  )
}
