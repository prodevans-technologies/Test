import { DataConnector, ISettingRegistry } from '@jupyterlab/coreutils';
import { ServerConnection } from '../serverconnection';
/**
 * The settings API service manager.
 */
export declare class SettingManager extends DataConnector<ISettingRegistry.IPlugin, string> {
    /**
     * Create a new setting manager.
     */
    constructor(options?: SettingManager.IOptions);
    /**
     * The server settings used to make API requests.
     */
    readonly serverSettings: ServerConnection.ISettings;
    /**
     * Fetch a plugin's settings.
     *
     * @param id - The plugin's ID.
     *
     * @returns A promise that resolves if successful.
     */
    fetch(id: string): Promise<ISettingRegistry.IPlugin>;
    /**
     * Fetch the list of all plugin setting bundles.
     *
     * @returns A promise that resolves if successful.
     */
    list(): Promise<{
        ids: string[];
        values: ISettingRegistry.IPlugin[];
    }>;
    /**
     * Save a plugin's settings.
     *
     * @param id - The plugin's ID.
     *
     * @param raw - The user setting values as a raw string of JSON with comments.
     *
     * @returns A promise that resolves if successful.
     */
    save(id: string, raw: string): Promise<void>;
}
/**
 * A namespace for `SettingManager` statics.
 */
export declare namespace SettingManager {
    /**
     * The instantiation options for a setting manager.
     */
    interface IOptions {
        /**
         * The server settings used to make API requests.
         */
        serverSettings?: ServerConnection.ISettings;
    }
}
/**
 * A namespace for setting API interfaces.
 */
export declare namespace Setting {
    /**
     * The interface for the setting system manager.
     */
    interface IManager extends SettingManager {
    }
}
