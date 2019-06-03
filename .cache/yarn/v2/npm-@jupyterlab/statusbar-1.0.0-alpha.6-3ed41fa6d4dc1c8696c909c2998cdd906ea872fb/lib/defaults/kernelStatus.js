"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@jupyterlab/coreutils");
const __1 = require("..");
const coreutils_2 = require("@phosphor/coreutils");
/**
 * A pure functional component for rendering kernel status.
 */
function KernelStatusComponent(props) {
    return (react_1.default.createElement(__1.TextItem, { onClick: props.handleClick, source: `${coreutils_1.Text.titleCase(props.kernelName)} | ${coreutils_1.Text.titleCase(props.status)}`, title: `Change kernel for ${props.activityName}` }));
}
/**
 * A VDomRenderer widget for displaying the status of a kernel.
 */
class KernelStatus extends apputils_1.VDomRenderer {
    /**
     * Construct the kernel status widget.
     */
    constructor(opts) {
        super();
        this._handleClick = opts.onClick;
        this.model = new KernelStatus.Model();
        this.addClass(__1.interactiveItem);
    }
    /**
     * Render the kernel status item.
     */
    render() {
        if (this.model === null) {
            return null;
        }
        else {
            return (react_1.default.createElement(KernelStatusComponent, { status: this.model.status, kernelName: this.model.kernelName, activityName: this.model.activityName, handleClick: this._handleClick }));
        }
    }
}
exports.KernelStatus = KernelStatus;
/**
 * A namespace for KernelStatus statics.
 */
(function (KernelStatus) {
    /**
     * A VDomModel for the kernel status indicator.
     */
    class Model extends apputils_1.VDomModel {
        constructor() {
            super(...arguments);
            /**
             * React to changes to the kernel status.
             */
            this._onKernelStatusChanged = (_session, status) => {
                this._kernelStatus = status;
                this.stateChanged.emit(void 0);
            };
            /**
             * React to changes in the kernel.
             */
            this._onKernelChanged = (_session, change) => {
                const oldState = this._getAllState();
                const { newValue } = change;
                if (newValue !== null) {
                    this._kernelStatus = newValue.status;
                    this._kernelName = newValue.model.name.toLowerCase();
                }
                else {
                    this._kernelStatus = 'unknown';
                    this._kernelName = 'unknown';
                }
                this._triggerChange(oldState, this._getAllState());
            };
            this._activityName = 'activity';
            this._kernelName = 'unknown';
            this._kernelStatus = 'unknown';
            this._session = null;
        }
        /**
         * The name of the kernel.
         */
        get kernelName() {
            return this._kernelName;
        }
        /**
         * The current status of the kernel.
         */
        get status() {
            return this._kernelStatus;
        }
        /**
         * A display name for the activity.
         */
        get activityName() {
            return this._activityName;
        }
        set activityName(val) {
            const oldVal = this._activityName;
            if (oldVal === val) {
                return;
            }
            this._activityName = val;
            this.stateChanged.emit(void 0);
        }
        /**
         * The current client session associated with the kernel status indicator.
         */
        get session() {
            return this._session;
        }
        set session(session) {
            const oldSession = this._session;
            if (oldSession !== null) {
                oldSession.statusChanged.disconnect(this._onKernelStatusChanged);
                oldSession.kernelChanged.disconnect(this._onKernelChanged);
            }
            const oldState = this._getAllState();
            this._session = session;
            if (this._session === null) {
                this._kernelStatus = 'unknown';
                this._kernelName = 'unknown';
            }
            else {
                this._kernelStatus = this._session.status;
                this._kernelName = this._session.kernelDisplayName.toLowerCase();
                this._session.statusChanged.connect(this._onKernelStatusChanged);
                this._session.kernelChanged.connect(this._onKernelChanged);
            }
            this._triggerChange(oldState, this._getAllState());
        }
        _getAllState() {
            return [this._kernelName, this._kernelStatus, this._activityName];
        }
        _triggerChange(oldState, newState) {
            if (coreutils_2.JSONExt.deepEqual(oldState, newState)) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    KernelStatus.Model = Model;
})(KernelStatus = exports.KernelStatus || (exports.KernelStatus = {}));
