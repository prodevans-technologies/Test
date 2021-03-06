"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const signaling_1 = require("@phosphor/signaling");
const widgets_1 = require("@phosphor/widgets");
const apputils_1 = require("@jupyterlab/apputils");
/**
 * The supported parsing delimiters.
 */
const DELIMITERS = [',', ';', '\t', '|'];
/**
 * The labels for each delimiter as they appear in the dropdown menu.
 */
const LABELS = [',', ';', 'tab', 'pipe'];
/**
 * The class name added to a csv toolbar widget.
 */
const CSV_DELIMITER_CLASS = 'jp-CSVDelimiter';
const CSV_DELIMITER_LABEL_CLASS = 'jp-CSVDelimiter-label';
/**
 * The class name added to a csv toolbar's dropdown element.
 */
const CSV_DELIMITER_DROPDOWN_CLASS = 'jp-CSVDelimiter-dropdown';
/**
 * A widget for selecting a delimiter.
 */
class CSVDelimiter extends widgets_1.Widget {
    /**
     * Construct a new csv table widget.
     */
    constructor(options) {
        super({ node: Private.createNode(options.selected) });
        this._delimiterChanged = new signaling_1.Signal(this);
        this.addClass(CSV_DELIMITER_CLASS);
    }
    /**
     * A signal emitted when the delimiter selection has changed.
     */
    get delimiterChanged() {
        return this._delimiterChanged;
    }
    /**
     * The delimiter dropdown menu.
     */
    get selectNode() {
        return this.node.getElementsByTagName('select')[0];
    }
    /**
     * Handle the DOM events for the widget.
     *
     * @param event - The DOM event sent to the widget.
     *
     * #### Notes
     * This method implements the DOM `EventListener` interface and is
     * called in response to events on the dock panel's node. It should
     * not be called directly by user code.
     */
    handleEvent(event) {
        switch (event.type) {
            case 'change':
                this._delimiterChanged.emit(this.selectNode.value);
                break;
            default:
                break;
        }
    }
    /**
     * Handle `after-attach` messages for the widget.
     */
    onAfterAttach(msg) {
        this.selectNode.addEventListener('change', this);
    }
    /**
     * Handle `before-detach` messages for the widget.
     */
    onBeforeDetach(msg) {
        this.selectNode.removeEventListener('change', this);
    }
}
exports.CSVDelimiter = CSVDelimiter;
/**
 * A namespace for private toolbar methods.
 */
var Private;
(function (Private) {
    /**
     * Create the node for the delimiter switcher.
     */
    function createNode(selected) {
        let div = document.createElement('div');
        let label = document.createElement('span');
        let select = document.createElement('select');
        label.textContent = 'Delimiter: ';
        label.className = CSV_DELIMITER_LABEL_CLASS;
        algorithm_1.each(algorithm_1.zip(DELIMITERS, LABELS), ([delimiter, label]) => {
            let option = document.createElement('option');
            option.value = delimiter;
            option.textContent = label;
            if (delimiter === selected) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        div.appendChild(label);
        let node = apputils_1.Styling.wrapSelect(select);
        node.classList.add(CSV_DELIMITER_DROPDOWN_CLASS);
        div.appendChild(node);
        return div;
    }
    Private.createNode = createNode;
})(Private || (Private = {}));
