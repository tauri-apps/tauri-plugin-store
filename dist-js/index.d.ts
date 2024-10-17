import { type UnlistenFn } from '@tauri-apps/api/event';
import { Resource } from '@tauri-apps/api/core';
/**
 * Options to create a store
 */
export type StoreOptions = {
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
};
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
 * import { getStore } from '@tauri-apps/api/store';
 * const store = await getStore('store.json');
 * ```
 *
 * @param path Path of the store.
 */
export declare function getStore(path: string): Promise<Store | null>;
/**
 * A lazy loaded key-value store persisted by the backend layer.
 */
export declare class LazyStore implements IStore {
    private readonly path;
    private readonly options?;
    private _store?;
    private get store();
    /**
     * Note that the options are not applied if someone else already created the store
     * @param path Path to save the store in `app_data_dir`
     * @param options Store configuration options
     */
    constructor(path: string, options?: StoreOptions | undefined);
    /**
     * Init/load the store if it's not loaded already
     */
    init(): Promise<void>;
    set(key: string, value: unknown): Promise<void>;
    get<T>(key: string): Promise<T | undefined>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    reset(): Promise<void>;
    keys(): Promise<string[]>;
    values<T>(): Promise<T[]>;
    entries<T>(): Promise<Array<[key: string, value: T]>>;
    length(): Promise<number>;
    reload(): Promise<void>;
    save(): Promise<void>;
    onKeyChange<T>(key: string, cb: (value: T | undefined) => void): Promise<UnlistenFn>;
    onChange<T>(cb: (key: string, value: T | undefined) => void): Promise<UnlistenFn>;
    close(): Promise<void>;
}
/**
 * A key-value store persisted by the backend layer.
 */
export declare class Store extends Resource implements IStore {
    private constructor();
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
     * import { Store } from '@tauri-apps/api/store';
     * let store = await Store.get('store.json');
     * if (!store) {
     *   store = await Store.load('store.json');
     * }
     * ```
     *
     * @param path Path of the store.
     */
    static get(path: string): Promise<Store | null>;
    set(key: string, value: unknown): Promise<void>;
    get<T>(key: string): Promise<T | undefined>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    reset(): Promise<void>;
    keys(): Promise<string[]>;
    values<T>(): Promise<T[]>;
    entries<T>(): Promise<Array<[key: string, value: T]>>;
    length(): Promise<number>;
    reload(): Promise<void>;
    save(): Promise<void>;
    onKeyChange<T>(key: string, cb: (value: T | undefined) => void): Promise<UnlistenFn>;
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
     * Note: This method does not emit change events.
     * @returns
     */
    reload(): Promise<void>;
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
export {};
