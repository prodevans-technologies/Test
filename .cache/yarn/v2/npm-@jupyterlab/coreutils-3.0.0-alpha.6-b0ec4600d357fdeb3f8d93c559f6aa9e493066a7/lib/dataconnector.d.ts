import { IDataConnector } from './interfaces';
/**
 * An abstract class that adheres to the data connector interface.
 *
 * @typeparam T - The basic entity response type a service's connector.
 *
 * @typeparam U - The basic entity request type, which is conventionally the
 * same as the response type but may be different if a service's implementation
 * requires input data to be different from output responses. Defaults to `T`.
 *
 * @typeparam V - The basic token applied to a request, conventionally a string
 * ID or filter, but may be set to a different type when an implementation
 * requires it. Defaults to `string`.
 *
 * #### Notes
 * The only abstract method in this class is the `fetch` method, which must be
 * reimplemented by all subclasses. The `remove` and `save` methods have a
 * default implementation that returns a promise that will always reject. This
 * class is a convenience superclass for connectors that only need to `fetch`.
 */
export declare abstract class DataConnector<T, U = T, V = string> implements IDataConnector<T, U, V> {
    /**
     * Retrieve an item from the data connector.
     *
     * @param id - The identifier used to retrieve an item.
     *
     * @returns A promise that resolves with a data payload if available.
     *
     * #### Notes
     * The promise returned by this method may be rejected if an error occurs in
     * retrieving the data. Nonexistence of an `id` will succeed with `undefined`.
     */
    abstract fetch(id: V): Promise<T | undefined>;
    /**
     * Retrieve the list of items available from the data connector.
     *
     * @param query - The optional query filter to apply to the connector request.
     *
     * @returns A promise that always rejects with an error.
     *
     * #### Notes
     * Subclasses should reimplement if they support a back-end that can list.
     */
    list(query?: any): Promise<{
        ids: V[];
        values: T[];
    }>;
    /**
     * Remove a value using the data connector.
     *
     * @param id - The identifier for the data being removed.
     *
     * @returns A promise that always rejects with an error.
     *
     * #### Notes
     * Subclasses should reimplement if they support a back-end that can remove.
     */
    remove(id: V): Promise<any>;
    /**
     * Save a value using the data connector.
     *
     * @param id - The identifier for the data being saved.
     *
     * @param value - The data being saved.
     *
     * @returns A promise that always rejects with an error.
     *
     * #### Notes
     * Subclasses should reimplement if they support a back-end that can save.
     */
    save(id: V, value: U): Promise<any>;
}
