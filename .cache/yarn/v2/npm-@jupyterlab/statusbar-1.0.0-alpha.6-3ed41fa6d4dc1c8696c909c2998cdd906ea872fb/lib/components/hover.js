"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const widgets_1 = require("@phosphor/widgets");
const lib_1 = require("typestyle/lib");
const statusbar_1 = require("../style/statusbar");
const hoverItem = lib_1.style({
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
});
/**
 * Create and show a popup component.
 *
 * @param options - options for the popup
 *
 * @returns the popup that was created.
 */
function showPopup(options) {
    let dialog = new Popup(options);
    dialog.launch();
    return dialog;
}
exports.showPopup = showPopup;
/**
 * A class for a Popup widget.
 */
class Popup extends widgets_1.Widget {
    /**
     * Construct a new Popup.
     */
    constructor(options) {
        super();
        this._body = options.body;
        this._body.addClass(hoverItem);
        this._anchor = options.anchor;
        this._align = options.align;
        let layout = (this.layout = new widgets_1.PanelLayout());
        layout.addWidget(options.body);
        this._body.node.addEventListener('resize', () => {
            this.update();
        });
    }
    /**
     * Attach the popup widget to the page.
     */
    launch() {
        this._setGeometry();
        widgets_1.Widget.attach(this, document.body);
        this.update();
        this._anchor.addClass(statusbar_1.clickedItem);
        this._anchor.removeClass(statusbar_1.interactiveItem);
    }
    /**
     * Handle `'update'` messages for the widget.
     */
    onUpdateRequest(msg) {
        this._setGeometry();
        super.onUpdateRequest(msg);
    }
    /**
     * Handle `'after-attach'` messages for the widget.
     */
    onAfterAttach(msg) {
        document.addEventListener('click', this, false);
        this.node.addEventListener('keypress', this, false);
        window.addEventListener('resize', this, false);
    }
    /**
     * Handle `'after-detach'` messages for the widget.
     */
    onAfterDetach(msg) {
        document.removeEventListener('click', this, false);
        this.node.removeEventListener('keypress', this, false);
        window.removeEventListener('resize', this, false);
    }
    /**
     * Handle `'resize'` messages for the widget.
     */
    onResize() {
        this.update();
    }
    /**
     * Dispose of the widget.
     */
    dispose() {
        super.dispose();
        this._anchor.removeClass(statusbar_1.clickedItem);
        this._anchor.addClass(statusbar_1.interactiveItem);
    }
    /**
     * Handle DOM events for the widget.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'keydown':
                this._evtKeydown(event);
                break;
            case 'click':
                this._evtClick(event);
                break;
            case 'resize':
                this.onResize();
                break;
            default:
                break;
        }
    }
    _evtClick(event) {
        if (!!event.target &&
            !(this._body.node.contains(event.target) ||
                this._anchor.node.contains(event.target))) {
            this.dispose();
        }
    }
    _evtKeydown(event) {
        // Check for escape key
        switch (event.keyCode) {
            case 27: // Escape.
                event.stopPropagation();
                event.preventDefault();
                this.dispose();
                break;
            default:
                break;
        }
    }
    _setGeometry() {
        let aligned = 0;
        const anchorRect = this._anchor.node.getBoundingClientRect();
        const bodyRect = this._body.node.getBoundingClientRect();
        if (this._align === 'right') {
            aligned = -(bodyRect.width - anchorRect.width);
        }
        const style = window.getComputedStyle(this._body.node);
        apputils_1.HoverBox.setGeometry({
            anchor: anchorRect,
            host: document.body,
            maxHeight: 500,
            minHeight: 20,
            node: this._body.node,
            offset: {
                horizontal: aligned
            },
            privilege: 'forceAbove',
            style
        });
    }
}
exports.Popup = Popup;
