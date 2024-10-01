import { listen } from '@tauri-apps/api/event';
import { invoke, Resource } from '@tauri-apps/api/core';

// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
/**
 * @param path: Path to save the store in `app_data_dir`
 * @param options: Store configuration options
 */
async function createStore(path, options) {
    const resourceId = await invoke('plugin:store|create_store', {
        path,
        ...options
    });
    return new Store(resourceId, path);
}
/**
 * A lazy loaded key-value store persisted by the backend layer.
 */
class Store extends Resource {
    constructor(rid, path) {
        super(rid);
        this.path = path;
    }
    /**
     * Inserts a key-value pair into the store.
     *
     * @param key
     * @param value
     * @returns
     */
    async set(key, value) {
        await invoke('plugin:store|set', {
            rid: this.rid,
            key,
            value
        });
    }
    /**
     * Returns the value for the given `key` or `null` the key does not exist.
     *
     * @param key
     * @returns
     */
    async get(key) {
        return await invoke('plugin:store|get', {
            rid: this.rid,
            key
        });
    }
    /**
     * Returns `true` if the given `key` exists in the store.
     *
     * @param key
     * @returns
     */
    async has(key) {
        return await invoke('plugin:store|has', {
            rid: this.rid,
            key
        });
    }
    /**
     * Removes a key-value pair from the store.
     *
     * @param key
     * @returns
     */
    async delete(key) {
        return await invoke('plugin:store|delete', {
            rid: this.rid,
            key
        });
    }
    /**
     * Clears the store, removing all key-value pairs.
     *
     * Note: To clear the storage and reset it to it's `default` value, use `reset` instead.
     * @returns
     */
    async clear() {
        await invoke('plugin:store|clear', { rid: this.rid });
    }
    /**
     * Resets the store to it's `default` value.
     *
     * If no default value has been set, this method behaves identical to `clear`.
     * @returns
     */
    async reset() {
        await invoke('plugin:store|reset', { rid: this.rid });
    }
    /**
     * Returns a list of all key in the store.
     *
     * @returns
     */
    async keys() {
        return await invoke('plugin:store|keys', { rid: this.rid });
    }
    /**
     * Returns a list of all values in the store.
     *
     * @returns
     */
    async values() {
        return await invoke('plugin:store|values', { rid: this.rid });
    }
    /**
     * Returns a list of all entries in the store.
     *
     * @returns
     */
    async entries() {
        return await invoke('plugin:store|entries', { rid: this.rid });
    }
    /**
     * Returns the number of key-value pairs in the store.
     *
     * @returns
     */
    async length() {
        return await invoke('plugin:store|length', { rid: this.rid });
    }
    /**
     * Attempts to load the on-disk state at the stores `path` into memory.
     *
     * This method is useful if the on-disk state was edited by the user and you want to synchronize the changes.
     *
     * Note: This method does not emit change events.
     * @returns
     */
    async load() {
        await invoke('plugin:store|load', { rid: this.rid });
    }
    /**
     * Saves the store to disk at the stores `path`.
     *
     * As the store is only persisted to disk before the apps exit, changes might be lost in a crash.
     * This method lets you persist the store to disk whenever you deem necessary.
     * @returns
     */
    async save() {
        await invoke('plugin:store|save', { rid: this.rid });
    }
    /**
     * Listen to changes on a store key.
     * @param key
     * @param cb
     * @returns A promise resolving to a function to unlisten to the event.
     *
     * @since 2.0.0
     */
    async onKeyChange(key, cb) {
        return await listen('store://change', (event) => {
            if (event.payload.path === this.path && event.payload.key === key) {
                cb(event.payload.value);
            }
        });
    }
    /**
     * Listen to changes on the store.
     * @param cb
     * @returns A promise resolving to a function to unlisten to the event.
     *
     * @since 2.0.0
     */
    async onChange(cb) {
        return await listen('store://change', (event) => {
            if (event.payload.path === this.path) {
                cb(event.payload.key, event.payload.value);
            }
        });
    }
}

export { Store, createStore };
