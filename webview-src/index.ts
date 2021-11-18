// Copyright 2021 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

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

  keys(): Promise<string[]> {
    return invoke('plugin:store|keys', {
      path: this.path
    })
  }
  
  values(): Promise<string[]> {
    return invoke('plugin:store|values', {
      path: this.path
    })
  }

  entries<T>(): Promise<[key: string, value: T][]> {
    return invoke('plugin:store|entries', {
      path: this.path
    })
  }

  length(): Promise<string[]> {
    return invoke('plugin:store|length', {
      path: this.path
    })
  }

  load(): Promise<void> {
    return invoke('plugin:store|load', {
      path: this.path
    })
  }

  save(): Promise<void> {
    return invoke('plugin:store|save', {
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
