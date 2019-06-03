import { Toolbar } from '@jupyterlab/apputils';
import { Token } from '@phosphor/coreutils';
import { Message } from '@phosphor/messaging';
import { ISignal } from '@phosphor/signaling';
import { Widget } from '@phosphor/widgets';
import '../style/index.css';
export declare const ITopBar: Token<ITopBar>;
export interface ITopBar {
    addItem(name: string, item: Widget): boolean;
}
export declare class TopBar extends Toolbar<Widget> implements ITopBar {
    constructor();
    readonly changed: ISignal<TopBar, string[]>;
    addItem(name: string, item: Widget): boolean;
    setOrder(order: string[]): void;
    protected onAfterAttach(msg: Message): void;
    protected onBeforeDetach(msg: Message): void;
    handleEvent(event: Event): void;
    private _evtMousedown;
    private _evtMouseup;
    private _evtMousemove;
    private _evtDragEnter;
    private _evtDragLeave;
    private _evtDragOver;
    private _findRootItem;
    private _evtDrop;
    private _startDrag;
    private _drag;
    private _dragData;
    private _changed;
}
export declare namespace TopBar {
    function createSpacerItem(): Widget;
}
