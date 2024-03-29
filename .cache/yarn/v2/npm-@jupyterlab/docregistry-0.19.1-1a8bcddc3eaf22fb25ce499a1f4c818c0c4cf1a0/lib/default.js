"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const codemirror_1 = require("@jupyterlab/codemirror");
const signaling_1 = require("@phosphor/signaling");
const apputils_1 = require("@jupyterlab/apputils");
const codeeditor_1 = require("@jupyterlab/codeeditor");
const coreutils_1 = require("@jupyterlab/coreutils");
/**
 * The default implementation of a document model.
 */
class DocumentModel extends codeeditor_1.CodeEditor.Model {
    /**
     * Construct a new document model.
     */
    constructor(languagePreference, modelDB) {
        super({ modelDB });
        this._defaultLang = '';
        this._dirty = false;
        this._readOnly = false;
        this._contentChanged = new signaling_1.Signal(this);
        this._stateChanged = new signaling_1.Signal(this);
        this._defaultLang = languagePreference || '';
        this.value.changed.connect(this.triggerContentChange, this);
    }
    /**
     * A signal emitted when the document content changes.
     */
    get contentChanged() {
        return this._contentChanged;
    }
    /**
     * A signal emitted when the document state changes.
     */
    get stateChanged() {
        return this._stateChanged;
    }
    /**
     * The dirty state of the document.
     */
    get dirty() {
        return this._dirty;
    }
    set dirty(newValue) {
        if (newValue === this._dirty) {
            return;
        }
        let oldValue = this._dirty;
        this._dirty = newValue;
        this.triggerStateChange({ name: 'dirty', oldValue, newValue });
    }
    /**
     * The read only state of the document.
     */
    get readOnly() {
        return this._readOnly;
    }
    set readOnly(newValue) {
        if (newValue === this._readOnly) {
            return;
        }
        let oldValue = this._readOnly;
        this._readOnly = newValue;
        this.triggerStateChange({ name: 'readOnly', oldValue, newValue });
    }
    /**
     * The default kernel name of the document.
     *
     * #### Notes
     * This is a read-only property.
     */
    get defaultKernelName() {
        return '';
    }
    /**
     * The default kernel language of the document.
     *
     * #### Notes
     * This is a read-only property.
     */
    get defaultKernelLanguage() {
        return this._defaultLang;
    }
    /**
     * Serialize the model to a string.
     */
    toString() {
        return this.value.text;
    }
    /**
     * Deserialize the model from a string.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromString(value) {
        this.value.text = value;
    }
    /**
     * Serialize the model to JSON.
     */
    toJSON() {
        return JSON.parse(this.value.text || 'null');
    }
    /**
     * Deserialize the model from JSON.
     *
     * #### Notes
     * Should emit a [contentChanged] signal.
     */
    fromJSON(value) {
        this.fromString(JSON.stringify(value));
    }
    /**
     * Initialize the model with its current state.
     */
    initialize() {
        return;
    }
    /**
     * Trigger a state change signal.
     */
    triggerStateChange(args) {
        this._stateChanged.emit(args);
    }
    /**
     * Trigger a content changed signal.
     */
    triggerContentChange() {
        this._contentChanged.emit(void 0);
        this.dirty = true;
    }
}
exports.DocumentModel = DocumentModel;
/**
 * An implementation of a model factory for text files.
 */
class TextModelFactory {
    constructor() {
        this._isDisposed = false;
    }
    /**
     * The name of the model type.
     *
     * #### Notes
     * This is a read-only property.
     */
    get name() {
        return 'text';
    }
    /**
     * The type of the file.
     *
     * #### Notes
     * This is a read-only property.
     */
    get contentType() {
        return 'file';
    }
    /**
     * The format of the file.
     *
     * This is a read-only property.
     */
    get fileFormat() {
        return 'text';
    }
    /**
     * Get whether the model factory has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the model factory.
     */
    dispose() {
        this._isDisposed = true;
    }
    /**
     * Create a new model.
     *
     * @param languagePreference - An optional kernel language preference.
     *
     * @returns A new document model.
     */
    createNew(languagePreference, modelDB) {
        return new DocumentModel(languagePreference, modelDB);
    }
    /**
     * Get the preferred kernel language given a file path.
     */
    preferredLanguage(path) {
        let mode = codemirror_1.Mode.findByFileName(path);
        return mode && mode.mode;
    }
}
exports.TextModelFactory = TextModelFactory;
/**
 * An implementation of a model factory for base64 files.
 */
class Base64ModelFactory extends TextModelFactory {
    /**
     * The name of the model type.
     *
     * #### Notes
     * This is a read-only property.
     */
    get name() {
        return 'base64';
    }
    /**
     * The type of the file.
     *
     * #### Notes
     * This is a read-only property.
     */
    get contentType() {
        return 'file';
    }
    /**
     * The format of the file.
     *
     * This is a read-only property.
     */
    get fileFormat() {
        return 'base64';
    }
}
exports.Base64ModelFactory = Base64ModelFactory;
/**
 * The default implementation of a widget factory.
 */
class ABCWidgetFactory {
    /**
     * Construct a new `ABCWidgetFactory`.
     */
    constructor(options) {
        this._isDisposed = false;
        this._widgetCreated = new signaling_1.Signal(this);
        this._name = options.name;
        this._readOnly = options.readOnly === undefined ? false : options.readOnly;
        this._defaultFor = options.defaultFor ? options.defaultFor.slice() : [];
        this._defaultRendered = (options.defaultRendered || []).slice();
        this._fileTypes = options.fileTypes.slice();
        this._modelName = options.modelName || 'text';
        this._preferKernel = !!options.preferKernel;
        this._canStartKernel = !!options.canStartKernel;
        this._toolbarFactory = options.toolbarFactory;
    }
    /**
     * A signal emitted when a widget is created.
     */
    get widgetCreated() {
        return this._widgetCreated;
    }
    /**
     * Get whether the model factory has been disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the document manager.
     */
    dispose() {
        this._isDisposed = true;
    }
    /**
     * Whether the widget factory is read only.
     */
    get readOnly() {
        return this._readOnly;
    }
    /**
     * The name of the widget to display in dialogs.
     */
    get name() {
        return this._name;
    }
    /**
     * The file types the widget can view.
     */
    get fileTypes() {
        return this._fileTypes.slice();
    }
    /**
     * The registered name of the model type used to create the widgets.
     */
    get modelName() {
        return this._modelName;
    }
    /**
     * The file types for which the factory should be the default.
     */
    get defaultFor() {
        return this._defaultFor.slice();
    }
    /**
     * The file types for which the factory should be the default for
     * rendering a document model, if different from editing.
     */
    get defaultRendered() {
        return this._defaultRendered.slice();
    }
    /**
     * Whether the widgets prefer having a kernel started.
     */
    get preferKernel() {
        return this._preferKernel;
    }
    /**
     * Whether the widgets can start a kernel when opened.
     */
    get canStartKernel() {
        return this._canStartKernel;
    }
    /**
     * Create a new widget given a document model and a context.
     *
     * #### Notes
     * It should emit the [widgetCreated] signal with the new widget.
     */
    createNew(context) {
        // Create the new widget
        const widget = this.createNewWidget(context);
        // Add toolbar items
        let items;
        if (this._toolbarFactory) {
            items = this._toolbarFactory(widget);
        }
        else {
            items = this.defaultToolbarFactory(widget);
        }
        items.forEach(({ name, widget: item }) => {
            widget.toolbar.addItem(name, item);
        });
        // Emit widget created signal
        this._widgetCreated.emit(widget);
        return widget;
    }
    /**
     * Default factory for toolbar items to be added after the widget is created.
     */
    defaultToolbarFactory(widget) {
        return [];
    }
}
exports.ABCWidgetFactory = ABCWidgetFactory;
/**
 * The class name added to a dirty widget.
 */
const DIRTY_CLASS = 'jp-mod-dirty';
/**
 * A document widget implementation.
 */
class DocumentWidget extends apputils_1.MainAreaWidget {
    constructor(options) {
        // Include the context ready promise in the widget reveal promise
        options.reveal = Promise.all([options.reveal, options.context.ready]);
        super(options);
        this.context = options.context;
        // Handle context path changes
        this.context.pathChanged.connect(this._onPathChanged, this);
        this._onPathChanged(this.context, this.context.path);
        // Listen for changes in the dirty state.
        this.context.model.stateChanged.connect(this._onModelStateChanged, this);
        this.context.ready.then(() => {
            this._handleDirtyState();
        });
    }
    /**
     * Handle a path change.
     */
    _onPathChanged(sender, path) {
        this.title.label = coreutils_1.PathExt.basename(sender.localPath);
    }
    /**
     * Handle a change to the context model state.
     */
    _onModelStateChanged(sender, args) {
        if (args.name === 'dirty') {
            this._handleDirtyState();
        }
    }
    /**
     * Handle the dirty state of the context model.
     */
    _handleDirtyState() {
        if (this.context.model.dirty) {
            this.title.className += ` ${DIRTY_CLASS}`;
        }
        else {
            this.title.className = this.title.className.replace(DIRTY_CLASS, '');
        }
    }
}
exports.DocumentWidget = DocumentWidget;
