"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const signaling_1 = require("@phosphor/signaling");
const widgets_1 = require("@phosphor/widgets");
/**
 * A panel that supports a collapsible header made from the widget's title.
 * Clicking on the title expands or contracts the widget.
 */
class Collapse extends widgets_1.Widget {
    constructor(options) {
        super(options);
        this._collapseChanged = new signaling_1.Signal(this);
        const { widget, collapsed = true } = options;
        this.addClass('jp-Collapse');
        this._header = new widgets_1.Widget();
        this._header.addClass('jp-Collapse-header');
        this._content = new widgets_1.Panel();
        this._content.addClass('jp-Collapse-contents');
        let layout = new widgets_1.PanelLayout();
        this.layout = layout;
        layout.addWidget(this._header);
        layout.addWidget(this._content);
        this.widget = widget;
        this.collapsed = collapsed;
    }
    /**
     * The widget inside the collapse panel.
     */
    get widget() {
        return this._widget;
    }
    set widget(widget) {
        let oldWidget = this._widget;
        if (oldWidget) {
            oldWidget.title.changed.disconnect(this._onTitleChanged, this);
            oldWidget.parent = null;
        }
        this._widget = widget;
        widget.title.changed.connect(this._onTitleChanged, this);
        this._onTitleChanged(widget.title);
        this._content.addWidget(widget);
    }
    /**
     * The collapsed state of the panel.
     */
    get collapsed() {
        return this._collapsed;
    }
    set collapsed(value) {
        if (value === this._collapsed) {
            return;
        }
        if (value) {
            this._collapse();
        }
        else {
            this._uncollapse();
        }
    }
    /**
     * A signal for when the widget collapse state changes.
     */
    get collapseChanged() {
        return this._collapseChanged;
    }
    /**
     * Toggle the collapse state of the panel.
     */
    toggle() {
        this.collapsed = !this.collapsed;
    }
    /**
     * Dispose the widget.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        // Delete references we explicitly hold to other widgets.
        delete this._header;
        delete this._widget;
        delete this._content;
        super.dispose();
    }
    /**
     * Handle the DOM events for the Collapse widget.
     *
     * @param event - The DOM event sent to the panel.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the panel's DOM node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'click':
                this._evtClick(event);
                break;
            default:
                break;
        }
    }
    onAfterAttach(msg) {
        this._header.node.addEventListener('click', this);
    }
    onBeforeDetach(msg) {
        this._header.node.removeEventListener('click', this);
    }
    _collapse() {
        this._collapsed = true;
        if (this._content) {
            this._content.hide();
        }
        this.removeClass('jp-Collapse-open');
        this._collapseChanged.emit(void 0);
    }
    _uncollapse() {
        this._collapsed = false;
        if (this._content) {
            this._content.show();
        }
        this.addClass('jp-Collapse-open');
        this._collapseChanged.emit(void 0);
    }
    _evtClick(event) {
        this.toggle();
    }
    /**
     * Handle the `changed` signal of a title object.
     */
    _onTitleChanged(sender) {
        this._header.node.textContent = this._widget.title.label;
    }
}
exports.Collapse = Collapse;
