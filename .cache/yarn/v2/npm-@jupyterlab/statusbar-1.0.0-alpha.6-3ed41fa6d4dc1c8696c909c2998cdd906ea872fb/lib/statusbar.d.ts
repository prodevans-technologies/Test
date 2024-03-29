import { ISignal } from '@phosphor/signaling';
import { Token } from '@phosphor/coreutils';
import { IDisposable } from '@phosphor/disposable';
import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
export declare const IStatusBar: Token<IStatusBar>;
/**
 * Main status bar object which contains all widgets.
 */
export interface IStatusBar {
    /**
     * Register a new status item.
     *
     * @param id - a unique id for the status item.
     *
     * @param options - The options for how to add the status item.
     *
     * @returns an `IDisposable` that can be disposed to remove the item.
     */
    registerStatusItem(id: string, statusItem: IStatusBar.IItem): IDisposable;
}
/**
 * A namespace for status bar statics.
 */
export declare namespace IStatusBar {
    type Alignment = 'right' | 'left' | 'middle';
    /**
     * Options for status bar items.
     */
    interface IItem {
        /**
         * The item to add to the status bar.
         */
        item: Widget;
        /**
         * Which side to place item.
         * Permanent items are intended for the right and left side,
         * with more transient items in the middle.
         */
        align?: Alignment;
        /**
         *  Ordering of Items -- higher rank items are closer to the middle.
         */
        rank?: number;
        /**
         * Whether the item is shown or hidden.
         */
        isActive?: () => boolean;
        /**
         * A signal that is fired when the item active state changes.
         */
        activeStateChanged?: ISignal<any, void>;
    }
}
/**
 * Main status bar object which contains all items.
 */
export declare class StatusBar extends Widget implements IStatusBar {
    constructor();
    /**
     * Register a new status item.
     *
     * @param id - a unique id for the status item.
     *
     * @param statusItem - The item to add to the status bar.
     */
    registerStatusItem(id: string, statusItem: IStatusBar.IItem): IDisposable;
    /**
     * Dispose of the status bar.
     */
    dispose(): void;
    /**
     * Handle an 'update-request' message to the status bar.
     */
    protected onUpdateRequest(msg: Message): void;
    private _findInsertIndex;
    private _refreshItem;
    private _refreshAll;
    private _leftRankItems;
    private _rightRankItems;
    private _statusItems;
    private _disposables;
    private _leftSide;
    private _middlePanel;
    private _rightSide;
}
