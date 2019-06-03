"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_1 = require("@phosphor/coreutils");
const disposable_1 = require("@phosphor/disposable");
const widgets_1 = require("@phosphor/widgets");
const statusbar_1 = require("./style/statusbar");
// tslint:disable-next-line:variable-name
exports.IStatusBar = new coreutils_1.Token('@jupyterlab/statusbar:IStatusBar');
/**
 * Main status bar object which contains all items.
 */
class StatusBar extends widgets_1.Widget {
    constructor() {
        super();
        this._leftRankItems = [];
        this._rightRankItems = [];
        this._statusItems = {};
        this._disposables = new disposable_1.DisposableSet();
        this.addClass(statusbar_1.statusBar);
        let rootLayout = (this.layout = new widgets_1.PanelLayout());
        let leftPanel = (this._leftSide = new widgets_1.Panel());
        let middlePanel = (this._middlePanel = new widgets_1.Panel());
        let rightPanel = (this._rightSide = new widgets_1.Panel());
        leftPanel.addClass(statusbar_1.side);
        leftPanel.addClass(statusbar_1.leftSide);
        middlePanel.addClass(statusbar_1.side);
        rightPanel.addClass(statusbar_1.side);
        rightPanel.addClass(statusbar_1.rightSide);
        rootLayout.addWidget(leftPanel);
        rootLayout.addWidget(middlePanel);
        rootLayout.addWidget(rightPanel);
    }
    /**
     * Register a new status item.
     *
     * @param id - a unique id for the status item.
     *
     * @param statusItem - The item to add to the status bar.
     */
    registerStatusItem(id, statusItem) {
        if (id in this._statusItems) {
            throw new Error(`Status item ${id} already registered.`);
        }
        // Populate defaults for the optional properties of the status item.
        statusItem = Object.assign({}, Private.statusItemDefaults, statusItem);
        const { align, item, rank } = statusItem;
        // Connect the activeStateChanged signal to refreshing the status item,
        // if the signal was provided.
        const onActiveStateChanged = () => {
            this._refreshItem(id);
        };
        if (statusItem.activeStateChanged) {
            statusItem.activeStateChanged.connect(onActiveStateChanged);
        }
        let rankItem = { id, rank };
        statusItem.item.addClass(statusbar_1.item);
        this._statusItems[id] = statusItem;
        if (align === 'left') {
            let insertIndex = this._findInsertIndex(this._leftRankItems, rankItem);
            if (insertIndex === -1) {
                this._leftSide.addWidget(item);
                this._leftRankItems.push(rankItem);
            }
            else {
                algorithm_1.ArrayExt.insert(this._leftRankItems, insertIndex, rankItem);
                this._leftSide.insertWidget(insertIndex, item);
            }
        }
        else if (align === 'right') {
            let insertIndex = this._findInsertIndex(this._rightRankItems, rankItem);
            if (insertIndex === -1) {
                this._rightSide.addWidget(item);
                this._rightRankItems.push(rankItem);
            }
            else {
                algorithm_1.ArrayExt.insert(this._rightRankItems, insertIndex, rankItem);
                this._rightSide.insertWidget(insertIndex, item);
            }
        }
        else {
            this._middlePanel.addWidget(item);
        }
        this._refreshItem(id); // Initially refresh the status item.
        const disposable = new disposable_1.DisposableDelegate(() => {
            delete this._statusItems[id];
            if (statusItem.activeStateChanged) {
                statusItem.activeStateChanged.disconnect(onActiveStateChanged);
            }
            item.parent = null;
            item.dispose();
        });
        this._disposables.add(disposable);
        return disposable;
    }
    /**
     * Dispose of the status bar.
     */
    dispose() {
        this._leftRankItems.length = 0;
        this._rightRankItems.length = 0;
        this._disposables.dispose();
        super.dispose();
    }
    /**
     * Handle an 'update-request' message to the status bar.
     */
    onUpdateRequest(msg) {
        this._refreshAll();
        super.onUpdateRequest(msg);
    }
    _findInsertIndex(side, newItem) {
        return algorithm_1.ArrayExt.findFirstIndex(side, item => item.rank > newItem.rank);
    }
    _refreshItem(id) {
        const statusItem = this._statusItems[id];
        if (statusItem.isActive()) {
            statusItem.item.show();
            statusItem.item.update();
        }
        else {
            statusItem.item.hide();
        }
    }
    _refreshAll() {
        Object.keys(this._statusItems).forEach(id => {
            this._refreshItem(id);
        });
    }
}
exports.StatusBar = StatusBar;
/**
 * A namespace for private functionality.
 */
var Private;
(function (Private) {
    /**
     * Default options for a status item, less the item itself.
     */
    Private.statusItemDefaults = {
        align: 'left',
        rank: 0,
        isActive: () => true,
        activeStateChanged: undefined
    };
})(Private || (Private = {}));
