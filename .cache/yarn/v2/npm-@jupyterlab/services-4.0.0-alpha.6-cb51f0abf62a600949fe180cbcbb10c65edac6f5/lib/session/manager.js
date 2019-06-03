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
const kernel_1 = require("../kernel");
const serverconnection_1 = require("../serverconnection");
const session_1 = require("./session");
/**
 * An implementation of a session manager.
 */
class SessionManager {
    /**
     * Construct a new session manager.
     *
     * @param options - The default options for each session.
     */
    constructor(options = {}) {
        this._isDisposed = false;
        this._isReady = false;
        this._models = [];
        this._runningChanged = new signaling_1.Signal(this);
        this._sessions = new Set();
        this._specs = null;
        this._specsChanged = new signaling_1.Signal(this);
        this.serverSettings =
            options.serverSettings || serverconnection_1.ServerConnection.makeSettings();
        // Initialize internal data.
        this._ready = Promise.all([this.requestRunning(), this.requestSpecs()])
            .then(_ => undefined)
            .catch(_ => undefined)
            .then(() => {
            if (this.isDisposed) {
                return;
            }
            this._isReady = true;
        });
        // Start model and specs polling with exponential backoff.
        this._pollModels = new coreutils_1.Poll({
            factory: () => this.requestRunning(),
            frequency: {
                interval: 10 * 1000,
                backoff: true,
                max: 300 * 1000
            },
            name: `@jupyterlab/services:SessionManager#models`,
            standby: options.standby || 'when-hidden',
            when: this.ready
        });
        this._pollSpecs = new coreutils_1.Poll({
            factory: () => this.requestSpecs(),
            frequency: {
                interval: 61 * 1000,
                backoff: true,
                max: 300 * 1000
            },
            name: `@jupyterlab/services:SessionManager#specs`,
            standby: options.standby || 'when-hidden',
            when: this.ready
        });
    }
    /**
     * A signal emitted when the kernel specs change.
     */
    get specsChanged() {
        return this._specsChanged;
    }
    /**
     * A signal emitted when the running sessions change.
     */
    get runningChanged() {
        return this._runningChanged;
    }
    /**
     * Test whether the manager is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Get the most recently fetched kernel specs.
     */
    get specs() {
        return this._specs;
    }
    /**
     * Test whether the manager is ready.
     */
    get isReady() {
        return this._isReady;
    }
    /**
     * A promise that fulfills when the manager is ready.
     */
    get ready() {
        return this._ready;
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
        this._pollSpecs.dispose();
        signaling_1.Signal.clearData(this);
    }
    /**
     * Create an iterator over the most recent running sessions.
     *
     * @returns A new iterator over the running sessions.
     */
    running() {
        return algorithm_1.iter(this._models);
    }
    /**
     * Force a refresh of the specs from the server.
     *
     * @returns A promise that resolves when the specs are fetched.
     *
     * #### Notes
     * This is intended to be called only in response to a user action,
     * since the manager maintains its internal state.
     */
    refreshSpecs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._pollSpecs.refresh();
            yield this._pollSpecs.tick;
        });
    }
    /**
     * Force a refresh of the running sessions.
     *
     * @returns A promise that with the list of running sessions.
     *
     * #### Notes
     * This is not typically meant to be called by the user, since the
     * manager maintains its own internal state.
     */
    refreshRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._pollModels.refresh();
            yield this._pollModels.tick;
        });
    }
    /**
     * Start a new session.  See also [[startNewSession]].
     *
     * @param options - Overrides for the default options, must include a `path`.
     */
    startNew(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { serverSettings } = this;
            const session = yield session_1.Session.startNew(Object.assign({}, options, { serverSettings }));
            this._onStarted(session);
            return session;
        });
    }
    /**
     * Find a session associated with a path and stop it if it is the only session
     * using that kernel.
     *
     * @param path - The path in question.
     *
     * @returns A promise that resolves when the relevant sessions are stopped.
     */
    stopIfNeeded(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessions = yield session_1.Session.listRunning(this.serverSettings);
                const matches = sessions.filter(value => value.path === path);
                if (matches.length === 1) {
                    const id = matches[0].id;
                    return this.shutdown(id).catch(() => {
                        /* no-op */
                    });
                }
            }
            catch (error) {
                /* Always succeed. */
            }
        });
    }
    /**
     * Find a session by id.
     */
    findById(id) {
        return session_1.Session.findById(id, this.serverSettings);
    }
    /**
     * Find a session by path.
     */
    findByPath(path) {
        return session_1.Session.findByPath(path, this.serverSettings);
    }
    /*
     * Connect to a running session.  See also [[connectToSession]].
     */
    connectTo(model) {
        const session = session_1.Session.connectTo(model, this.serverSettings);
        this._onStarted(session);
        return session;
    }
    /**
     * Shut down a session by id.
     */
    shutdown(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const models = this._models;
            const sessions = this._sessions;
            const index = algorithm_1.ArrayExt.findFirstIndex(models, model => model.id === id);
            if (index === -1) {
                return;
            }
            // Proactively remove the model.
            models.splice(index, 1);
            this._runningChanged.emit(models.slice());
            sessions.forEach(session => {
                if (session.id === id) {
                    sessions.delete(session);
                    session.dispose();
                }
            });
            yield session_1.Session.shutdown(id, this.serverSettings);
        });
    }
    /**
     * Shut down all sessions.
     *
     * @returns A promise that resolves when all of the kernels are shut down.
     */
    shutdownAll() {
        return __awaiter(this, void 0, void 0, function* () {
            // Update the list of models then shut down every session.
            try {
                yield this.requestRunning();
                yield Promise.all(this._models.map(({ id }) => session_1.Session.shutdown(id, this.serverSettings)));
            }
            finally {
                // Dispose every session and clear the set.
                this._sessions.forEach(kernel => {
                    kernel.dispose();
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
     * Execute a request to the server to poll running kernels and update state.
     */
    requestRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            const models = yield session_1.Session.listRunning(this.serverSettings);
            if (this.isDisposed) {
                return;
            }
            if (!coreutils_2.JSONExt.deepEqual(models, this._models)) {
                const ids = models.map(model => model.id);
                const sessions = this._sessions;
                sessions.forEach(session => {
                    if (ids.indexOf(session.id) === -1) {
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
     * Execute a request to the server to poll specs and update state.
     */
    requestSpecs() {
        return __awaiter(this, void 0, void 0, function* () {
            const specs = yield kernel_1.Kernel.getSpecs(this.serverSettings);
            if (this.isDisposed) {
                return;
            }
            if (!coreutils_2.JSONExt.deepEqual(specs, this._specs)) {
                this._specs = specs;
                this._specsChanged.emit(specs);
            }
        });
    }
    /**
     * Handle a session terminating.
     */
    _onTerminated(id) {
        let index = algorithm_1.ArrayExt.findFirstIndex(this._models, value => value.id === id);
        if (index !== -1) {
            this._models.splice(index, 1);
            this._runningChanged.emit(this._models.slice());
        }
    }
    /**
     * Handle a session starting.
     */
    _onStarted(session) {
        let id = session.id;
        let index = algorithm_1.ArrayExt.findFirstIndex(this._models, value => value.id === id);
        this._sessions.add(session);
        if (index === -1) {
            this._models.push(session.model);
            this._runningChanged.emit(this._models.slice());
        }
        session.terminated.connect(s => {
            this._onTerminated(id);
        });
        session.propertyChanged.connect((sender, prop) => {
            this._onChanged(session.model);
        });
        session.kernelChanged.connect(() => {
            this._onChanged(session.model);
        });
    }
    /**
     * Handle a change to a session.
     */
    _onChanged(model) {
        let index = algorithm_1.ArrayExt.findFirstIndex(this._models, value => value.id === model.id);
        if (index !== -1) {
            this._models[index] = model;
            this._runningChanged.emit(this._models.slice());
        }
    }
}
exports.SessionManager = SessionManager;
