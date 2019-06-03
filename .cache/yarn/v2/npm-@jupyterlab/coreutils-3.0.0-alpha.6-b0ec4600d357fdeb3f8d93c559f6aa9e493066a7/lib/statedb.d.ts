import { ReadonlyJSONObject, ReadonlyJSONValue, Token } from '@phosphor/coreutils';
import { ISignal } from '@phosphor/signaling';
import { IDataConnector } from './interfaces';
/**
 * The default state database token.
 */
export declare const IStateDB: Token<IStateDB<ReadonlyJSONValue>>;
/**
 * The description of a state database.
 */
export interface IStateDB<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDataConnector<T> {
    /**
     * The maximum allowed length of the data after it has been serialized.
     */
    readonly maxLength: number;
    /**
     * The namespace prefix for all state database entries.
     *
     * #### Notes
     * This value should be set at instantiation and will only be used
     * internally by a state database. That means, for example, that an
     * app could have multiple, mutually exclusive state databases.
     */
    readonly namespace: string;
    /**
     * Return a serialized copy of the state database's entire contents.
     *
     * @returns A promise that bears the database contents as JSON.
     */
    toJSON(): Promise<{
        [id: string]: T;
    }>;
}
/**
 * The default concrete implementation of a state database.
 */
export declare class StateDB<T extends ReadonlyJSONValue = ReadonlyJSONValue> implements IStateDB<T> {
    /**
     * Create a new state database.
     *
     * @param options - The instantiation options for a state database.
     */
    constructor(options: StateDB.IOptions);
    /**
     * A signal that emits the change type any time a value changes.
     */
    readonly changed: ISignal<this, StateDB.Change>;
    /**
     * The maximum allowed length of the data after it has been serialized.
     */
    readonly maxLength: number;
    /**
     * The namespace prefix for all state database entries.
     *
     * #### Notes
     * This value should be set at instantiation and will only be used internally
     * by a state database. That means, for example, that an app could have
     * multiple, mutually exclusive state databases.
     */
    readonly namespace: string;
    /**
     * Clear the entire database.
     */
    clear(silent?: boolean): Promise<void>;
    /**
     * Retrieve a saved bundle from the database.
     *
     * @param id - The identifier used to retrieve a data bundle.
     *
     * @returns A promise that bears a data payload if available.
     *
     * #### Notes
     * The `id` values of stored items in the state database are formatted:
     * `'namespace:identifier'`, which is the same convention that command
     * identifiers in JupyterLab use as well. While this is not a technical
     * requirement for `fetch()`, `remove()`, and `save()`, it *is* necessary for
     * using the `list(namespace: string)` method.
     *
     * The promise returned by this method may be rejected if an error occurs in
     * retrieving the data. Non-existence of an `id` will succeed with the `value`
     * `undefined`.
     */
    fetch(id: string): Promise<T>;
    /**
     * Retrieve all the saved bundles for a namespace.
     *
     * @param filter - The namespace prefix to retrieve.
     *
     * @returns A promise that bears a collection of payloads for a namespace.
     *
     * #### Notes
     * Namespaces are entirely conventional entities. The `id` values of stored
     * items in the state database are formatted: `'namespace:identifier'`, which
     * is the same convention that command identifiers in JupyterLab use as well.
     *
     * If there are any errors in retrieving the data, they will be logged to the
     * console in order to optimistically return any extant data without failing.
     * This promise will always succeed.
     */
    list(namespace: string): Promise<{
        ids: string[];
        values: T[];
    }>;
    /**
     * Remove a value from the database.
     *
     * @param id - The identifier for the data being removed.
     *
     * @returns A promise that is rejected if remove fails and succeeds otherwise.
     */
    remove(id: string): Promise<void>;
    /**
     * Save a value in the database.
     *
     * @param id - The identifier for the data being saved.
     *
     * @param value - The data being saved.
     *
     * @returns A promise that is rejected if saving fails and succeeds otherwise.
     *
     * #### Notes
     * The `id` values of stored items in the state database are formatted:
     * `'namespace:identifier'`, which is the same convention that command
     * identifiers in JupyterLab use as well. While this is not a technical
     * requirement for `fetch()`, `remove()`, and `save()`, it *is* necessary for
     * using the `list(namespace: string)` method.
     */
    save(id: string, value: T): Promise<void>;
    /**
     * Return a serialized copy of the state database's entire contents.
     *
     * @returns A promise that bears the database contents as JSON.
     */
    toJSON(): Promise<{
        [id: string]: T;
    }>;
    /**
     * Clear the entire database.
     *
     * #### Notes
     * Unlike the public `clear` method, this method is synchronous.
     */
    private _clear;
    /**
     * Fetch a value from the database.
     *
     * #### Notes
     * Unlike the public `fetch` method, this method is synchronous.
     */
    private _fetch;
    /**
     * Merge data into the state database.
     */
    private _merge;
    /**
     * Overwrite the entire database with new contents.
     */
    private _overwrite;
    /**
     * Remove a key in the database.
     *
     * #### Notes
     * Unlike the public `remove` method, this method is synchronous.
     */
    private _remove;
    /**
     * Save a key and its value in the database.
     *
     * #### Notes
     * Unlike the public `save` method, this method is synchronous.
     */
    private _save;
    private _changed;
    private _ready;
    private _window;
}
/**
 * A namespace for StateDB statics.
 */
export declare namespace StateDB {
    /**
     * A state database change.
     */
    type Change = {
        /**
         * The key of the database item that was changed.
         *
         * #### Notes
         * This field is set to `null` for global changes (i.e. `clear`).
         */
        id: string | null;
        /**
         * The type of change.
         */
        type: 'clear' | 'remove' | 'save';
    };
    /**
     * A data transformation that can be applied to a state database.
     */
    type DataTransform = {
        type: 'cancel' | 'clear' | 'merge' | 'overwrite';
        /**
         * The contents of the change operation.
         */
        contents: ReadonlyJSONObject | null;
    };
    /**
     * The instantiation options for a state database.
     */
    interface IOptions {
        /**
         * The namespace prefix for all state database entries.
         */
        namespace: string;
        /**
         * An optional promise that resolves with a data transformation that is
         * applied to the database contents before the database begins resolving
         * client requests.
         */
        transform?: Promise<DataTransform>;
        /**
         * An optional name for the application window.
         *
         * #### Notes
         * In environments where multiple windows can instantiate a state database,
         * a window name is necessary to prefix all keys that are stored within the
         * local storage that is shared by all windows. In JupyterLab, this window
         * name is generated by the `IWindowResolver` extension.
         */
        windowName?: string;
    }
}
