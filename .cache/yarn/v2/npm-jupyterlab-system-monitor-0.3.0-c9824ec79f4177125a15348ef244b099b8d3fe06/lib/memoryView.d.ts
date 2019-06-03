/// <reference types="react" />
import { VDomRenderer } from "@jupyterlab/apputils";
import { MemoryUsage } from "@jupyterlab/statusbar";
export declare class MemoryView extends VDomRenderer<MemoryModel> {
    constructor(refreshRate?: number);
    render(): JSX.Element;
}
declare class MemoryModel extends MemoryUsage.Model {
    constructor(options: MemoryUsage.Model.IOptions);
    updateValues(): void;
    dispose(): void;
    readonly values: number[];
    readonly percentage: number;
    private _percentage;
    private _values;
    private _refreshIntervalId;
}
export {};
