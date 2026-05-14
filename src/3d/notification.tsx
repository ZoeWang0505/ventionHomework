// NotificationProvider.tsx
import { createContext, useContext, useEffect, useRef, useState } from 'react'

type Callback = (value: any) => void

interface NotificationAPI {
  subscribe: (topic: string, cb: Callback) => void
  unsubscribe: (topic: string, cb: Callback) => void
  notify: (topic: string, value: any) => void
}

export const NotificationContext = createContext<NotificationAPI>(null as any)

export function NotificationProvider({ children }) {
  const topics = useRef(new Map<string, Callback[]>())

  const subscribe = (topic: string, cb: Callback) => {
    if (!topics.current.has(topic)) {
      topics.current.set(topic, [])
    }
    topics.current.get(topic)!.push(cb)
  }

  const unsubscribe = (topic: string, cb: Callback) => {
    const list = topics.current.get(topic)
    if (!list) return
    const index = list.indexOf(cb)
    if (index !== -1) list.splice(index, 1)
  }

  const notify = (topic: string, value: any) => {
    const list = topics.current.get(topic)
    if (!list) return
    list.forEach(cb => cb(value))
  }

  return (
    <NotificationContext.Provider value={{ subscribe, unsubscribe, notify }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification(topic: string) {
  const { subscribe, unsubscribe } = useContext(NotificationContext)
  const [value, setValue] = useState<any>(null)

  useEffect(() => {
    const handler = (v: any) => setValue(v)

    subscribe(topic, handler)
    return () => unsubscribe(topic, handler)
  }, [topic, subscribe, unsubscribe])

  return value
}
