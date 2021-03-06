import { Poll } from '@jupyterlab/coreutils';
import { IIterator } from '@phosphor/algorithm';
import { ISignal } from '@phosphor/signaling';
import { ServerConnection } from '..';
import { TerminalSession } from './terminal';
/**
 * A terminal session manager.
 */
export declare class TerminalManager implements TerminalSession.IManager {
    /**
     * Construct a new terminal manager.
     */
    constructor(options?: TerminalManager.IOptions);
    /**
     * A signal emitted when the running terminals change.
     */
    readonly runningChanged: ISignal<this, TerminalSession.IModel[]>;
    /**
     * Test whether the terminal manager is disposed.
     */
    readonly isDisposed: boolean;
    /**
     * The server settings of the manager.
     */
    readonly serverSettings: ServerConnection.ISettings;
    /**
     * Test whether the manager is ready.
     */
    readonly isReady: boolean;
    /**
     * Dispose of the resources used by the manager.
     */
    dispose(): void;
    /**
     * A promise that fulfills when the manager is ready.
     */
    readonly ready: Promise<void>;
    /**
     * Whether the terminal service is available.
     */
    isAvailable(): boolean;
    /**
     * Create an iterator over the most recent running terminals.
     *
     * @returns A new iterator over the running terminals.
     */
    running(): IIterator<TerminalSession.IModel>;
    /**
     * Create a new terminal session.
     *
     * @param options - The options used to connect to the session.
     *
     * @returns A promise that resolves with the terminal instance.
     *
     * #### Notes
     * The manager `serverSettings` will be used unless overridden in the
     * options.
     */
    startNew(options?: TerminalSession.IOptions): Promise<TerminalSession.ISession>;
    connectTo(name: string, options?: TerminalSession.IOptions): Promise<TerminalSession.ISession>;
    /**
     * Force a refresh of the running sessions.
     *
     * #### Notes
     * This is intended to be called only in response to a user action,
     * since the manager maintains its internal state.
     */
    refreshRunning(): Promise<void>;
    /**
     * Shut down a terminal session by name.
     */
    shutdown(name: string): Promise<void>;
    /**
     * Shut down all terminal sessions.
     *
     * @returns A promise that resolves when all of the sessions are shut down.
     */
    shutdownAll(): Promise<void>;
    /**
     * Execute a request to the server to poll running terminals and update state.
     */
    protected requestRunning(): Promise<void>;
    /**
     * Get a set of options to pass.
     */
    private _getOptions;
    /**
     * Handle a session starting.
     */
    private _onStarted;
    /**
     * Handle a session terminating.
     */
    private _onTerminated;
    private _isDisposed;
    private _isReady;
    private _models;
    private _pollModels;
    private _sessions;
    private _ready;
    private _runningChanged;
}
/**
 * The namespace for TerminalManager statics.
 */
export declare namespace TerminalManager {
    /**
     * The options used to initialize a terminal manager.
     */
    interface IOptions {
        /**
         * The server settings used by the manager.
         */
        serverSettings?: ServerConnection.ISettings;
        /**
         * When the manager stops polling the API. Defaults to `when-hidden`.
         */
        standby?: Poll.Standby;
    }
}
