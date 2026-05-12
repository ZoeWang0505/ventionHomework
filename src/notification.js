class Notification {
  notifiees = new Map()

  subscribe(topic, callback) {
    if (!this.notifiees.has(topic)) {
      this.notifiees.set(topic, [])
    }
    this.notifiees.get(topic).push(callback)
  }

  unsubscribe(topic, callback) {
    if (!this.notifiees.has(topic)) {
      return
    }
    const callbacks = this.notifiees.get(topic)
    const index = callbacks.indexOf(callback)
    if (index !== -1) {
      callbacks.splice(index, 1)
    }
  }

  notify(topic, value) {
    if (!this.notifiees.has(topic)) {
      return
    }
    const callbacks = this.notifiees.get(topic)
    callbacks.forEach(callback => callback(value))
  }
}

let notificationCenter = undefined
export function getNotificationCenter() {
  if (!notificationCenter) {
    notificationCenter = new Notification()
  }
  return notificationCenter
}
