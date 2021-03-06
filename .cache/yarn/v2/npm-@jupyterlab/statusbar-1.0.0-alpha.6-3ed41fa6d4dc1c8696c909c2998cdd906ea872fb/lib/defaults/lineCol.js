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
const lineForm_1 = require("../style/lineForm");
const lib_1 = require("typestyle/lib");
/**
 * A component for rendering a "go-to-line" form.
 */
class LineFormComponent extends react_1.default.Component {
    /**
     * Construct a new LineFormComponent.
     */
    constructor(props) {
        super(props);
        /**
         * Handle a change to the value in the input field.
         */
        this._handleChange = (event) => {
            this.setState({ value: event.currentTarget.value });
        };
        /**
         * Handle submission of the input field.
         */
        this._handleSubmit = (event) => {
            event.preventDefault();
            const value = parseInt(this._textInput.value, 10);
            if (!isNaN(value) &&
                isFinite(value) &&
                1 <= value &&
                value <= this.props.maxLine) {
                this.props.handleSubmit(value);
            }
            return false;
        };
        /**
         * Handle focusing of the input field.
         */
        this._handleFocus = () => {
            this.setState({ hasFocus: true });
        };
        /**
         * Handle blurring of the input field.
         */
        this._handleBlur = () => {
            this.setState({ hasFocus: false });
        };
        this._textInput = null;
        this.state = {
            value: '',
            hasFocus: false
        };
    }
    /**
     * Focus the element on mount.
     */
    componentDidMount() {
        this._textInput.focus();
    }
    /**
     * Render the LineFormComponent.
     */
    render() {
        return (react_1.default.createElement("div", { className: lineForm_1.lineFormSearch },
            react_1.default.createElement("form", { name: "lineColumnForm", onSubmit: this._handleSubmit, noValidate: true },
                react_1.default.createElement("div", { className: lib_1.classes(lineForm_1.lineFormWrapper, 'p-lineForm-wrapper', this.state.hasFocus ? lineForm_1.lineFormWrapperFocusWithin : undefined) },
                    react_1.default.createElement("input", { type: "text", className: lineForm_1.lineFormInput, onChange: this._handleChange, onFocus: this._handleFocus, onBlur: this._handleBlur, value: this.state.value, ref: input => {
                            this._textInput = input;
                        } }),
                    react_1.default.createElement("input", { type: "submit", className: lib_1.classes(lineForm_1.lineFormButton, 'jp-StatusItem-line-form'), value: "" })),
                react_1.default.createElement("label", { className: lineForm_1.lineFormCaption },
                    "Go to line number between 1 and ",
                    this.props.maxLine))));
    }
}
/**
 * A pure functional component for rendering a line/column
 * status item.
 */
function LineColComponent(props) {
    return (react_1.default.createElement(__1.TextItem, { onClick: props.handleClick, source: `Ln ${props.line}, Col ${props.column}`, title: "Go to line number\u2026" }));
}
/**
 * A widget implementing a line/column status item.
 */
class LineCol extends apputils_1.VDomRenderer {
    /**
     * Construct a new LineCol status item.
     */
    constructor() {
        super();
        this._popup = null;
        this.model = new LineCol.Model();
        this.addClass(__1.interactiveItem);
    }
    /**
     * Render the status item.
     */
    render() {
        if (this.model === null) {
            return null;
        }
        else {
            return (react_1.default.createElement(LineColComponent, { line: this.model.line, column: this.model.column, handleClick: () => this._handleClick() }));
        }
    }
    /**
     * A click handler for the widget.
     */
    _handleClick() {
        if (this._popup) {
            this._popup.dispose();
        }
        const body = apputils_1.ReactWidget.create(react_1.default.createElement(LineFormComponent, { handleSubmit: val => this._handleSubmit(val), currentLine: this.model.line, maxLine: this.model.editor.lineCount }));
        this._popup = __1.showPopup({
            body: body,
            anchor: this,
            align: 'right'
        });
    }
    /**
     * Handle submission for the widget.
     */
    _handleSubmit(value) {
        this.model.editor.setCursorPosition({ line: value - 1, column: 0 });
        this._popup.dispose();
        this.model.editor.focus();
    }
}
exports.LineCol = LineCol;
/**
 * A namespace for LineCol statics.
 */
(function (LineCol) {
    /**
     * A VDom model for a status item tracking the line/column of an editor.
     */
    class Model extends apputils_1.VDomModel {
        constructor() {
            super(...arguments);
            /**
             * React to a change in the cursors of the current editor.
             */
            this._onSelectionChanged = () => {
                const oldState = this._getAllState();
                const pos = this.editor.getCursorPosition();
                this._line = pos.line + 1;
                this._column = pos.column + 1;
                this._triggerChange(oldState, this._getAllState());
            };
            this._line = 1;
            this._column = 1;
            this._editor = null;
        }
        /**
         * The current editor of the model.
         */
        get editor() {
            return this._editor;
        }
        set editor(editor) {
            const oldEditor = this._editor;
            if (oldEditor) {
                oldEditor.model.selections.changed.disconnect(this._onSelectionChanged);
            }
            const oldState = this._getAllState();
            this._editor = editor;
            if (!this._editor) {
                this._column = 1;
                this._line = 1;
            }
            else {
                this._editor.model.selections.changed.connect(this._onSelectionChanged);
                const pos = this._editor.getCursorPosition();
                this._column = pos.column + 1;
                this._line = pos.line + 1;
            }
            this._triggerChange(oldState, this._getAllState());
        }
        /**
         * The current line of the model.
         */
        get line() {
            return this._line;
        }
        /**
         * The current column of the model.
         */
        get column() {
            return this._column;
        }
        _getAllState() {
            return [this._line, this._column];
        }
        _triggerChange(oldState, newState) {
            if (oldState[0] !== newState[0] || oldState[1] !== newState[1]) {
                this.stateChanged.emit(void 0);
            }
        }
    }
    LineCol.Model = Model;
})(LineCol = exports.LineCol || (exports.LineCol = {}));
