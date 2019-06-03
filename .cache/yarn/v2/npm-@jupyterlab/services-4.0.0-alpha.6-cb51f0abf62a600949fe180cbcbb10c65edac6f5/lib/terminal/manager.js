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
Object.defineProperty(exports, "__esModule", { value: true });
const coreutils_1 = require("@jupyterlab/coreutils");
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_2 = require("@phosphor/coreutils");
const signaling_1 = require("@phosphor/signaling");
const __1 = require("..");
const terminal_1 = require("./terminal");
/**
 * A terminal session manager.
 */
class TerminalManager {
    /**
     * Construct a new terminal manager.
     */
    constructor(options = {}) {
        this._isDisposed = false;
        this._isReady = false;
        this._models = [];
        this._sessions = new Set();
        this._runningChanged = new signaling_1.Signal(this);
        this.serverSettings =
            options.serverSettings || __1.ServerConnection.makeSettings();
        // Check if terminals are available
        if (!terminal_1.TerminalSession.isAvailable()) {
            this._ready = Promise.reject('Terminals unavailable');
            return;
        }
        // Initialize internal data then start polling.
        this._ready = this.requestRunning()
            .then(_ => undefined)
            .catch(_ => undefined)
            .then(() => {
            if (this.isDisposed) {
                return;
            }
            this._isReady = true;
        });
        // Start polling with exponential backoff.
        this._pollModels = new coreutils_1.Poll({
            factory: () => this.requestRunning(),
            frequency: {
                interval: 10 * 1000,
                backoff: true,
                max: 300 * 1000
            },
            name: `@jupyterlab/services:TerminalManager#models`,
            standby: options.standby || 'when-hidden',
            when: this.ready
        });
    }
    /**
     * A signal emitted when the running terminals change.
     */
    get runningChanged() {
        return this._runningChanged;
    }
    /**
     * Test whether the terminal manager is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Test whether the manager is ready.
     */
    get isReady() {
        return this._isReady;
    }
    /**
     * Dispose of the resources used by the manager.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._models.length = 0;
        this._pollModels.dispose();
        signaling_1.Signal.clearData(this);
    }
    /**
     * A promise that fulfills when the manager is ready.
     */
    get ready() {
        return this._ready;
    }
    /**
     * Whether the terminal service is available.
     */
    isAvailable() {
        return terminal_1.TerminalSession.isAvailable();
    }
    /**
     * Create an iterator over the most recent running terminals.
     *
     * @returns A new iterator over the running terminals.
     */
    running() {
        return algorithm_1.iter(this._models);
    }
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
    startNew(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield terminal_1.TerminalSession.startNew(this._getOptions(options));
            this._onStarted(session);
            return session;
        });
    }
    /*
     * Connect to a running session.
     *
     * @param name - The name of the target session.
     *
     * @param options - The options used to connect to the session.
     *
     * @returns A promise that resolves with the new session instance.
     *
     * #### Notes
     * The manager `serverSettings` will be used unless overridden in the
     * options.
     */
    connectTo(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield terminal_1.TerminalSession.connectTo(name, this._getOptions(options));
            this._onStarted(session);
            return session;
        });
    }
    /**
     * Force a refresh of the running sessions.
     *
     * #### Notes
     * This is intended to be called only in response to a user action,
     * since the manager maintains its internal state.
     */
    refreshRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._pollModels.refresh();
            yield this._pollModels.tick;
        });
    }
    /**
     * Shut down a terminal session by name.
     */
    shutdown(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const models = this._models;
            const sessions = this._sessions;
            const index = algorithm_1.ArrayExt.findFirstIndex(models, model => model.name === name);
            if (index === -1) {
                return;
            }
            // Proactively remove the model.
            models.splice(index, 1);
            this._runningChanged.emit(models.slice());
            // Delete and dispose the session locally.
            sessions.forEach(session => {
                if (session.name === name) {
                    sessions.delete(session);
                    session.dispose();
                }
            });
            // Shut down the remote session.
            yield terminal_1.TerminalSession.shutdown(name, this.serverSettings);
        });
    }
    /**
     * Shut down all terminal sessions.
     *
     * @returns A promise that resolves when all of the sessions are shut down.
     */
    shutdownAll() {
        return __awaiter(this, void 0, void 0, function* () {
            // Update the list of models then shut down every session.
            try {
                yield this.requestRunning();
                yield Promise.all(this._models.map(({ name }) => terminal_1.TerminalSession.shutdown(name, this.serverSettings)));
            }
            finally {
                // Dispose every kernel and clear the set.
                this._sessions.forEach(session => {
                    session.dispose();
                });
                this._sessions.clear();
                // Remove all models even if we had an error.
                if (this._models.length) {
                    this._models.length = 0;
                    this._runningChanged.emit([]);
                }
            }
        });
    }
    /**
     * Execute a request to the server to poll running terminals and update state.
     */
    requestRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            const models = yield terminal_1.TerminalSession.listRunning(this.serverSettings);
            if (this.isDisposed) {
                return;
            }
            if (!coreutils_2.JSONExt.deepEqual(models, this._models)) {
                const names = models.map(({ name }) => name);
                const sessions = this._sessions;
                sessions.forEach(session => {
                    if (names.indexOf(session.name) === -1) {
                        session.dispose();
                        sessions.delete(session);
                    }
                });
                this._models = models.slice();
                this._runningChanged.emit(models);
            }
        });
    }
    /**
     * Get a set of options to pass.
     */
    _getOptions(options = {}) {
        return Object.assign({}, options, { serverSettings: this.serverSettings });
    }
    /**
     * Handle a session starting.
     */
    _onStarted(session) {
        let name = session.name;
        this._sessions.add(session);
        let index = algorithm_1.ArrayExt.findFirstIndex(this._models, value => value.name === name);
        if (index === -1) {
            this._models.push(session.model);
            this._runningChanged.emit(this._models.slice());
        }
        session.terminated.connect(() => {
            this._onTerminated(name);
        });
    }
    /**
     * Handle a session terminating.
     */
    _onTerminated(name) {
        let index = algorithm_1.ArrayExt.findFirstIndex(this._models, value => value.name === name);
        if (index !== -1) {
            this._models.splice(index, 1);
            this._runningChanged.emit(this._models.slice());
        }
    }
}
exports.TerminalManager = TerminalManager;
