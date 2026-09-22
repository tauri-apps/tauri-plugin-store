/**
 * Simple, persistent key-value store.
 *
 * A store is persisted to a file inside the application data directory and is shared with the
 * Rust side of the application, which can read and write the same store through its own API.
 *
 * @module
 */
import { type UnlistenFn } from '@tauri-apps/api/event';
import { Resource } from '@tauri-apps/api/core';
/**
 * Options to create a store
 */
export type StoreOptions = {
    /**
     * Default value of the store
     */
    defaults?: {
        [key: string]: unknown;
    };
    /**
     * Auto save on modification with debounce duration in milliseconds, it's 100ms by default, pass in `false` to disable it
     */
    autoSave?: boolean | number;
    /**
     * Name of a serialize function registered in the rust side plugin builder
     */
    serializeFnName?: string;
    /**
     * Name of a deserialize function registered in the rust side plugin builder
     */
    deserializeFnName?: string;
    /**
     * Force create a new store with default values even if it already exists.
     */
    createNew?: boolean;
    /**
     * When creating the store, override the store with the on-disk state if it exists, ignoring defaults
     */
    overrideDefaults?: boolean;
};
/**
 * Create a new Store or load the existing store with the path.
 *
 * If the file at the given path does not exist yet, the store is created in memory with the
 * configured defaults and the file is only written on the first save.
 *
 * @example
 * ```typescript
 * import { load } from '@tauri-apps/plugin-store';
 * const store = await load('store.json');
 * ```
 *
 * @param path Path to save the store in `app_data_dir`
 * @param options Store configuration options
 * @returns A promise resolving to the loaded store.
 *
 * @since 2.1.0
 */
export declare function load(path: string, options?: StoreOptions): Promise<Store>;
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
 * import { getStore } from '@tauri-apps/plugin-store';
 * const store = await getStore('store.json');
 * ```
 *
 * @param path Path of the store.
 * @returns A promise resolving to the store instance, or `null` if it is not loaded.
 *
 * @since 2.1.0
 */
export declare function getStore(path: string): Promise<Store | null>;
/**
 * A lazy loaded key-value store persisted by the backend layer.
 *
 * The underlying {@linkcode Store} is only created or loaded when one of the methods of this
 * class is called for the first time, and every call afterwards reuses that same instance.
 *
 * @since 2.1.0
 */
export declare class LazyStore implements IStore {
    private readonly path;
    private readonly options?;
    private _store?;
    private get store();
    /**
     * Creates a handle to the store at the given path without loading it yet.
     *
     * Note that the options are not applied if someone else already created the store
     *
     * @param path Path to save the store in `app_data_dir`
     * @param options Store configuration options
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * ```
     */
    constructor(path: string, options?: StoreOptions | undefined);
    /**
     * Init/load the store if it's not loaded already
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * await store.init();
     * ```
     */
    init(): Promise<void>;
    /**
     * Inserts a key-value pair into the store, loading it first if needed.
     *
     * Delegates to {@linkcode Store.set} on the underlying store.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * await store.set('some-key', { value: 5 });
     * ```
     *
     * @param key The key to insert the value at.
     * @param value The value to store, which must be serializable to JSON.
     */
    set(key: string, value: unknown): Promise<void>;
    /**
     * Returns the value for the given `key` or `undefined` if the key does not exist.
     *
     * Delegates to {@linkcode Store.get} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const value = await store.get<{ value: number }>('some-key');
     * ```
     *
     * @param key The key to read the value of.
     * @returns A promise resolving to the stored value, or `undefined` if the key does not exist.
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Returns `true` if the given `key` exists in the store.
     *
     * Delegates to {@linkcode Store.has} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const exists = await store.has('some-key');
     * ```
     *
     * @param key The key to check.
     * @returns A promise resolving to `true` if the key exists in the store.
     */
    has(key: string): Promise<boolean>;
    /**
     * Removes a key-value pair from the store.
     *
     * Delegates to {@linkcode Store.delete} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const removed = await store.delete('some-key');
     * ```
     *
     * @param key The key to remove.
     * @returns A promise resolving to `true` if the key existed and was removed.
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clears the store, removing all key-value pairs.
     *
     * Note: To clear the storage and reset it to its `default` value, use {@linkcode reset} instead.
     * Delegates to {@linkcode Store.clear} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * await store.clear();
     * ```
     */
    clear(): Promise<void>;
    /**
     * Resets the store to its `default` value.
     *
     * If no default value has been set, this method behaves identical to {@linkcode clear}.
     * Delegates to {@linkcode Store.reset} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json', { defaults: { 'some-key': 0 } });
     * await store.reset();
     * ```
     */
    reset(): Promise<void>;
    /**
     * Returns a list of all keys in the store.
     *
     * Delegates to {@linkcode Store.keys} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const keys = await store.keys();
     * ```
     *
     * @returns A promise resolving to the list of keys, in arbitrary order.
     */
    keys(): Promise<string[]>;
    /**
     * Returns a list of all values in the store.
     *
     * Delegates to {@linkcode Store.values} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const values = await store.values();
     * ```
     *
     * @returns A promise resolving to the list of values, in arbitrary order.
     */
    values<T>(): Promise<T[]>;
    /**
     * Returns a list of all entries in the store.
     *
     * Delegates to {@linkcode Store.entries} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const entries = await store.entries();
     * ```
     *
     * @returns A promise resolving to the list of key-value pairs, in arbitrary order.
     */
    entries<T>(): Promise<Array<[key: string, value: T]>>;
    /**
     * Returns the number of key-value pairs in the store.
     *
     * Delegates to {@linkcode Store.length} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const length = await store.length();
     * ```
     *
     * @returns A promise resolving to the number of key-value pairs in the store.
     */
    length(): Promise<number>;
    /**
     * Attempts to load the on-disk state at the store's `path` into memory.
     *
     * Delegates to {@linkcode Store.reload} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * await store.reload({ ignoreDefaults: true });
     * ```
     *
     * @param options Options to change how the on-disk state is merged into the store.
     */
    reload(options?: ReloadOptions): Promise<void>;
    /**
     * Saves the store to disk at the store's `path`.
     *
     * Delegates to {@linkcode Store.save} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * await store.save();
     * ```
     */
    save(): Promise<void>;
    /**
     * Listen to changes on a store key.
     *
     * Delegates to {@linkcode Store.onKeyChange} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const unlisten = await store.onKeyChange<{ value: number }>('some-key', (value) => {
     *   console.log(value);
     * });
     * ```
     *
     * @param key The key to watch for changes.
     * @param cb Callback invoked with the new value, or `undefined` when the key was removed.
     * @returns A promise resolving to a function to unlisten to the event.
     */
    onKeyChange<T>(key: string, cb: (value: T | undefined) => void): Promise<UnlistenFn>;
    /**
     * Listen to changes on the store.
     *
     * Delegates to {@linkcode Store.onChange} on the underlying store, loading it first if needed.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * const unlisten = await store.onChange<{ value: number }>((key, value) => {
     *   console.log(key, value);
     * });
     * ```
     *
     * @param cb Callback invoked with the changed key and its new value, which is `undefined` when the key was removed.
     * @returns A promise resolving to a function to unlisten to the event.
     */
    onChange<T>(cb: (key: string, value: T | undefined) => void): Promise<UnlistenFn>;
    /**
     * Close the store and cleans up this resource from memory.
     * **You should not call any method on this object anymore and should drop any reference to it.**
     *
     * Delegates to {@linkcode Store.close} on the underlying store.
     * If the store was never loaded, this method does nothing.
     *
     * @example
     * ```typescript
     * import { LazyStore } from '@tauri-apps/plugin-store';
     * const store = new LazyStore('store.json');
     * await store.close();
     * ```
     */
    close(): Promise<void>;
}
/**
 * A key-value store persisted by the backend layer.
 *
 * The values are kept in memory and written to the store's file on {@linkcode Store.save},
 * and automatically after every modification unless auto save is disabled with
 * {@linkcode StoreOptions.autoSave}.
 *
 * @since 2.0.0
 */
export declare class Store extends Resource implements IStore {
    private constructor();
    /**
     * Create a new Store or load the existing store with the path.
     *
     * If the file at the given path does not exist yet, the store is created in memory with the
     * configured defaults and the file is only written on the first save.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * ```
     *
     * @param path Path to save the store in `app_data_dir`
     * @param options Store configuration options
     * @returns A promise resolving to the loaded store.
     */
    static load(path: string, options?: StoreOptions): Promise<Store>;
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
     * import { Store } from '@tauri-apps/plugin-store';
     * let store = await Store.get('store.json');
     * if (!store) {
     *   store = await Store.load('store.json');
     * }
     * ```
     *
     * @param path Path of the store.
     * @returns A promise resolving to the store instance, or `null` if it is not loaded.
     */
    static get(path: string): Promise<Store | null>;
    /**
     * Inserts a key-value pair into the store.
     *
     * A change event is emitted for the key and, unless auto save is disabled, the store is
     * scheduled to be written to disk.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * await store.set('some-key', { value: 5 });
     * ```
     *
     * @param key The key to insert the value at.
     * @param value The value to store, which must be serializable to JSON.
     */
    set(key: string, value: unknown): Promise<void>;
    /**
     * Returns the value for the given `key` or `undefined` if the key does not exist.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const value = await store.get<{ value: number }>('some-key');
     * ```
     *
     * @param key The key to read the value of.
     * @returns A promise resolving to the stored value, or `undefined` if the key does not exist.
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Returns `true` if the given `key` exists in the store.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const exists = await store.has('some-key');
     * ```
     *
     * @param key The key to check.
     * @returns A promise resolving to `true` if the key exists in the store.
     */
    has(key: string): Promise<boolean>;
    /**
     * Removes a key-value pair from the store.
     *
     * A change event is emitted when the key existed and, unless auto save is disabled, the store
     * is scheduled to be written to disk.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const removed = await store.delete('some-key');
     * ```
     *
     * @param key The key to remove.
     * @returns A promise resolving to `true` if the key existed and was removed.
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clears the store, removing all key-value pairs.
     *
     * Note: To clear the storage and reset it to its `default` value, use {@linkcode reset} instead.
     * A change event is emitted for every removed key.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * await store.clear();
     * ```
     */
    clear(): Promise<void>;
    /**
     * Resets the store to its `default` value.
     *
     * If no default value has been set, this method behaves identical to {@linkcode clear}.
     * A change event is emitted for every key whose value changed.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json', { defaults: { 'some-key': 0 } });
     * await store.reset();
     * ```
     */
    reset(): Promise<void>;
    /**
     * Returns a list of all keys in the store.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const keys = await store.keys();
     * ```
     *
     * @returns A promise resolving to the list of keys, in arbitrary order.
     */
    keys(): Promise<string[]>;
    /**
     * Returns a list of all values in the store.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const values = await store.values();
     * ```
     *
     * @returns A promise resolving to the list of values, in arbitrary order.
     */
    values<T>(): Promise<T[]>;
    /**
     * Returns a list of all entries in the store.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const entries = await store.entries();
     * ```
     *
     * @returns A promise resolving to the list of key-value pairs, in arbitrary order.
     */
    entries<T>(): Promise<Array<[key: string, value: T]>>;
    /**
     * Returns the number of key-value pairs in the store.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const length = await store.length();
     * ```
     *
     * @returns A promise resolving to the number of key-value pairs in the store.
     */
    length(): Promise<number>;
    /**
     * Attempts to load the on-disk state at the store's `path` into memory.
     *
     * This method is useful if the on-disk state was edited by the user and you want to synchronize the changes.
     *
     * Note:
     *   - This method loads the data and merges it with the current store,
     *     this behavior will be changed to resetting to default first and then merging with the on-disk state in v3,
     *     to fully match the store with the on-disk state, set {@linkcode ReloadOptions | ignoreDefaults} to `true`
     *   - This method does not emit change events.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * await store.reload({ ignoreDefaults: true });
     * ```
     *
     * @param options Options to change how the on-disk state is merged into the store.
     */
    reload(options?: ReloadOptions): Promise<void>;
    /**
     * Saves the store to disk at the store's `path`.
     *
     * Any pending auto save is cancelled, so the store is written exactly once by this call.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json', { autoSave: false });
     * await store.set('some-key', { value: 5 });
     * await store.save();
     * ```
     */
    save(): Promise<void>;
    /**
     * Listen to changes on a store key.
     *
     * The callback is only invoked for changes made to this store instance.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const unlisten = await store.onKeyChange<{ value: number }>('some-key', (value) => {
     *   console.log(value);
     * });
     * ```
     *
     * @param key The key to watch for changes.
     * @param cb Callback invoked with the new value, or `undefined` when the key was removed.
     * @returns A promise resolving to a function to unlisten to the event.
     *
     * @since 2.0.0
     */
    onKeyChange<T>(key: string, cb: (value: T | undefined) => void): Promise<UnlistenFn>;
    /**
     * Listen to changes on the store.
     *
     * The callback is only invoked for changes made to this store instance.
     *
     * @example
     * ```typescript
     * import { Store } from '@tauri-apps/plugin-store';
     * const store = await Store.load('store.json');
     * const unlisten = await store.onChange<{ value: number }>((key, value) => {
     *   console.log(key, value);
     * });
     * ```
     *
     * @param cb Callback invoked with the changed key and its new value, which is `undefined` when the key was removed.
     * @returns A promise resolving to a function to unlisten to the event.
     *
     * @since 2.0.0
     */
    onChange<T>(cb: (key: string, value: T | undefined) => void): Promise<UnlistenFn>;
}
interface IStore {
    /**
     * Inserts a key-value pair into the store.
     *
     * @param key
     * @param value
     * @returns
     */
    set(key: string, value: unknown): Promise<void>;
    /**
     * Returns the value for the given `key` or `undefined` if the key does not exist.
     *
     * @param key
     * @returns
     */
    get<T>(key: string): Promise<T | undefined>;
    /**
     * Returns `true` if the given `key` exists in the store.
     *
     * @param key
     * @returns
     */
    has(key: string): Promise<boolean>;
    /**
     * Removes a key-value pair from the store.
     *
     * @param key
     * @returns
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clears the store, removing all key-value pairs.
     *
     * Note: To clear the storage and reset it to its `default` value, use {@linkcode reset} instead.
     * @returns
     */
    clear(): Promise<void>;
    /**
     * Resets the store to its `default` value.
     *
     * If no default value has been set, this method behaves identical to {@linkcode clear}.
     * @returns
     */
    reset(): Promise<void>;
    /**
     * Returns a list of all keys in the store.
     *
     * @returns
     */
    keys(): Promise<string[]>;
    /**
     * Returns a list of all values in the store.
     *
     * @returns
     */
    values<T>(): Promise<T[]>;
    /**
     * Returns a list of all entries in the store.
     *
     * @returns
     */
    entries<T>(): Promise<Array<[key: string, value: T]>>;
    /**
     * Returns the number of key-value pairs in the store.
     *
     * @returns
     */
    length(): Promise<number>;
    /**
     * Attempts to load the on-disk state at the store's `path` into memory.
     *
     * This method is useful if the on-disk state was edited by the user and you want to synchronize the changes.
     *
     * Note:
     *   - This method loads the data and merges it with the current store,
     *     this behavior will be changed to resetting to default first and then merging with the on-disk state in v3,
     *     to fully match the store with the on-disk state, set {@linkcode ReloadOptions | ignoreDefaults} to `true`
     *   - This method does not emit change events.
     *
     * @returns
     */
    reload(options?: ReloadOptions): Promise<void>;
    /**
     * Saves the store to disk at the store's `path`.
     * @returns
     */
    save(): Promise<void>;
    /**
     * Listen to changes on a store key.
     * @param key
     * @param cb
     * @returns A promise resolving to a function to unlisten to the event.
     *
     * @since 2.0.0
     */
    onKeyChange<T>(key: string, cb: (value: T | undefined) => void): Promise<UnlistenFn>;
    /**
     * Listen to changes on the store.
     * @param cb
     * @returns A promise resolving to a function to unlisten to the event.
     *
     * @since 2.0.0
     */
    onChange<T>(cb: (key: string, value: T | undefined) => void): Promise<UnlistenFn>;
    /**
     * Close the store and cleans up this resource from memory.
     * **You should not call any method on this object anymore and should drop any reference to it.**
     */
    close(): Promise<void>;
}
/**
 * Options to change how a store is reloaded from its on-disk state.
 */
export type ReloadOptions = {
    /**
     * To fully match the store with the on-disk state, ignoring defaults
     */
    ignoreDefaults?: boolean;
};
export {};
