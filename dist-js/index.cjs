'use strict';

var event = require('@tauri-apps/api/event');
var core = require('@tauri-apps/api/core');

// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
/**
 * Create a new Store or load the existing store with the path.
 *
 * @example
 * ```typescript
 * import { Store } from '@tauri-apps/api/store';
 * const store = await Store.load('store.json');
 * ```
 *
 * @param path Path to save the store in `app_data_dir`
 * @param options Store configuration options
 */
async function load(path, options) {
    return await Store.load(path, options);
}
/**
 * Gets an already loaded store.
 *
 * If the store is not loaded, returns `null`. In this case you must {@link Store.load load} it.
 *
 * This function is more useful when you already know the store is loaded
 * and just need to access its instance. Prefer {@link Store.load} otherwise.
 *
 * @example
 * ```typescript
 * import { getStore } from '@tauri-apps/api/store';
 * const store = await getStore('store.json');
 * ```
 *
 * @param path Path of the store.
 */
async function getStore(path) {
    return await Store.get(path);
}
/**
 * A lazy loaded key-value store persisted by the backend layer.
 */
class LazyStore {
    get store() {
        if (!this._store) {
            this._store = load(this.path, this.options);
        }
        return this._store;
    }
    /**
     * Note that the options are not applied if someone else already created the store
     * @param path Path to save the store in `app_data_dir`
     * @param options Store configuration options
     */
    constructor(path, options) {
        this.path = path;
        this.options = options;
    }
    /**
     * Init/load the store if it's not loaded already
     */
    async init() {
        await this.store;
    }
    async set(key, value) {
        return (await this.store).set(key, value);
    }
    async get(key) {
        return (await this.store).get(key);
    }
    async has(key) {
        return (await this.store).has(key);
    }
    async delete(key) {
        return (await this.store).delete(key);
    }
    async clear() {
        await (await this.store).clear();
    }
    async reset() {
        await (await this.store).reset();
    }
    async keys() {
        return (await this.store).keys();
    }
    async values() {
        return (await this.store).values();
    }
    async entries() {
        return (await this.store).entries();
    }
    async length() {
        return (await this.store).length();
    }
    async reload() {
        await (await this.store).reload();
    }
    async save() {
        await (await this.store).save();
    }
    async onKeyChange(key, cb) {
        return (await this.store).onKeyChange(key, cb);
    }
    async onChange(cb) {
        return (await this.store).onChange(cb);
    }
    async close() {
        if (this._store) {
            await (await this._store).close();
        }
    }
}
/**
 * A key-value store persisted by the backend layer.
 */
class Store extends core.Resource {
    constructor(rid) {
        super(rid);
    }
    /**
     * Create a new Store or load the existing store with the path.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/api/store';
     * const store = await Store.load('store.json');
     * ```
     *
     * @param path Path to save the store in `app_data_dir`
     * @param options Store configuration options
     */
    static async load(path, options) {
        const rid = await core.invoke('plugin:store|load', {
            path,
            ...options
        });
        return new Store(rid);
    }
    /**
     * Gets an already loaded store.
     *
     * If the store is not loaded, returns `null`. In this case you must {@link Store.load load} it.
     *
     * This function is more useful when you already know the store is loaded
     * and just need to access its instance. Prefer {@link Store.load} otherwise.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/api/store';
     * let store = await Store.get('store.json');
     * if (!store) {
     *   store = await Store.load('store.json');
     * }
     * ```
     *
     * @param path Path of the store.
     */
    static async get(path) {
        return await core.invoke('plugin:store|get_store', { path }).then((rid) => (rid ? new Store(rid) : null));
    }
    async set(key, value) {
        await core.invoke('plugin:store|set', {
            rid: this.rid,
            key,
            value
        });
    }
    async get(key) {
        const [value, exists] = await core.invoke('plugin:store|get', {
            rid: this.rid,
            key
        });
        return exists ? value : undefined;
    }
    async has(key) {
        return await core.invoke('plugin:store|has', {
            rid: this.rid,
            key
        });
    }
    async delete(key) {
        return await core.invoke('plugin:store|delete', {
            rid: this.rid,
            key
        });
    }
    async clear() {
        await core.invoke('plugin:store|clear', { rid: this.rid });
    }
    async reset() {
        await core.invoke('plugin:store|reset', { rid: this.rid });
    }
    async keys() {
        return await core.invoke('plugin:store|keys', { rid: this.rid });
    }
    async values() {
        return await core.invoke('plugin:store|values', { rid: this.rid });
    }
    async entries() {
        return await core.invoke('plugin:store|entries', { rid: this.rid });
    }
    async length() {
        return await core.invoke('plugin:store|length', { rid: this.rid });
    }
    async reload() {
        await core.invoke('plugin:store|reload', { rid: this.rid });
    }
    async save() {
        await core.invoke('plugin:store|save', { rid: this.rid });
    }
    async onKeyChange(key, cb) {
        return await event.listen('store://change', (event) => {
            if (event.payload.resourceId === this.rid && event.payload.key === key) {
                cb(event.payload.exists ? event.payload.value : undefined);
            }
        });
    }
    async onChange(cb) {
        return await event.listen('store://change', (event) => {
            if (event.payload.resourceId === this.rid) {
                cb(event.payload.key, event.payload.exists ? event.payload.value : undefined);
            }
        });
    }
}

exports.LazyStore = LazyStore;
exports.Store = Store;
exports.getStore = getStore;
exports.load = load;
