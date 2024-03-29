"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const signaling_1 = require("@phosphor/signaling");
const builder_1 = require("./builder");
const nbconvert_1 = require("./nbconvert");
const contents_1 = require("./contents");
const session_1 = require("./session");
const setting_1 = require("./setting");
const terminal_1 = require("./terminal");
const serverconnection_1 = require("./serverconnection");
const workspace_1 = require("./workspace");
/**
 * A Jupyter services manager.
 */
class ServiceManager {
    /**
     * Construct a new services provider.
     */
    constructor(options = {}) {
        this._isDisposed = false;
        this._specsChanged = new signaling_1.Signal(this);
        this._isReady = false;
        const defaultDrive = options.defaultDrive;
        const serverSettings = options.serverSettings || serverconnection_1.ServerConnection.makeSettings();
        const standby = options.standby || 'when-hidden';
        const normalized = { defaultDrive, serverSettings, standby };
        this.serverSettings = serverSettings;
        this.contents = new contents_1.ContentsManager(normalized);
        this.sessions = new session_1.SessionManager(normalized);
        this.settings = new setting_1.SettingManager(normalized);
        this.terminals = new terminal_1.TerminalManager(normalized);
        this.builder = new builder_1.BuildManager(normalized);
        this.workspaces = new workspace_1.WorkspaceManager(normalized);
        this.nbconvert = new nbconvert_1.NbConvertManager(normalized);
        this.sessions.specsChanged.connect((_, specs) => {
            this._specsChanged.emit(specs);
        });
        this._readyPromise = this.sessions.ready.then(() => {
            if (this.terminals.isAvailable()) {
                return this.terminals.ready;
            }
        });
        void this._readyPromise.then(() => {
            this._isReady = true;
        });
    }
    /**
     * A signal emitted when the kernel specs change.
     */
    get specsChanged() {
        return this._specsChanged;
    }
    /**
     * Test whether the service manager is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources used by the manager.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        signaling_1.Signal.clearData(this);
        this.contents.dispose();
        this.sessions.dispose();
        this.terminals.dispose();
    }
    /**
     * The kernel spec models.
     */
    get specs() {
        return this.sessions.specs;
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
        return this._readyPromise;
    }
}
exports.ServiceManager = ServiceManager;
