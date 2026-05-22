import { createContext, useContext, useRef, type ReactNode } from 'react'

export type Callback<T = unknown> = (value: T) => void

interface NotificationAPI {
  subscribe: <T = unknown>(topic: string, cb: Callback<T>) => void
  unsubscribe: <T = unknown>(topic: string, cb: Callback<T>) => void
  notify: <T = unknown>(topic: string, value: T) => void
}

export const NotificationContext = createContext<NotificationAPI | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const topics = useRef(new Map<string, Callback<unknown>[]>())

  const subscribe = <T = unknown>(topic: string, cb: Callback<T>) => {
    if (!topics.current.has(topic)) {
      topics.current.set(topic, [])
    }
    topics.current.get(topic)!.push(cb as Callback<unknown>)
  }

  const unsubscribe = <T = unknown>(topic: string, cb: Callback<T>) => {
    const list = topics.current.get(topic)
    if (!list) return
    const index = list.indexOf(cb as Callback<unknown>)
    if (index !== -1) list.splice(index, 1)
  }

  const notify = <T = unknown>(topic: string, value: T) => {
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

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('Notification must be used inside <NotificationProvider>')
  }
  return ctx
}
