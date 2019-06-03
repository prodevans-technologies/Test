"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_1 = require("@phosphor/coreutils");
const properties_1 = require("@phosphor/properties");
const signaling_1 = require("@phosphor/signaling");
const widgets_1 = require("@phosphor/widgets");
/**
 * A class that keeps track of widget instances on an Application shell.
 *
 * #### Notes
 * The API surface area of this concrete implementation is substantially larger
 * than the instance tracker interface it implements. The interface is intended
 * for export by JupyterLab plugins that create widgets and have clients who may
 * wish to keep track of newly created widgets. This class, however, can be used
 * internally by plugins to restore state as well.
 */
class InstanceTracker {
    /**
     * Create a new instance tracker.
     *
     * @param options - The instantiation options for an instance tracker.
     */
    constructor(options) {
        this._hasRestored = false;
        this._restore = null;
        this._restored = new coreutils_1.PromiseDelegate();
        this._tracker = new widgets_1.FocusTracker();
        this._currentChanged = new signaling_1.Signal(this);
        this._widgetAdded = new signaling_1.Signal(this);
        this._widgetUpdated = new signaling_1.Signal(this);
        this._widgets = [];
        this._currentWidget = null;
        this._isDisposed = false;
        this.namespace = options.namespace;
        this._tracker.currentChanged.connect(this._onCurrentChanged, this);
    }
    /**
     * A signal emitted when the current widget changes.
     */
    get currentChanged() {
        return this._currentChanged;
    }
    /**
     * A signal emitted when a widget is added.
     *
     * #### Notes
     * This signal will only fire when a widget is added to the tracker. It will
     * not fire if a widget is injected into the tracker.
     */
    get widgetAdded() {
        return this._widgetAdded;
    }
    /**
     * A signal emitted when a widget is updated.
     */
    get widgetUpdated() {
        return this._widgetUpdated;
    }
    /**
     * The current widget is the most recently focused or added widget.
     *
     * #### Notes
     * It is the most recently focused widget, or the most recently added
     * widget if no widget has taken focus.
     */
    get currentWidget() {
        return this._currentWidget;
    }
    /**
     * A promise resolved when the instance tracker has been restored.
     */
    get restored() {
        return this._restored.promise;
    }
    /**
     * The number of widgets held by the tracker.
     */
    get size() {
        return this._tracker.widgets.length;
    }
    /**
     * Add a new widget to the tracker.
     *
     * @param widget - The widget being added.
     *
     * #### Notes
     * When a widget is added its state is saved to the state database.
     * This function returns a promise that is resolved when that saving
     * is completed. However, the widget is added to the in-memory tracker
     * synchronously, and is available to use before the promise is resolved.
     */
    add(widget) {
        if (widget.isDisposed) {
            const warning = `${widget.id} is disposed and cannot be tracked.`;
            console.warn(warning);
            return Promise.reject(warning);
        }
        if (this._tracker.has(widget)) {
            const warning = `${widget.id} already exists in the tracker.`;
            console.warn(warning);
            return Promise.reject(warning);
        }
        this._tracker.add(widget);
        this._widgets.push(widget);
        let injected = Private.injectedProperty.get(widget);
        let promise = Promise.resolve(void 0);
        if (injected) {
            return promise;
        }
        widget.disposed.connect(this._onWidgetDisposed, this);
        // Handle widget state restoration.
        if (this._restore) {
            let { state } = this._restore;
            let widgetName = this._restore.name(widget);
            if (widgetName) {
                let name = `${this.namespace}:${widgetName}`;
                let data = this._restore.args(widget);
                Private.nameProperty.set(widget, name);
                promise = state.save(name, { data });
            }
        }
        // If there is no focused widget, set this as the current widget.
        if (!this._tracker.currentWidget) {
            this._currentWidget = widget;
            this.onCurrentChanged(widget);
            this._currentChanged.emit(widget);
        }
        // Emit the widget added signal.
        this._widgetAdded.emit(widget);
        return promise;
    }
    /**
     * Test whether the tracker is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources held by the tracker.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        signaling_1.Signal.clearData(this);
        this._tracker.dispose();
    }
    /**
     * Find the first widget in the tracker that satisfies a filter function.
     *
     * @param - fn The filter function to call on each widget.
     *
     * #### Notes
     * If no widget is found, the value returned is `undefined`.
     */
    find(fn) {
        return algorithm_1.find(this._tracker.widgets, fn);
    }
    /**
     * Iterate through each widget in the tracker.
     *
     * @param fn - The function to call on each widget.
     */
    forEach(fn) {
        algorithm_1.each(this._tracker.widgets, widget => {
            fn(widget);
        });
    }
    /**
     * Filter the widgets in the tracker based on a predicate.
     *
     * @param fn - The function by which to filter.
     */
    filter(fn) {
        return this._tracker.widgets.filter(fn);
    }
    /**
     * Inject a foreign widget into the instance tracker.
     *
     * @param widget - The widget to inject into the tracker.
     *
     * #### Notes
     * Any widgets injected into an instance tracker will not have their state
     * saved by the tracker. The primary use case for widget injection is for a
     * plugin that offers a sub-class of an extant plugin to have its instances
     * share the same commands as the parent plugin (since most relevant commands
     * will use the `currentWidget` of the parent plugin's instance tracker). In
     * this situation, the sub-class plugin may well have its own instance tracker
     * for layout and state restoration in addition to injecting its widgets into
     * the parent plugin's instance tracker.
     */
    inject(widget) {
        Private.injectedProperty.set(widget, true);
        void this.add(widget);
    }
    /**
     * Check if this tracker has the specified widget.
     *
     * @param widget - The widget whose existence is being checked.
     */
    has(widget) {
        return this._tracker.has(widget);
    }
    /**
     * Restore the widgets in this tracker's namespace.
     *
     * @param options - The configuration options that describe restoration.
     *
     * @returns A promise that resolves when restoration has completed.
     *
     * #### Notes
     * This function should almost never be invoked by client code. Its primary
     * use case is to be invoked by a layout restorer plugin that handles
     * multiple instance trackers and, when ready, asks them each to restore their
     * respective widgets.
     */
    restore(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._hasRestored) {
                throw new Error('Instance tracker has already restored');
            }
            this._hasRestored = true;
            const { command, registry, state, when } = options;
            const namespace = this.namespace;
            const promises = when
                ? [state.list(namespace)].concat(when)
                : [state.list(namespace)];
            this._restore = options;
            const [saved] = yield Promise.all(promises);
            const values = yield Promise.all(saved.ids.map((id, index) => {
                const value = saved.values[index];
                const args = value && value.data;
                if (args === undefined) {
                    return state.remove(id);
                }
                // Execute the command and if it fails, delete the state restore data.
                return registry.execute(command, args).catch(() => state.remove(id));
            }));
            this._restored.resolve(undefined);
            return values;
        });
    }
    /**
     * Save the restore data for a given widget.
     *
     * @param widget - The widget being saved.
     */
    save(widget) {
        return __awaiter(this, void 0, void 0, function* () {
            const injected = Private.injectedProperty.get(widget);
            if (!this._restore || !this.has(widget) || injected) {
                return;
            }
            const { state } = this._restore;
            const widgetName = this._restore.name(widget);
            const oldName = Private.nameProperty.get(widget);
            const newName = widgetName ? `${this.namespace}:${widgetName}` : '';
            if (oldName && oldName !== newName) {
                yield state.remove(oldName);
            }
            // Set the name property irrespective of whether the new name is null.
            Private.nameProperty.set(widget, newName);
            if (newName) {
                const data = this._restore.args(widget);
                yield state.save(newName, { data });
            }
            if (oldName !== newName) {
                this._widgetUpdated.emit(widget);
            }
        });
    }
    /**
     * Handle the current change event.
     *
     * #### Notes
     * The default implementation is a no-op.
     */
    onCurrentChanged(value) {
        /* no-op */
    }
    /**
     * Handle the current change signal from the internal focus tracker.
     */
    _onCurrentChanged(sender, args) {
        // Bail if the active widget did not change.
        if (args.newValue === this._currentWidget) {
            return;
        }
        this._currentWidget = args.newValue;
        this.onCurrentChanged(args.newValue);
        this._currentChanged.emit(args.newValue);
    }
    /**
     * Clean up after disposed widgets.
     */
    _onWidgetDisposed(widget) {
        const injected = Private.injectedProperty.get(widget);
        if (injected) {
            return;
        }
        // Handle widget removal.
        algorithm_1.ArrayExt.removeFirstOf(this._widgets, widget);
        // Handle the current widget being disposed.
        if (widget === this._currentWidget) {
            this._currentWidget =
                this._tracker.currentWidget ||
                    this._widgets[this._widgets.length - 1] ||
                    null;
            this.onCurrentChanged(this._currentWidget);
            this._currentChanged.emit(this._currentWidget);
        }
        // If there is no restore data, return.
        if (!this._restore) {
            return;
        }
        const { state } = this._restore;
        const name = Private.nameProperty.get(widget);
        if (name) {
            void state.remove(name);
        }
    }
}
exports.InstanceTracker = InstanceTracker;
/*
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * An attached property to indicate whether a widget has been injected.
     */
    Private.injectedProperty = new properties_1.AttachedProperty({
        name: 'injected',
        create: () => false
    });
    /**
     * An attached property for a widget's ID in the state database.
     */
    Private.nameProperty = new properties_1.AttachedProperty({
        name: 'name',
        create: () => ''
    });
})(Private || (Private = {}));
