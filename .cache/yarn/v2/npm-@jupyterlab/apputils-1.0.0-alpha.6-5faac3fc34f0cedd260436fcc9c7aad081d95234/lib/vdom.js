"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const messaging_1 = require("@phosphor/messaging");
const signaling_1 = require("@phosphor/signaling");
const widgets_1 = require("@phosphor/widgets");
const React = __importStar(require("react"));
const ReactDOM = __importStar(require("react-dom"));
/**
 * An abstract class for a Phosphor widget which renders a React component.
 */
class ReactWidget extends widgets_1.Widget {
    /**
     * Creates a new `ReactWidget` that renders a constant element.
     * @param element React element to render.
     */
    static create(element) {
        return new class extends ReactWidget {
            render() {
                return element;
            }
        }();
    }
    /**
     * Called to update the state of the widget.
     *
     * The default implementation of this method triggers
     * VDOM based rendering by calling the `renderDOM` method.
     */
    onUpdateRequest(msg) {
        this.renderPromise = this.renderDOM();
    }
    /**
     * Called after the widget is attached to the DOM
     */
    onAfterAttach(msg) {
        // Make *sure* the widget is rendered.
        messaging_1.MessageLoop.sendMessage(this, widgets_1.Widget.Msg.UpdateRequest);
    }
    /**
     * Called before the widget is detached from the DOM.
     */
    onBeforeDetach(msg) {
        // Unmount the component so it can tear down.
        ReactDOM.unmountComponentAtNode(this.node);
    }
    /**
     * Render the React nodes to the DOM.
     *
     * @returns a promise that resolves when the rendering is done.
     */
    renderDOM() {
        return new Promise(resolve => {
            let vnode = this.render();
            // Split up the array/element cases so type inference chooses the right
            // signature.
            if (Array.isArray(vnode)) {
                ReactDOM.render(vnode, this.node, resolve);
            }
            else {
                ReactDOM.render(vnode, this.node, resolve);
            }
        });
    }
}
exports.ReactWidget = ReactWidget;
/**
 * An abstract ReactWidget with a model.
 */
class VDomRenderer extends ReactWidget {
    constructor() {
        super(...arguments);
        this._modelChanged = new signaling_1.Signal(this);
    }
    /**
     * A signal emitted when the model changes.
     */
    get modelChanged() {
        return this._modelChanged;
    }
    /**
     * Set the model and fire changed signals.
     */
    set model(newValue) {
        if (this._model === newValue) {
            return;
        }
        if (this._model) {
            this._model.stateChanged.disconnect(this.update, this);
        }
        this._model = newValue;
        if (newValue) {
            newValue.stateChanged.connect(this.update, this);
        }
        this.update();
        this._modelChanged.emit(void 0);
    }
    /**
     * Get the current model.
     */
    get model() {
        return this._model;
    }
    /**
     * Dispose this widget.
     */
    dispose() {
        this._model = null;
        super.dispose();
    }
}
exports.VDomRenderer = VDomRenderer;
/**
 * UseSignal provides a way to hook up a Phosphor signal to a React element,
 * so that the element is re-rendered every time the signal fires.
 *
 * It is implemented through the "render props" technique, using the `children`
 * prop as a function to render, so that it can be used either as a prop or as a child
 * of this element
 * https://reactjs.org/docs/render-props.html
 *
 *
 * Example as child:
 *
 * ```
 * function LiveButton(isActiveSignal: ISignal<any, boolean>) {
 *  return (
 *    <UseSignal signal={isActiveSignal} initialArgs={True}>
 *     {(_, isActive) => <Button isActive={isActive}>}
 *    </UseSignal>
 *  )
 * }
 * ```
 *
 * Example as prop:
 *
 * ```
 * function LiveButton(isActiveSignal: ISignal<any, boolean>) {
 *  return (
 *    <UseSignal
 *      signal={isActiveSignal}
 *      initialArgs={True}
 *      children={(_, isActive) => <Button isActive={isActive}>}
 *    />
 *  )
 * }
 */
class UseSignal extends React.Component {
    constructor(props) {
        super(props);
        this.slot = (sender, args) => {
            // skip setting new state if we have a shouldUpdate function and it returns false
            if (this.props.shouldUpdate && !this.props.shouldUpdate(sender, args)) {
                return;
            }
            this.setState({ value: [sender, args] });
        };
        this.state = { value: [this.props.initialSender, this.props.initialArgs] };
    }
    componentDidMount() {
        this.props.signal.connect(this.slot);
    }
    componentWillUnmount() {
        this.props.signal.disconnect(this.slot);
    }
    render() {
        return this.props.children(...this.state.value);
    }
}
exports.UseSignal = UseSignal;
/**
 * Concrete implementation of VDomRenderer model.
 */
class VDomModel {
    constructor() {
        /**
         * A signal emitted when any model state changes.
         */
        this.stateChanged = new signaling_1.Signal(this);
        this._isDisposed = false;
    }
    /**
     * Test whether the model is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose the model.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        signaling_1.Signal.clearData(this);
    }
}
exports.VDomModel = VDomModel;
