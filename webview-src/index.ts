import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from '@tauri-apps/api/window'

interface ChangePayload<T> {
  path: string
  key: string
  value: T | null
}

export default class Store {
  path: string
  constructor(path: string) {
    this.path = path
  }

  set(key: string, value: unknown): Promise<void> {
    return invoke<void>('plugin:store|set', {
      path: this.path,
      key,
      value
    })
  }

  get<T>(key: string): Promise<T | null> {
    return invoke('plugin:store|get', {
      path: this.path,
      key
    })
  }

  has(key: string): Promise<boolean> {
    return invoke('plugin:store|has', {
      path: this.path,
      key
    })
  }

  delete(key: string): Promise<boolean> {
    return invoke('plugin:store|delete', {
      path: this.path,
      key
    })
  }

  clear(): Promise<void> {
    return invoke('plugin:store|clear', {
      path: this.path
    })
  }

  reset(): Promise<void> {
    return invoke('plugin:store|reset', {
      path: this.path
    })
  }
  
  onKeyChange<T>(key: string, cb: (value: T | null) => void) {
    appWindow.listen<ChangePayload<T>>('store://change', event => {
      if (event.payload.path === this.path && event.payload.key === key) {
        cb(event.payload.value)
      }
    })
  }

  onChange(cb: (key: string, value: unknown) => void) {
    appWindow.listen<ChangePayload<unknown>>('store://change', event => {
      if (event.payload.path === this.path) {
        cb(event.payload.key, event.payload.value)
      }
    })
  }
}
