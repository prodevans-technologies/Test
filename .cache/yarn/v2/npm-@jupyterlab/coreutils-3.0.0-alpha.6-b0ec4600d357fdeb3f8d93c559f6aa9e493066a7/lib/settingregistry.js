"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const json = __importStar(require("comment-json"));
const coreutils_1 = require("@phosphor/coreutils");
const disposable_1 = require("@phosphor/disposable");
const signaling_1 = require("@phosphor/signaling");
const plugin_schema_json_1 = __importDefault(require("./plugin-schema.json"));
/**
 * An alias for the JSON deep copy function.
 */
const copy = coreutils_1.JSONExt.deepCopy;
/**
 * The default number of milliseconds before a `load()` call to the registry
 * will wait before timing out if it requires a transformation that has not been
 * registered.
 */
const DEFAULT_TRANSFORM_TIMEOUT = 7000;
/**
 * The ASCII record separator character.
 */
const RECORD_SEPARATOR = String.fromCharCode(30);
/* tslint:disable */
/**
 * The setting registry token.
 */
exports.ISettingRegistry = new coreutils_1.Token('@jupyterlab/coreutils:ISettingRegistry');
/**
 * The default implementation of a schema validator.
 */
class DefaultSchemaValidator {
    /**
     * Instantiate a schema validator.
     */
    constructor() {
        this._composer = new ajv_1.default({ useDefaults: true });
        this._validator = new ajv_1.default();
        this._composer.addSchema(plugin_schema_json_1.default, 'jupyterlab-plugin-schema');
        this._validator.addSchema(plugin_schema_json_1.default, 'jupyterlab-plugin-schema');
    }
    /**
     * Validate a plugin's schema and user data; populate the `composite` data.
     *
     * @param plugin - The plugin being validated. Its `composite` data will be
     * populated by reference.
     *
     * @param populate - Whether plugin data should be populated, defaults to
     * `true`.
     *
     * @return A list of errors if either the schema or data fail to validate or
     * `null` if there are no errors.
     */
    validateData(plugin, populate = true) {
        const validate = this._validator.getSchema(plugin.id);
        const compose = this._composer.getSchema(plugin.id);
        // If the schemas do not exist, add them to the validator and continue.
        if (!validate || !compose) {
            if (plugin.schema.type !== 'object') {
                const keyword = 'schema';
                const message = `Setting registry schemas' root-level type must be ` +
                    `'object', rejecting type: ${plugin.schema.type}`;
                return [{ dataPath: 'type', keyword, schemaPath: '', message }];
            }
            const errors = this._addSchema(plugin.id, plugin.schema);
            return errors || this.validateData(plugin);
        }
        // Parse the raw commented JSON into a user map.
        let user;
        try {
            const strip = true;
            user = json.parse(plugin.raw, null, strip);
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                return [
                    {
                        dataPath: '',
                        keyword: 'syntax',
                        schemaPath: '',
                        message: error.message
                    }
                ];
            }
            const { column, description } = error;
            const line = error.lineNumber;
            return [
                {
                    dataPath: '',
                    keyword: 'parse',
                    schemaPath: '',
                    message: `${description} (line ${line} column ${column})`
                }
            ];
        }
        if (!validate(user)) {
            return validate.errors;
        }
        // Copy the user data before merging defaults into composite map.
        const composite = copy(user);
        if (!compose(composite)) {
            return compose.errors;
        }
        if (populate) {
            plugin.data = { composite, user };
        }
        return null;
    }
    /**
     * Add a schema to the validator.
     *
     * @param plugin - The plugin ID.
     *
     * @param schema - The schema being added.
     *
     * @return A list of errors if the schema fails to validate or `null` if there
     * are no errors.
     *
     * #### Notes
     * It is safe to call this function multiple times with the same plugin name.
     */
    _addSchema(plugin, schema) {
        const composer = this._composer;
        const validator = this._validator;
        const validate = validator.getSchema('jupyterlab-plugin-schema');
        // Validate against the main schema.
        if (!validate(schema)) {
            return validate.errors;
        }
        // Validate against the JSON schema meta-schema.
        if (!validator.validateSchema(schema)) {
            return validator.errors;
        }
        // Remove if schema already exists.
        composer.removeSchema(plugin);
        validator.removeSchema(plugin);
        // Add schema to the validator and composer.
        composer.addSchema(schema, plugin);
        validator.addSchema(schema, plugin);
        return null;
    }
}
exports.DefaultSchemaValidator = DefaultSchemaValidator;
/**
 * The default concrete implementation of a setting registry.
 */
class SettingRegistry {
    /**
     * Create a new setting registry.
     */
    constructor(options) {
        /**
         * The schema of the setting registry.
         */
        this.schema = plugin_schema_json_1.default;
        /**
         * The collection of setting registry plugins.
         */
        this.plugins = Object.create(null);
        this._pluginChanged = new signaling_1.Signal(this);
        this._ready = Promise.resolve();
        this._transformers = Object.create(null);
        this.connector = options.connector;
        this.validator = options.validator || new DefaultSchemaValidator();
        this._timeout = options.timeout || DEFAULT_TRANSFORM_TIMEOUT;
        // Preload with any available data at instantiation-time.
        if (options.plugins) {
            this._ready = this._preload(options.plugins);
        }
    }
    /**
     * A signal that emits the name of a plugin when its settings change.
     */
    get pluginChanged() {
        return this._pluginChanged;
    }
    /**
     * Get an individual setting.
     *
     * @param plugin - The name of the plugin whose settings are being retrieved.
     *
     * @param key - The name of the setting being retrieved.
     *
     * @returns A promise that resolves when the setting is retrieved.
     */
    get(plugin, key) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for data preload before allowing normal operation.
            yield this._ready;
            const plugins = this.plugins;
            if (plugin in plugins) {
                const { composite, user } = plugins[plugin].data;
                return {
                    composite: key in composite ? copy(composite[key]) : undefined,
                    user: key in user ? copy(user[key]) : undefined
                };
            }
            return this.load(plugin).then(() => this.get(plugin, key));
        });
    }
    /**
     * Load a plugin's settings into the setting registry.
     *
     * @param plugin - The name of the plugin whose settings are being loaded.
     *
     * @returns A promise that resolves with a plugin settings object or rejects
     * if the plugin is not found.
     */
    load(plugin) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for data preload before allowing normal operation.
            yield this._ready;
            const plugins = this.plugins;
            const registry = this;
            // If the plugin exists, resolve.
            if (plugin in plugins) {
                return new Settings({ plugin: plugins[plugin], registry });
            }
            // If the plugin needs to be loaded from the data connector, fetch.
            return this.reload(plugin);
        });
    }
    /**
     * Reload a plugin's settings into the registry even if they already exist.
     *
     * @param plugin - The name of the plugin whose settings are being reloaded.
     *
     * @returns A promise that resolves with a plugin settings object or rejects
     * with a list of `ISchemaValidator.IError` objects if it fails.
     */
    reload(plugin) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for data preload before allowing normal operation.
            yield this._ready;
            const fetched = yield this.connector.fetch(plugin);
            const plugins = this.plugins;
            const registry = this;
            yield this._load(yield this._transform('fetch', fetched));
            this._pluginChanged.emit(plugin);
            return new Settings({ plugin: plugins[plugin], registry });
        });
    }
    /**
     * Remove a single setting in the registry.
     *
     * @param plugin - The name of the plugin whose setting is being removed.
     *
     * @param key - The name of the setting being removed.
     *
     * @returns A promise that resolves when the setting is removed.
     */
    remove(plugin, key) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for data preload before allowing normal operation.
            yield this._ready;
            const plugins = this.plugins;
            if (!(plugin in plugins)) {
                return;
            }
            const raw = json.parse(plugins[plugin].raw, null, true);
            // Delete both the value and any associated comment.
            delete raw[key];
            delete raw[`// ${key}`];
            plugins[plugin].raw = Private.annotatedPlugin(plugins[plugin], raw);
            return this._save(plugin);
        });
    }
    /**
     * Set a single setting in the registry.
     *
     * @param plugin - The name of the plugin whose setting is being set.
     *
     * @param key - The name of the setting being set.
     *
     * @param value - The value of the setting being set.
     *
     * @returns A promise that resolves when the setting has been saved.
     *
     */
    set(plugin, key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for data preload before allowing normal operation.
            yield this._ready;
            const plugins = this.plugins;
            if (!(plugin in plugins)) {
                return this.load(plugin).then(() => this.set(plugin, key, value));
            }
            // Parse the raw JSON string removing all comments and return an object.
            const raw = json.parse(plugins[plugin].raw, null, true);
            plugins[plugin].raw = Private.annotatedPlugin(plugins[plugin], Object.assign({}, raw, { [key]: value }));
            return this._save(plugin);
        });
    }
    /**
     * Register a plugin transform function to act on a specific plugin.
     *
     * @param plugin - The name of the plugin whose settings are transformed.
     *
     * @param transforms - The transform functions applied to the plugin.
     *
     * @returns A disposable that removes the transforms from the registry.
     *
     * #### Notes
     * - `compose` transformations: The registry automatically overwrites a
     * plugin's default values with user overrides, but a plugin may instead wish
     * to merge values. This behavior can be accomplished in a `compose`
     * transformation.
     * - `fetch` transformations: The registry uses the plugin data that is
     * fetched from its connector. If a plugin wants to override, e.g. to update
     * its schema with dynamic defaults, a `fetch` transformation can be applied.
     */
    transform(plugin, transforms) {
        const transformers = this._transformers;
        if (plugin in transformers) {
            throw new Error(`${plugin} already has a transformer.`);
        }
        transformers[plugin] = {
            fetch: transforms.fetch || (plugin => plugin),
            compose: transforms.compose || (plugin => plugin)
        };
        return new disposable_1.DisposableDelegate(() => {
            delete transformers[plugin];
        });
    }
    /**
     * Upload a plugin's settings.
     *
     * @param plugin - The name of the plugin whose settings are being set.
     *
     * @param raw - The raw plugin settings being uploaded.
     *
     * @returns A promise that resolves when the settings have been saved.
     */
    upload(plugin, raw) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for data preload before allowing normal operation.
            yield this._ready;
            const plugins = this.plugins;
            if (!(plugin in plugins)) {
                return this.load(plugin).then(() => this.upload(plugin, raw));
            }
            // Set the local copy.
            plugins[plugin].raw = raw;
            return this._save(plugin);
        });
    }
    /**
     * Load a plugin into the registry.
     */
    _load(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const plugin = data.id;
            // Validate and preload the item.
            try {
                yield this._validate(data);
            }
            catch (errors) {
                const output = [`Validating ${plugin} failed:`];
                errors.forEach((error, index) => {
                    const { dataPath, schemaPath, keyword, message } = error;
                    if (dataPath || schemaPath) {
                        output.push(`${index} - schema @ ${schemaPath}, data @ ${dataPath}`);
                    }
                    output.push(`{${keyword}} ${message}`);
                });
                console.warn(output.join('\n'));
                throw errors;
            }
        });
    }
    /**
     * Preload a list of plugins and fail gracefully.
     */
    _preload(plugins) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(plugins.map((plugin) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Apply a transformation to the plugin if necessary.
                    yield this._load(yield this._transform('fetch', plugin));
                }
                catch (errors) {
                    /* Ignore preload errors. */
                    console.log('Ignored setting registry preload errors.', errors);
                }
            })));
        });
    }
    /**
     * Save a plugin in the registry.
     */
    _save(plugin) {
        return __awaiter(this, void 0, void 0, function* () {
            const plugins = this.plugins;
            if (!(plugin in plugins)) {
                throw new Error(`${plugin} does not exist in setting registry.`);
            }
            try {
                yield this._validate(plugins[plugin]);
            }
            catch (errors) {
                console.warn(`${plugin} validation errors:`, errors);
                throw new Error(`${plugin} failed to validate; check console.`);
            }
            yield this.connector.save(plugin, plugins[plugin].raw);
            // Fetch and reload the data to guarantee server and client are in sync.
            const fetched = yield this.connector.fetch(plugin);
            yield this._load(yield this._transform('fetch', fetched));
            this._pluginChanged.emit(plugin);
        });
    }
    /**
     * Transform the plugin if necessary.
     */
    _transform(phase, plugin, started = new Date().getTime()) {
        return __awaiter(this, void 0, void 0, function* () {
            const elapsed = new Date().getTime() - started;
            const id = plugin.id;
            const transformers = this._transformers;
            const timeout = this._timeout;
            if (!plugin.schema['jupyter.lab.transform']) {
                return plugin;
            }
            if (id in transformers) {
                const transformed = transformers[id][phase].call(null, plugin);
                if (transformed.id !== id) {
                    throw [
                        {
                            dataPath: '',
                            keyword: 'id',
                            message: 'Plugin transformations cannot change plugin IDs.',
                            schemaPath: ''
                        }
                    ];
                }
                return transformed;
            }
            // If the timeout has not been exceeded, stall and try again in 250ms.
            if (elapsed < timeout) {
                yield new Promise(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, 250);
                });
                return this._transform(phase, plugin, started);
            }
            throw [
                {
                    dataPath: '',
                    keyword: 'timeout',
                    message: `Transforming ${plugin.id} timed out.`,
                    schemaPath: ''
                }
            ];
        });
    }
    /**
     * Validate and preload a plugin, compose the `composite` data.
     */
    _validate(plugin) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate the user data and create the composite data.
            const errors = this.validator.validateData(plugin);
            if (errors) {
                throw errors;
            }
            // Apply a transformation if necessary and set the local copy.
            this.plugins[plugin.id] = yield this._transform('compose', plugin);
        });
    }
}
exports.SettingRegistry = SettingRegistry;
/**
 * A manager for a specific plugin's settings.
 */
class Settings {
    /**
     * Instantiate a new plugin settings manager.
     */
    constructor(options) {
        this._changed = new signaling_1.Signal(this);
        this._isDisposed = false;
        this.id = options.plugin.id;
        this.registry = options.registry;
        this.registry.pluginChanged.connect(this._onPluginChanged, this);
    }
    /**
     * A signal that emits when the plugin's settings have changed.
     */
    get changed() {
        return this._changed;
    }
    /**
     * The composite of user settings and extension defaults.
     */
    get composite() {
        return this.plugin.data.composite;
    }
    /**
     * Test whether the plugin settings manager disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    get plugin() {
        return this.registry.plugins[this.id];
    }
    /**
     * The plugin's schema.
     */
    get schema() {
        return this.plugin.schema;
    }
    /**
     * The plugin settings raw text value.
     */
    get raw() {
        return this.plugin.raw;
    }
    /**
     * The user settings.
     */
    get user() {
        return this.plugin.data.user;
    }
    /**
     * The published version of the NPM package containing these settings.
     */
    get version() {
        return this.plugin.version;
    }
    /**
     * Return the defaults in a commented JSON format.
     */
    annotatedDefaults() {
        return Private.annotatedDefaults(this.schema, this.id);
    }
    /**
     * Calculate the default value of a setting by iterating through the schema.
     *
     * @param key - The name of the setting whose default value is calculated.
     *
     * @returns A calculated default JSON value for a specific setting.
     */
    default(key) {
        return Private.reifyDefault(this.schema, key);
    }
    /**
     * Dispose of the plugin settings resources.
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        signaling_1.Signal.clearData(this);
    }
    /**
     * Get an individual setting.
     *
     * @param key - The name of the setting being retrieved.
     *
     * @returns The setting value.
     *
     * #### Notes
     * This method returns synchronously because it uses a cached copy of the
     * plugin settings that is synchronized with the registry.
     */
    get(key) {
        const { composite, user } = this;
        return {
            composite: key in composite ? copy(composite[key]) : undefined,
            user: key in user ? copy(user[key]) : undefined
        };
    }
    /**
     * Remove a single setting.
     *
     * @param key - The name of the setting being removed.
     *
     * @returns A promise that resolves when the setting is removed.
     *
     * #### Notes
     * This function is asynchronous because it writes to the setting registry.
     */
    remove(key) {
        return this.registry.remove(this.plugin.id, key);
    }
    /**
     * Save all of the plugin's user settings at once.
     */
    save(raw) {
        return this.registry.upload(this.plugin.id, raw);
    }
    /**
     * Set a single setting.
     *
     * @param key - The name of the setting being set.
     *
     * @param value - The value of the setting.
     *
     * @returns A promise that resolves when the setting has been saved.
     *
     * #### Notes
     * This function is asynchronous because it writes to the setting registry.
     */
    set(key, value) {
        return this.registry.set(this.plugin.id, key, value);
    }
    /**
     * Validates raw settings with comments.
     *
     * @param raw - The JSON with comments string being validated.
     *
     * @returns A list of errors or `null` if valid.
     */
    validate(raw) {
        const data = { composite: {}, user: {} };
        const { id, schema } = this.plugin;
        const validator = this.registry.validator;
        const version = this.version;
        return validator.validateData({ data, id, raw, schema, version }, false);
    }
    /**
     * Handle plugin changes in the setting registry.
     */
    _onPluginChanged(sender, plugin) {
        if (plugin === this.plugin.id) {
            this._changed.emit(undefined);
        }
    }
}
exports.Settings = Settings;
/**
 * A namespace for `SettingRegistry` statics.
 */
(function (SettingRegistry) {
    /**
     * Reconcile default and user shortcuts and return the composite list.
     *
     * @param defaults - The list of default shortcuts.
     *
     * @param user - The list of user shortcut overrides and additions.
     *
     * @returns A loadable list of shortcuts (omitting disabled and overridden).
     */
    function reconcileShortcuts(defaults, user) {
        const memo = {};
        // If a user shortcut collides with another user shortcut warn and filter.
        user = user.filter(shortcut => {
            const keys = shortcut.keys.join(RECORD_SEPARATOR);
            const { selector } = shortcut;
            if (!keys) {
                console.warn('Shortcut skipped because `keys` are [""].', shortcut);
                return false;
            }
            if (!(keys in memo)) {
                memo[keys] = {};
            }
            if (!(selector in memo[keys])) {
                memo[keys][selector] = false; // User shortcuts are `false`.
                return true;
            }
            console.warn('Shortcut skipped due to collision.', shortcut);
            return false;
        });
        // If a default shortcut collides with another default, warn and filter.
        // If a shortcut has already been added by the user preferences, filter it
        // out too (this includes shortcuts that are disabled by user preferences).
        defaults = defaults.filter(shortcut => {
            const { disabled } = shortcut;
            const keys = shortcut.keys.join(RECORD_SEPARATOR);
            if (disabled || !keys) {
                return false;
            }
            if (!(keys in memo)) {
                memo[keys] = {};
            }
            const { selector } = shortcut;
            if (!(selector in memo[keys])) {
                memo[keys][selector] = true; // Default shortcuts are `true`.
                return true;
            }
            // Only warn if a default shortcut collides with another default shortcut.
            if (memo[keys][selector]) {
                console.warn('Shortcut skipped due to collision.', shortcut);
            }
            return false;
        });
        // Filter out disabled user shortcuts and concat defaults before returning.
        return user.filter(shortcut => !shortcut.disabled).concat(defaults);
    }
    SettingRegistry.reconcileShortcuts = reconcileShortcuts;
})(SettingRegistry = exports.SettingRegistry || (exports.SettingRegistry = {}));
/**
 * A namespace for private module data.
 */
var Private;
(function (Private) {
    /**
     * The default indentation level, uses spaces instead of tabs.
     */
    const indent = '    ';
    /**
     * Replacement text for schema properties missing a `description` field.
     */
    const nondescript = '[missing schema description]';
    /**
     * Replacement text for schema properties missing a `title` field.
     */
    const untitled = '[missing schema title]';
    /**
     * Returns an annotated (JSON with comments) version of a schema's defaults.
     */
    function annotatedDefaults(schema, plugin) {
        const { description, properties, title } = schema;
        const keys = Object.keys(properties).sort((a, b) => a.localeCompare(b));
        const length = Math.max((description || nondescript).length, plugin.length);
        return [
            '{',
            prefix(`${title || untitled}`),
            prefix(plugin),
            prefix(description || nondescript),
            prefix('*'.repeat(length)),
            '',
            join(keys.map(key => defaultDocumentedValue(schema, key))),
            '}'
        ].join('\n');
    }
    Private.annotatedDefaults = annotatedDefaults;
    /**
     * Returns an annotated (JSON with comments) version of a plugin's
     * setting data.
     */
    function annotatedPlugin(plugin, data) {
        const { description, title } = plugin.schema;
        const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));
        const length = Math.max((description || nondescript).length, plugin.id.length);
        return [
            '{',
            prefix(`${title || untitled}`),
            prefix(plugin.id),
            prefix(description || nondescript),
            prefix('*'.repeat(length)),
            '',
            join(keys.map(key => documentedValue(plugin.schema, key, data[key]))),
            '}'
        ].join('\n');
    }
    Private.annotatedPlugin = annotatedPlugin;
    /**
     * Returns the default value-with-documentation-string for a
     * specific schema property.
     */
    function defaultDocumentedValue(schema, key) {
        const props = (schema.properties && schema.properties[key]) || {};
        const type = props['type'];
        const description = props['description'] || nondescript;
        const title = props['title'] || '';
        const reified = reifyDefault(schema, key);
        const spaces = indent.length;
        const defaults = reified !== undefined
            ? prefix(`"${key}": ${JSON.stringify(reified, null, spaces)}`, indent)
            : prefix(`"${key}": ${type}`);
        return [prefix(title), prefix(description), defaults]
            .filter(str => str.length)
            .join('\n');
    }
    /**
     * Returns a value-with-documentation-string for a specific schema property.
     */
    function documentedValue(schema, key, value) {
        const props = schema.properties && schema.properties[key];
        const description = (props && props['description']) || nondescript;
        const title = (props && props['title']) || untitled;
        const spaces = indent.length;
        const attribute = prefix(`"${key}": ${JSON.stringify(value, null, spaces)}`, indent);
        return [prefix(title), prefix(description), attribute].join('\n');
    }
    /**
     * Returns a joined string with line breaks and commas where appropriate.
     */
    function join(body) {
        return body.reduce((acc, val, idx) => {
            const rows = val.split('\n');
            const last = rows[rows.length - 1];
            const comment = last.trim().indexOf('//') === 0;
            const comma = comment || idx === body.length - 1 ? '' : ',';
            const separator = idx === body.length - 1 ? '' : '\n\n';
            return acc + val + comma + separator;
        }, '');
    }
    /**
     * Returns a documentation string with a comment prefix added on every line.
     */
    function prefix(source, pre = `${indent}// `) {
        return pre + source.split('\n').join(`\n${pre}`);
    }
    /**
     * Create a fully extrapolated default value for a root key in a schema.
     */
    function reifyDefault(schema, root) {
        // If the property is at the root level, traverse its schema.
        schema = (root ? schema.properties[root] : schema) || {};
        // If the property has no default or is a primitive, return.
        if (!('default' in schema) || schema.type !== 'object') {
            return schema.default;
        }
        // Make a copy of the default value to populate.
        const result = coreutils_1.JSONExt.deepCopy(schema.default);
        // Iterate through and populate each child property.
        for (let property in schema.properties || {}) {
            result[property] = reifyDefault(schema.properties[property]);
        }
        return result;
    }
    Private.reifyDefault = reifyDefault;
})(Private = exports.Private || (exports.Private = {}));
