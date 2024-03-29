import { Poll } from '@jupyterlab/coreutils';
import { IIterator } from '@phosphor/algorithm';
import { ISignal } from '@phosphor/signaling';
import { Kernel } from '../kernel';
import { ServerConnection } from '../serverconnection';
import { Session } from './session';
/**
 * An implementation of a session manager.
 */
export declare class SessionManager implements Session.IManager {
    /**
     * Construct a new session manager.
     *
     * @param options - The default options for each session.
     */
    constructor(options?: SessionManager.IOptions);
    /**
     * A signal emitted when the kernel specs change.
     */
    readonly specsChanged: ISignal<this, Kernel.ISpecModels>;
    /**
     * A signal emitted when the running sessions change.
     */
    readonly runningChanged: ISignal<this, Session.IModel[]>;
    /**
     * Test whether the manager is disposed.
     */
    readonly isDisposed: boolean;
    /**
     * The server settings of the manager.
     */
    readonly serverSettings: ServerConnection.ISettings;
    /**
     * Get the most recently fetched kernel specs.
     */
    readonly specs: Kernel.ISpecModels | null;
    /**
     * Test whether the manager is ready.
     */
    readonly isReady: boolean;
    /**
     * A promise that fulfills when the manager is ready.
     */
    readonly ready: Promise<void>;
    /**
     * Dispose of the resources used by the manager.
     */
    dispose(): void;
    /**
     * Create an iterator over the most recent running sessions.
     *
     * @returns A new iterator over the running sessions.
     */
    running(): IIterator<Session.IModel>;
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
     * Force a refresh of the running sessions.
     *
     * @returns A promise that with the list of running sessions.
     *
     * #### Notes
     * This is not typically meant to be called by the user, since the
     * manager maintains its own internal state.
     */
    refreshRunning(): Promise<void>;
    /**
     * Start a new session.  See also [[startNewSession]].
     *
     * @param options - Overrides for the default options, must include a `path`.
     */
    startNew(options: Session.IOptions): Promise<Session.ISession>;
    /**
     * Find a session associated with a path and stop it if it is the only session
     * using that kernel.
     *
     * @param path - The path in question.
     *
     * @returns A promise that resolves when the relevant sessions are stopped.
     */
    stopIfNeeded(path: string): Promise<void>;
    /**
     * Find a session by id.
     */
    findById(id: string): Promise<Session.IModel>;
    /**
     * Find a session by path.
     */
    findByPath(path: string): Promise<Session.IModel>;
    connectTo(model: Session.IModel): Session.ISession;
    /**
     * Shut down a session by id.
     */
    shutdown(id: string): Promise<void>;
    /**
     * Shut down all sessions.
     *
     * @returns A promise that resolves when all of the kernels are shut down.
     */
    shutdownAll(): Promise<void>;
    /**
     * Execute a request to the server to poll running kernels and update state.
     */
    protected requestRunning(): Promise<void>;
    /**
     * Execute a request to the server to poll specs and update state.
     */
    protected requestSpecs(): Promise<void>;
    /**
     * Handle a session terminating.
     */
    private _onTerminated;
    /**
     * Handle a session starting.
     */
    private _onStarted;
    /**
     * Handle a change to a session.
     */
    private _onChanged;
    private _isDisposed;
    private _isReady;
    private _models;
    private _pollModels;
    private _pollSpecs;
    private _ready;
    private _runningChanged;
    private _sessions;
    private _specs;
    private _specsChanged;
}
/**
 * The namespace for `SessionManager` class statics.
 */
export declare namespace SessionManager {
    /**
     * The options used to initialize a SessionManager.
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
