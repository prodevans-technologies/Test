/// <reference types="react" />
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
/**
 * A VDomRenderer for showing memory usage by a kernel.
 */
export declare class MemoryUsage extends VDomRenderer<MemoryUsage.Model> {
    /**
     * Construct a new memory usage status item.
     */
    constructor();
    /**
     * Render the memory usage status item.
     */
    render(): JSX.Element;
}
/**
 * A namespace for MemoryUsage statics.
 */
export declare namespace MemoryUsage {
    /**
     * A VDomModel for the memory usage status item.
     */
    class Model extends VDomModel {
        /**
         * Construct a new memory usage model.
         *
         * @param options: the options for creating the model.
         */
        constructor(options: Model.IOptions);
        /**
         * Whether the metrics server extension is available.
         */
        readonly metricsAvailable: boolean;
        /**
         * The current memory usage/
         */
        readonly currentMemory: number;
        /**
         * The current memory limit, or null if not specified.
         */
        readonly memoryLimit: number | null;
        /**
         * The units for memory usages and limits.
         */
        readonly units: MemoryUnit;
        /**
         * Dispose of the memory usage model.
         */
        dispose(): void;
        /**
         * Given the results of the metrics request, update model values.
         */
        private _updateMetricsValues;
        private _currentMemory;
        private _memoryLimit;
        private _metricsAvailable;
        private _poll;
        private _units;
    }
    /**
     * A namespace for Model statics.
     */
    namespace Model {
        /**
         * Options for creating a MemoryUsage model.
         */
        interface IOptions {
            /**
             * The refresh rate (in ms) for querying the server.
             */
            refreshRate: number;
        }
    }
    /**
     * The type of unit used for reporting memory usage.
     */
    type MemoryUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB';
}
