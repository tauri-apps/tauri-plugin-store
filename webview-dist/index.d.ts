export default class Store {
    path: string;
    constructor(path: string);
    set(key: string, value: unknown): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    onKeyChange<T>(key: string, cb: (value: T | null) => void): void;
    onChange(cb: (key: string, value: unknown) => void): void;
}
