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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@jupyterlab/coreutils");
const __1 = require("..");
const services_1 = require("@jupyterlab/services");
/**
 * A VDomRenderer for showing memory usage by a kernel.
 */
class MemoryUsage extends apputils_1.VDomRenderer {
    /**
     * Construct a new memory usage status item.
     */
    constructor() {
        super();
        this.model = new MemoryUsage.Model({ refreshRate: 5000 });
    }
    /**
     * Render the memory usage status item.
     */
    render() {
        if (!this.model) {
            return null;
        }
        let text;
        if (this.model.memoryLimit === null) {
            text = `Mem: ${this.model.currentMemory.toFixed(Private.DECIMAL_PLACES)} ${this.model.units}`;
        }
        else {
            text = `Mem: ${this.model.currentMemory.toFixed(Private.DECIMAL_PLACES)} / ${this.model.memoryLimit.toFixed(Private.DECIMAL_PLACES)} ${this.model.units}`;
        }
        return react_1.default.createElement(__1.TextItem, { title: "Current memory usage", source: text });
    }
}
exports.MemoryUsage = MemoryUsage;
/**
 * A namespace for MemoryUsage statics.
 */
(function (MemoryUsage) {
    /**
     * A VDomModel for the memory usage status item.
     */
    class Model extends apputils_1.VDomModel {
        /**
         * Construct a new memory usage model.
         *
         * @param options: the options for creating the model.
         */
        constructor(options) {
            super();
            this._currentMemory = 0;
            this._memoryLimit = null;
            this._metricsAvailable = false;
            this._units = 'B';
            this._poll = new coreutils_1.Poll({
                factory: () => Private.factory(),
                frequency: {
                    interval: options.refreshRate,
                    backoff: true
                },
                name: '@jupyterlab/statusbar:MemoryUsage#metrics'
            });
            this._poll.ticked.connect(poll => {
                const { payload, phase } = poll.state;
                if (phase === 'resolved') {
                    this._updateMetricsValues(payload);
                    return;
                }
                if (phase === 'rejected') {
                    const oldMetricsAvailable = this._metricsAvailable;
                    this._metricsAvailable = false;
                    this._currentMemory = 0;
                    this._memoryLimit = null;
                    this._units = 'B';
                    if (oldMetricsAvailable) {
                        this.stateChanged.emit();
                    }
                    return;
                }
            });
        }
        /**
         * Whether the metrics server extension is available.
         */
        get metricsAvailable() {
            return this._metricsAvailable;
        }
        /**
         * The current memory usage/
         */
        get currentMemory() {
            return this._currentMemory;
        }
        /**
         * The current memory limit, or null if not specified.
         */
        get memoryLimit() {
            return this._memoryLimit;
        }
        /**
         * The units for memory usages and limits.
         */
        get units() {
            return this._units;
        }
        /**
         * Dispose of the memory usage model.
         */
        dispose() {
            super.dispose();
            this._poll.dispose();
        }
        /**
         * Given the results of the metrics request, update model values.
         */
        _updateMetricsValues(value) {
            const oldMetricsAvailable = this._metricsAvailable;
            const oldCurrentMemory = this._currentMemory;
            const oldMemoryLimit = this._memoryLimit;
            const oldUnits = this._units;
            if (value === null) {
                this._metricsAvailable = false;
                this._currentMemory = 0;
                this._memoryLimit = null;
                this._units = 'B';
            }
            else {
                const numBytes = value.rss;
                const memoryLimit = value.limits.memory
                    ? value.limits.memory.rss
                    : null;
                const [currentMemory, units] = Private.convertToLargestUnit(numBytes);
                this._metricsAvailable = true;
                this._currentMemory = currentMemory;
                this._units = units;
                this._memoryLimit = memoryLimit
                    ? memoryLimit / Private.MEMORY_UNIT_LIMITS[units]
                    : null;
            }
            if (this._currentMemory !== oldCurrentMemory ||
                this._units !== oldUnits ||
                this._memoryLimit !== oldMemoryLimit ||
                this._metricsAvailable !== oldMetricsAvailable) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    MemoryUsage.Model = Model;
})(MemoryUsage = exports.MemoryUsage || (exports.MemoryUsage = {}));
/**
 * A namespace for module private statics.
 */
var Private;
(function (Private) {
    /**
     * The number of decimal places to use when rendering memory usage.
     */
    Private.DECIMAL_PLACES = 2;
    /**
     * The number of bytes in each memory unit.
     */
    Private.MEMORY_UNIT_LIMITS = {
        B: 1,
        KB: 1024,
        MB: 1048576,
        GB: 1073741824,
        TB: 1099511627776,
        PB: 1125899906842624
    };
    /**
     * Given a number of bytes, convert to the most human-readable
     * format, (GB, TB, etc).
     */
    function convertToLargestUnit(numBytes) {
        if (numBytes < Private.MEMORY_UNIT_LIMITS.KB) {
            return [numBytes, 'B'];
        }
        else if (Private.MEMORY_UNIT_LIMITS.KB === numBytes ||
            numBytes < Private.MEMORY_UNIT_LIMITS.MB) {
            return [numBytes / Private.MEMORY_UNIT_LIMITS.KB, 'KB'];
        }
        else if (Private.MEMORY_UNIT_LIMITS.MB === numBytes ||
            numBytes < Private.MEMORY_UNIT_LIMITS.GB) {
            return [numBytes / Private.MEMORY_UNIT_LIMITS.MB, 'MB'];
        }
        else if (Private.MEMORY_UNIT_LIMITS.GB === numBytes ||
            numBytes < Private.MEMORY_UNIT_LIMITS.TB) {
            return [numBytes / Private.MEMORY_UNIT_LIMITS.GB, 'GB'];
        }
        else if (Private.MEMORY_UNIT_LIMITS.TB === numBytes ||
            numBytes < Private.MEMORY_UNIT_LIMITS.PB) {
            return [numBytes / Private.MEMORY_UNIT_LIMITS.TB, 'TB'];
        }
        else {
            return [numBytes / Private.MEMORY_UNIT_LIMITS.PB, 'PB'];
        }
    }
    Private.convertToLargestUnit = convertToLargestUnit;
    /**
     * Settings for making requests to the server.
     */
    const SERVER_CONNECTION_SETTINGS = services_1.ServerConnection.makeSettings();
    /**
     * The url endpoint for making requests to the server.
     */
    const METRIC_URL = coreutils_1.URLExt.join(SERVER_CONNECTION_SETTINGS.baseUrl, 'metrics');
    /**
     * Make a request to the backend.
     */
    function factory() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = services_1.ServerConnection.makeRequest(METRIC_URL, {}, SERVER_CONNECTION_SETTINGS);
            const response = yield request;
            if (response.ok) {
                try {
                    return yield response.json();
                }
                catch (error) {
                    throw error;
                }
            }
            return null;
        });
    }
    Private.factory = factory;
})(Private || (Private = {}));
