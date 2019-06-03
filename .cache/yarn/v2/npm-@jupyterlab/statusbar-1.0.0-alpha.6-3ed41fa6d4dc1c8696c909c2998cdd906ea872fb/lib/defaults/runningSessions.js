"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const apputils_1 = require("@jupyterlab/apputils");
const __1 = require("..");
/**
 * Half spacing between subitems in a status item.
 */
const HALF_SPACING = 4;
/**
 * A pure functional component for rendering kernel and terminal sessions.
 *
 * @param props: the props for the component.
 *
 * @returns a tsx component for the running sessions.
 */
function RunningSessionsComponent(props) {
    return (react_1.default.createElement(__1.GroupItem, { spacing: HALF_SPACING, onClick: props.handleClick },
        react_1.default.createElement(__1.GroupItem, { spacing: HALF_SPACING },
            react_1.default.createElement(__1.TextItem, { source: props.terminals }),
            react_1.default.createElement(__1.IconItem, { source: 'jp-StatusItem-terminal', offset: { x: 1, y: 3 } })),
        react_1.default.createElement(__1.GroupItem, { spacing: HALF_SPACING },
            react_1.default.createElement(__1.TextItem, { source: props.kernels }),
            react_1.default.createElement(__1.IconItem, { source: 'jp-StatusItem-kernel', offset: { x: 0, y: 2 } }))));
}
/**
 * A VDomRenderer for a RunningSessions status item.
 */
class RunningSessions extends apputils_1.VDomRenderer {
    /**
     * Create a new RunningSessions widget.
     */
    constructor(opts) {
        super();
        this._serviceManager = opts.serviceManager;
        this._handleClick = opts.onClick;
        this._serviceManager.sessions.runningChanged.connect(this._onKernelsRunningChanged, this);
        this._serviceManager.terminals.runningChanged.connect(this._onTerminalsRunningChanged, this);
        this.model = new RunningSessions.Model();
        this.addClass(__1.interactiveItem);
    }
    /**
     * Render the running sessions widget.
     */
    render() {
        if (!this.model) {
            return null;
        }
        this.title.caption = `${this.model.terminals} Terminals, ${this.model.kernels} Kernels`;
        return (react_1.default.createElement(RunningSessionsComponent, { kernels: this.model.kernels, terminals: this.model.terminals, handleClick: this._handleClick }));
    }
    /**
     * Dispose of the status item.
     */
    dispose() {
        super.dispose();
        this._serviceManager.sessions.runningChanged.disconnect(this._onKernelsRunningChanged, this);
        this._serviceManager.terminals.runningChanged.disconnect(this._onTerminalsRunningChanged, this);
    }
    /**
     * Set the number of model kernels when the list changes.
     */
    _onKernelsRunningChanged(manager, kernels) {
        this.model.kernels = kernels.length;
    }
    /**
     * Set the number of model terminal sessions when the list changes.
     */
    _onTerminalsRunningChanged(manager, terminals) {
        this.model.terminals = terminals.length;
    }
}
exports.RunningSessions = RunningSessions;
/**
 * A namespace for RunninSessions statics.
 */
(function (RunningSessions) {
    /**
     * A VDomModel for the RunninSessions status item.
     */
    class Model extends apputils_1.VDomModel {
        constructor() {
            super(...arguments);
            this._terminals = 0;
            this._kernels = 0;
        }
        /**
         * The number of active kernels.
         */
        get kernels() {
            return this._kernels;
        }
        set kernels(kernels) {
            const oldKernels = this._kernels;
            this._kernels = kernels;
            if (oldKernels !== this._kernels) {
                this.stateChanged.emit(void 0);
            }
        }
        /**
         * The number of active terminal sessions.
         */
        get terminals() {
            return this._terminals;
        }
        set terminals(terminals) {
            const oldTerminals = this._terminals;
            this._terminals = terminals;
            if (oldTerminals !== this._terminals) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    RunningSessions.Model = Model;
})(RunningSessions = exports.RunningSessions || (exports.RunningSessions = {}));
