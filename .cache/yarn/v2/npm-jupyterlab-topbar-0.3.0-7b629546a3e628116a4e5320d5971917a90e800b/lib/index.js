"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apputils_1 = require("@jupyterlab/apputils");
const algorithm_1 = require("@phosphor/algorithm");
const coreutils_1 = require("@phosphor/coreutils");
const domutils_1 = require("@phosphor/domutils");
const dragdrop_1 = require("@phosphor/dragdrop");
const signaling_1 = require("@phosphor/signaling");
require("../style/index.css");
const CONTENTS_MIME = 'application/x-jupyterlab-topbar';
const TOPBAR_CLASS = 'jp-TopBar';
const CONTENT_CLASS = 'jp-TopBar-item';
const DRAG_CONTENT_CLASS = 'jp-TopBar-DragItem';
const DROP_TARGET_CLASS = 'jp-TopBar-DropTarget';
const DRAG_THRESHOLD = 5;
exports.ITopBar = new coreutils_1.Token('jupyterlab-topbar:ITopBar');
class TopBar extends apputils_1.Toolbar {
    constructor() {
        super();
        this._drag = null;
        this._dragData = null;
        this.addClass(TOPBAR_CLASS);
        this._changed = new signaling_1.Signal(this);
    }
    get changed() {
        return this._changed;
    }
    addItem(name, item) {
        item.addClass(CONTENT_CLASS);
        return super.addItem(name, item);
    }
    setOrder(order) {
        let layout = this.layout;
        let mapping = {};
        algorithm_1.each(this.names(), (name, i) => { mapping[name] = layout.widgets[i]; });
        // re-add items in order
        order.forEach((name, pos) => {
            if (!mapping.hasOwnProperty(name))
                return;
            layout.insertWidget(pos, mapping[name]);
        });
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        let node = this.node;
        node.addEventListener('mousedown', this, true);
        node.addEventListener('mousedown', this);
        node.addEventListener('p-dragenter', this);
        node.addEventListener('p-dragleave', this);
        node.addEventListener('p-dragover', this);
        node.addEventListener('p-drop', this);
    }
    onBeforeDetach(msg) {
        let node = this.node;
        node.removeEventListener('mousedown', this, true);
        node.removeEventListener('mousedown', this);
        node.removeEventListener('p-dragenter', this);
        node.removeEventListener('p-dragleave', this);
        node.removeEventListener('p-dragover', this);
        node.removeEventListener('p-drop', this);
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
    }
    handleEvent(event) {
        switch (event.type) {
            case 'mousedown':
                this._evtMousedown(event);
                break;
            case 'mouseup':
                this._evtMouseup(event);
                break;
            case 'mousemove':
                this._evtMousemove(event);
                break;
            case 'p-dragenter':
                this._evtDragEnter(event);
                break;
            case 'p-dragleave':
                this._evtDragLeave(event);
                break;
            case 'p-dragover':
                this._evtDragOver(event);
                break;
            case 'p-drop':
                this._evtDrop(event);
                break;
            default:
                break;
        }
    }
    _evtMousedown(event) {
        let index = Private.hitTestNodes(this.node.children, event.clientX, event.clientY);
        if (index === -1) {
            return;
        }
        if (event.button === 0) {
            this._dragData = {
                pressX: event.clientX,
                pressY: event.clientY,
                index: index
            };
            document.addEventListener('mouseup', this, true);
            document.addEventListener('mousemove', this, true);
        }
    }
    _evtMouseup(event) {
        if (event.button !== 0 || !this._drag) {
            document.removeEventListener('mousemove', this, true);
            document.removeEventListener('mouseup', this, true);
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }
    _evtMousemove(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this._drag || !this._dragData) {
            return;
        }
        let data = this._dragData;
        let dx = Math.abs(event.clientX - data.pressX);
        let dy = Math.abs(event.clientY - data.pressY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            return;
        }
        this._startDrag(data.index, event.clientX, event.clientY);
    }
    _evtDragEnter(event) {
        if (!event.mimeData.hasData(CONTENTS_MIME)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        let target = event.target;
        let index = Private.findWidget(this.node.children, target);
        if (index === -1) {
            return;
        }
        let widget = this.layout.widgets[index];
        widget.node.classList.add(DROP_TARGET_CLASS);
    }
    _evtDragLeave(event) {
        if (!event.mimeData.hasData(CONTENTS_MIME)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        let elements = this.node.getElementsByClassName(DROP_TARGET_CLASS);
        if (elements.length) {
            elements[0].classList.remove(DROP_TARGET_CLASS);
        }
    }
    _evtDragOver(event) {
        if (!event.mimeData.hasData(CONTENTS_MIME)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dropAction = event.proposedAction;
        let elements = this.node.getElementsByClassName(DROP_TARGET_CLASS);
        if (elements.length) {
            elements[0].classList.remove(DROP_TARGET_CLASS);
        }
        let target = this._findRootItem(event.target);
        let index = Private.findWidget(this.node.children, target);
        if (index === -1) {
            return;
        }
        let widget = this.layout.widgets[index];
        widget.node.classList.add(DROP_TARGET_CLASS);
    }
    _findRootItem(node) {
        while (node && this.node !== node.parentElement) {
            if (node.classList.contains(CONTENT_CLASS)) {
            }
            node = node.parentElement;
        }
        return node;
    }
    _evtDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.proposedAction === 'none') {
            event.dropAction = 'none';
            return;
        }
        if (!event.mimeData.hasData(CONTENTS_MIME)) {
            return;
        }
        let target = event.target;
        while (target && target.parentElement) {
            if (target.classList.contains(DROP_TARGET_CLASS)) {
                target.classList.remove(DROP_TARGET_CLASS);
                break;
            }
            target = target.parentElement;
        }
        let index = Private.findWidget(this.node.children, target);
        if (index === -1) {
            return;
        }
        const prevNames = algorithm_1.toArray(this.names());
        const layout = this.layout;
        const startIndex = this._dragData.index;
        const widget = layout.widgets[startIndex];
        layout.insertWidget(index, widget);
        const newNames = algorithm_1.toArray(this.names());
        const equal = algorithm_1.every(algorithm_1.map(newNames, (value, i) => value === prevNames[i]), v => v);
        if (!equal) {
            this._changed.emit(newNames);
        }
    }
    _startDrag(index, clientX, clientY) {
        const item = this.node.children[index];
        let dragImage = Private.createDragImage(item);
        this._drag = new dragdrop_1.Drag({
            dragImage,
            mimeData: new coreutils_1.MimeData(),
            supportedActions: 'move',
            proposedAction: 'move'
        });
        this._drag.mimeData.setData(CONTENTS_MIME, index);
        document.removeEventListener('mousemove', this, true);
        document.removeEventListener('mouseup', this, true);
        void this._drag.start(clientX, clientY).then(action => {
            this._drag = null;
        });
    }
}
exports.TopBar = TopBar;
(function (TopBar) {
    function createSpacerItem() {
        return apputils_1.Toolbar.createSpacerItem();
    }
    TopBar.createSpacerItem = createSpacerItem;
})(TopBar = exports.TopBar || (exports.TopBar = {}));
var Private;
(function (Private) {
    function hitTestNodes(nodes, x, y) {
        return algorithm_1.ArrayExt.findFirstIndex(nodes, node => domutils_1.ElementExt.hitTest(node, x, y));
    }
    Private.hitTestNodes = hitTestNodes;
    function findWidget(nodes, target) {
        return algorithm_1.ArrayExt.findFirstIndex(nodes, node => node === target);
    }
    Private.findWidget = findWidget;
    function createDragImage(node) {
        let dragImage = node.cloneNode(true);
        dragImage.className = DRAG_CONTENT_CLASS;
        if (!node.innerHTML) {
            dragImage.style.width = `${node.clientWidth}px`;
            dragImage.style.height = `${node.clientHeight}px`;
        }
        return dragImage;
    }
    Private.createDragImage = createDragImage;
})(Private || (Private = {}));
