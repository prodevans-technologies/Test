import { JSONObject, JSONValue } from '@phosphor/coreutils';
import { ServerConnection } from '..';
/**
 * A Configurable data section.
 */
export interface IConfigSection {
    /**
     * The data for this section.
     */
    readonly data: JSONObject;
    /**
     * Modify the stored config values.
     *
     * #### Notes
     * Updates the local data immediately, sends the change to the server,
     * and updates the local data with the response, and fulfils the promise
     * with that data.
     */
    update(newdata: JSONObject): Promise<JSONObject>;
    /**
     * The server settings for the section.
     */
    readonly serverSettings: ServerConnection.ISettings;
}
/**
 * The namespace for ConfigSection statics.
 */
export declare namespace ConfigSection {
    /**
     * Create a config section.
     *
     * @returns A Promise that is fulfilled with the config section is loaded.
     */
    function create(options: ConfigSection.IOptions): Promise<IConfigSection>;
    /**
     * The options used to create a config section.
     */
    interface IOptions {
        /**
         * The section name.
         */
        name: string;
        /**
         * The optional server settings.
         */
        serverSettings?: ServerConnection.ISettings;
    }
}
/**
 * Configurable object with defaults.
 */
export declare class ConfigWithDefaults {
    /**
     * Create a new config with defaults.
     */
    constructor(options: ConfigWithDefaults.IOptions);
    /**
     * Get data from the config section or fall back to defaults.
     */
    get(key: string): JSONValue;
    /**
     * Set a config value.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/config).
     *
     * The promise is fulfilled on a valid response and rejected otherwise.
     *
     * Sends the update to the server, and changes our local copy of the data
     * immediately.
     */
    set(key: string, value: JSONValue): Promise<JSONValue>;
    /**
     * Get data from the Section with our classname, if available.
     *
     * #### Notes
     * If we have no classname, get all of the data in the Section
     */
    private _classData;
    private _section;
    private _defaults;
    private _className;
}
/**
 * A namespace for ConfigWithDefaults statics.
 */
export declare namespace ConfigWithDefaults {
    /**
     * The options used to initialize a ConfigWithDefaults object.
     */
    interface IOptions {
        /**
         * The configuration section.
         */
        section: IConfigSection;
        /**
         * The default values.
         */
        defaults?: JSONObject;
        /**
         * The optional classname namespace.
         */
        className?: string;
    }
}
