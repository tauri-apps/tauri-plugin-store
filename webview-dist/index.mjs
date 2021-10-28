import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';

class Store {
    constructor(path) {
        this.path = path;
    }
    set(key, value) {
        return invoke('plugin:store|set', {
            path: this.path,
            key,
            value
        });
    }
    get(key) {
        return invoke('plugin:store|get', {
            path: this.path,
            key
        });
    }
    has(key) {
        return invoke('plugin:store|has', {
            path: this.path,
            key
        });
    }
    delete(key) {
        return invoke('plugin:store|delete', {
            path: this.path,
            key
        });
    }
    clear() {
        return invoke('plugin:store|clear', {
            path: this.path
        });
    }
    onKeyChange(key, cb) {
        appWindow.listen('store://change', event => {
            if (event.payload.path === this.path && event.payload.key === key) {
                cb(event.payload.value);
            }
        });
    }
    onChange(cb) {
        appWindow.listen('store://change', event => {
            if (event.payload.path === this.path) {
                cb(event.payload.key, event.payload.value);
            }
        });
    }
}

export { Store as default };
