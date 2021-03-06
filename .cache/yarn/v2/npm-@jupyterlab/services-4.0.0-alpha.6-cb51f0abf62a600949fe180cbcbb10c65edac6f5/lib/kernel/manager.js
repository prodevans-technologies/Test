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
const kernel_1 = require("./kernel");
/**
 * An implementation of a kernel manager.
 */
class KernelManager {
    /**
     * Construct a new kernel manager.
     *
     * @param options - The default options for kernel.
     */
    constructor(options = {}) {
        this._isDisposed = false;
        this._isReady = false;
        this._kernels = new Set();
        this._models = [];
        this._runningChanged = new signaling_1.Signal(this);
        this._specs = null;
        this._specsChanged = new signaling_1.Signal(this);
        this.serverSettings =
            options.serverSettings || __1.ServerConnection.makeSettings();
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
            name: `@jupyterlab/services:KernelManager#models`,
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
            name: `@jupyterlab/services:KernelManager#specs`,
            standby: options.standby || 'when-hidden',
            when: this.ready
        });
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
     * A promise that fulfills when the manager is ready.
     */
    get ready() {
        return this._ready;
    }
    /**
     * A signal emitted when the running kernels change.
     */
    get runningChanged() {
        return this._runningChanged;
    }
    /**
     * Get the most recently fetched kernel specs.
     */
    get specs() {
        return this._specs;
    }
    /**
     * A signal emitted when the specs change.
     */
    get specsChanged() {
        return this._specsChanged;
    }
    /**
     * Connect to an existing kernel.
     *
     * @param model - The model of the target kernel.
     *
     * @returns A promise that resolves with the new kernel instance.
     */
    connectTo(model) {
        let kernel = kernel_1.Kernel.connectTo(model, this.serverSettings);
        this._onStarted(kernel);
        return kernel;
    }
    /**
     * Dispose of the resources used by the manager.
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._models.length = 0;
        this._pollModels.dispose();
        this._pollSpecs.dispose();
        signaling_1.Signal.clearData(this);
    }
    /**
     * Find a kernel by id.
     *
     * @param id - The id of the target kernel.
     *
     * @returns A promise that resolves with the kernel's model.
     */
    findById(id) {
        return kernel_1.Kernel.findById(id, this.serverSettings);
    }
    /**
     * Force a refresh of the running kernels.
     *
     * @returns A promise that resolves when the running list has been refreshed.
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
     * Create an iterator over the most recent running kernels.
     *
     * @returns A new iterator over the running kernels.
     */
    running() {
        return algorithm_1.iter(this._models);
    }
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
    shutdown(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const models = this._models;
            const kernels = this._kernels;
            const index = algorithm_1.ArrayExt.findFirstIndex(models, value => value.id === id);
            if (index === -1) {
                return;
            }
            // Proactively remove the model.
            models.splice(index, 1);
            this._runningChanged.emit(models.slice());
            // Delete and dispose the kernel locally.
            kernels.forEach(kernel => {
                if (kernel.id === id) {
                    kernels.delete(kernel);
                    kernel.dispose();
                }
            });
            // Shut down the remote session.
            yield kernel_1.Kernel.shutdown(id, this.serverSettings);
        });
    }
    /**
     * Shut down all kernels.
     *
     * @returns A promise that resolves when all of the kernels are shut down.
     */
    shutdownAll() {
        return __awaiter(this, void 0, void 0, function* () {
            // Update the list of models then shut down every session.
            try {
                yield this.requestRunning();
                yield Promise.all(this._models.map(({ id }) => kernel_1.Kernel.shutdown(id, this.serverSettings)));
            }
            finally {
                // Dispose every kernel and clear the set.
                this._kernels.forEach(kernel => {
                    kernel.dispose();
                });
                this._kernels.clear();
                // Remove all models even if we had an error.
                if (this._models.length) {
                    this._models.length = 0;
                    this._runningChanged.emit([]);
                }
            }
        });
    }
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
    startNew(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const newOptions = Object.assign({}, options, { serverSettings: this.serverSettings });
            const kernel = yield kernel_1.Kernel.startNew(newOptions);
            this._onStarted(kernel);
            return kernel;
        });
    }
    /**
     * Execute a request to the server to poll running kernels and update state.
     */
    requestRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            const models = yield kernel_1.Kernel.listRunning(this.serverSettings);
            if (this._isDisposed) {
                return;
            }
            if (!coreutils_2.JSONExt.deepEqual(models, this._models)) {
                const ids = models.map(({ id }) => id);
                const kernels = this._kernels;
                kernels.forEach(kernel => {
                    if (ids.indexOf(kernel.id) === -1) {
                        kernel.dispose();
                        kernels.delete(kernel);
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
            if (this._isDisposed) {
                return;
            }
            if (!coreutils_2.JSONExt.deepEqual(specs, this._specs)) {
                this._specs = specs;
                this._specsChanged.emit(specs);
            }
        });
    }
    /**
     * Handle a kernel starting.
     */
    _onStarted(kernel) {
        let id = kernel.id;
        this._kernels.add(kernel);
        let index = algorithm_1.ArrayExt.findFirstIndex(this._models, value => value.id === id);
        if (index === -1) {
            this._models.push(kernel.model);
            this._runningChanged.emit(this._models.slice());
        }
        kernel.terminated.connect(() => {
            this._onTerminated(id);
        });
    }
    /**
     * Handle a kernel terminating.
     */
    _onTerminated(id) {
        let index = algorithm_1.ArrayExt.findFirstIndex(this._models, value => value.id === id);
        if (index !== -1) {
            this._models.splice(index, 1);
            this._runningChanged.emit(this._models.slice());
        }
    }
}
exports.KernelManager = KernelManager;
