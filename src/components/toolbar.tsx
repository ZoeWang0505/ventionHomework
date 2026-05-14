// Toolbar.tsx
import { useContext, useState } from 'react'
import { NotificationContext } from '../notification'

// import '../styles/toolbar.css'

export function Toolbar() {
  const [name, setName] = useState('Project')
 const { notify } = useContext(NotificationContext)

  function handleChangeName() {
    const newName = prompt('Enter new name', name)
    if (!newName) return
    setName(newName)
    notify('projectName', newName)
  }

  return (
    <nav className="top-toolbar">
      <h2 className="project-name">{name}</h2>

      <button onClick={handleChangeName}>
        Change name
      </button>

      {/* This replaces your #react-toolbar-root div */}
      <div id="react-toolbar-root" />
    </nav>
  )
}
