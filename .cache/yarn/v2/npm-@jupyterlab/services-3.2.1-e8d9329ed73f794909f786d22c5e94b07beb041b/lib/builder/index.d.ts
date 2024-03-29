import { ServerConnection } from '../serverconnection';
/**
 * The build API service manager.
 */
export declare class BuildManager {
    /**
     * Create a new setting manager.
     */
    constructor(options?: BuildManager.IOptions);
    /**
     * The server settings used to make API requests.
     */
    readonly serverSettings: ServerConnection.ISettings;
    /**
     * Test whether the build service is available.
     */
    readonly isAvailable: boolean;
    /**
     * Test whether to check build status automatically.
     */
    readonly shouldCheck: boolean;
    /**
     * Get whether the application should be built.
     */
    getStatus(): Promise<BuildManager.IStatus>;
    /**
     * Build the application.
     */
    build(): Promise<void>;
    /**
     * Cancel an active build.
     */
    cancel(): Promise<void>;
}
/**
 * A namespace for `BuildManager` statics.
 */
export declare namespace BuildManager {
    /**
     * The instantiation options for a setting manager.
     */
    interface IOptions {
        /**
         * The server settings used to make API requests.
         */
        serverSettings?: ServerConnection.ISettings;
    }
    /**
     * The build status response from the server.
     */
    interface IStatus {
        /**
         * Whether a build is needed.
         */
        readonly status: 'stable' | 'needed' | 'building';
        /**
         * The message associated with the build status.
         */
        readonly message: string;
    }
}
/**
 * A namespace for builder API interfaces.
 */
export declare namespace Builder {
    /**
     * The interface for the build manager.
     */
    interface IManager extends BuildManager {
    }
}
