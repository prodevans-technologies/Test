import { Poll } from '@jupyterlab/coreutils';
import { IIterator } from '@phosphor/algorithm';
import { ISignal } from '@phosphor/signaling';
import { ServerConnection } from '..';
import { Kernel } from './kernel';
/**
 * An implementation of a kernel manager.
 */
export declare class KernelManager implements Kernel.IManager {
    /**
     * Construct a new kernel manager.
     *
     * @param options - The default options for kernel.
     */
    constructor(options?: KernelManager.IOptions);
    /**
     * The server settings for the manager.
     */
    readonly serverSettings: ServerConnection.ISettings;
    /**
     * Test whether the terminal manager is disposed.
     */
    readonly isDisposed: boolean;
    /**
     * Test whether the manager is ready.
     */
    readonly isReady: boolean;
    /**
     * A promise that fulfills when the manager is ready.
     */
    readonly ready: Promise<void>;
    /**
     * A signal emitted when the running kernels change.
     */
    readonly runningChanged: ISignal<this, Kernel.IModel[]>;
    /**
     * Get the most recently fetched kernel specs.
     */
    readonly specs: Kernel.ISpecModels | null;
    /**
     * A signal emitted when the specs change.
     */
    readonly specsChanged: ISignal<this, Kernel.ISpecModels>;
    /**
     * Connect to an existing kernel.
     *
     * @param model - The model of the target kernel.
     *
     * @returns A promise that resolves with the new kernel instance.
     */
    connectTo(model: Kernel.IModel): Kernel.IKernel;
    /**
     * Dispose of the resources used by the manager.
     */
    dispose(): void;
    /**
     * Find a kernel by id.
     *
     * @param id - The id of the target kernel.
     *
     * @returns A promise that resolves with the kernel's model.
     */
    findById(id: string): Promise<Kernel.IModel>;
    /**
     * Force a refresh of the running kernels.
     *
     * @returns A promise that resolves when the running list has been refreshed.
     *
     * #### Notes
     * This is not typically meant to be called by the user, since the
     * manager maintains its own internal state.
     */
    refreshRunning(): Promise<void>;
    /**
     * Force a refresh of the specs from the server.
     *
     * @returns A promise that resolves when the specs are fetched.
     *
     * #### Notes
     * This is intended to be called only in response to a user action,
     * since the manager maintains its internal state.
     */
    refreshSpecs(): Promise<void>;
    /**
     * Create an iterator over the most recent running kernels.
     *
     * @returns A new iterator over the running kernels.
     */
    running(): IIterator<Kernel.IModel>;
    /**
     * Shut down a kernel by id.
     *
     * @param id - The id of the target kernel.
     *
     * @returns A promise that resolves when the operation is complete.
     *
     * #### Notes
     * This will emit [[runningChanged]] if the running kernels list
     * changes.
     */
    shutdown(id: string): Promise<void>;
    /**
     * Shut down all kernels.
     *
     * @returns A promise that resolves when all of the kernels are shut down.
     */
    shutdownAll(): Promise<void>;
    /**
     * Start a new kernel.
     *
     * @param options - The kernel options to use.
     *
     * @returns A promise that resolves with the kernel instance.
     *
     * #### Notes
     * The manager `serverSettings` will be always be used.
     */
    startNew(options?: Kernel.IOptions): Promise<Kernel.IKernel>;
    /**
     * Execute a request to the server to poll running kernels and update state.
     */
    protected requestRunning(): Promise<void>;
    /**
     * Execute a request to the server to poll specs and update state.
     */
    protected requestSpecs(): Promise<void>;
    /**
     * Handle a kernel starting.
     */
    private _onStarted;
    /**
     * Handle a kernel terminating.
     */
    private _onTerminated;
    private _isDisposed;
    private _isReady;
    private _kernels;
    private _models;
    private _pollModels;
    private _pollSpecs;
    private _ready;
    private _runningChanged;
    private _specs;
    private _specsChanged;
}
/**
 * The namespace for `KernelManager` class statics.
 */
export declare namespace KernelManager {
    /**
     * The options used to initialize a KernelManager.
     */
    interface IOptions {
        /**
         * The server settings for the manager.
         */
        serverSettings?: ServerConnection.ISettings;
        /**
         * When the manager stops polling the API. Defaults to `when-hidden`.
         */
        standby?: Poll.Standby;
    }
}
