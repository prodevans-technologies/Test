/// <reference types="react" />
import { ReactWidget } from './vdom';
import { IIterator } from '@phosphor/algorithm';
import { CommandRegistry } from '@phosphor/commands';
import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
import { IClientSession } from './clientsession';
/**
 * A class which provides a toolbar widget.
 */
export declare class Toolbar<T extends Widget = Widget> extends Widget {
    /**
     * Construct a new toolbar widget.
     */
    constructor();
    /**
     * Get an iterator over the ordered toolbar item names.
     *
     * @returns An iterator over the toolbar item names.
     */
    names(): IIterator<string>;
    /**
     * Add an item to the end of the toolbar.
     *
     * @param name - The name of the widget to add to the toolbar.
     *
     * @param widget - The widget to add to the toolbar.
     *
     * @param index - The optional name of the item to insert after.
     *
     * @returns Whether the item was added to toolbar.  Returns false if
     *   an item of the same name is already in the toolbar.
     *
     * #### Notes
     * The item can be removed from the toolbar by setting its parent to `null`.
     */
    addItem(name: string, widget: T): boolean;
    /**
     * Insert an item into the toolbar at the specified index.
     *
     * @param index - The index at which to insert the item.
     *
     * @param name - The name of the item.
     *
     * @param widget - The widget to add.
     *
     * @returns Whether the item was added to the toolbar. Returns false if
     *   an item of the same name is already in the toolbar.
     *
     * #### Notes
     * The index will be clamped to the bounds of the items.
     * The item can be removed from the toolbar by setting its parent to `null`.
     */
    insertItem(index: number, name: string, widget: T): boolean;
    /**
     * Insert an item into the toolbar at the after a target item.
     *
     * @param at - The target item to insert after.
     *
     * @param name - The name of the item.
     *
     * @param widget - The widget to add.
     *
     * @returns Whether the item was added to the toolbar. Returns false if
     *   an item of the same name is already in the toolbar.
     *
     * #### Notes
     * The index will be clamped to the bounds of the items.
     * The item can be removed from the toolbar by setting its parent to `null`.
     */
    insertAfter(at: string, name: string, widget: T): boolean;
    /**
     * Insert an item into the toolbar at the before a target item.
     *
     * @param at - The target item to insert before.
     *
     * @param name - The name of the item.
     *
     * @param widget - The widget to add.
     *
     * @returns Whether the item was added to the toolbar. Returns false if
     *   an item of the same name is already in the toolbar.
     *
     * #### Notes
     * The index will be clamped to the bounds of the items.
     * The item can be removed from the toolbar by setting its parent to `null`.
     */
    insertBefore(at: string, name: string, widget: T): boolean;
    private _insertRelative;
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
    handleEvent(event: Event): void;
    /**
     * Handle `after-attach` messages for the widget.
     */
    protected onAfterAttach(msg: Message): void;
    /**
     * Handle `before-detach` messages for the widget.
     */
    protected onBeforeDetach(msg: Message): void;
}
/**
 * The namespace for Toolbar class statics.
 */
export declare namespace Toolbar {
    /**
     * Create an interrupt toolbar item.
     */
    function createInterruptButton(session: IClientSession): Widget;
    /**
     * Create a restart toolbar item.
     */
    function createRestartButton(session: IClientSession): Widget;
    /**
     * Create a toolbar spacer item.
     *
     * #### Notes
     * It is a flex spacer that separates the left toolbar items
     * from the right toolbar items.
     */
    function createSpacerItem(): Widget;
    /**
     * Create a kernel name indicator item.
     *
     * #### Notes
     * It will display the `'display_name`' of the current kernel,
     * or `'No Kernel!'` if there is no kernel.
     * It can handle a change in context or kernel.
     */
    function createKernelNameItem(session: IClientSession): Widget;
    /**
     * Create a kernel status indicator item.
     *
     * #### Notes
     * It show display a busy status if the kernel status is
     * not idle.
     * It will show the current status in the node title.
     * It can handle a change to the context or the kernel.
     */
    function createKernelStatusItem(session: IClientSession): Widget;
}
/**
 * Namespace for ToolbarButtonComponent.
 */
export declare namespace ToolbarButtonComponent {
    /**
     * Interface for ToolbarButttonComponent props.
     */
    interface IProps {
        className?: string;
        label?: string;
        iconClassName?: string;
        iconLabel?: string;
        tooltip?: string;
        onClick?: () => void;
        enabled?: boolean;
    }
}
/**
 * React component for a toolbar button.
 *
 * @param props - The props for ToolbarButtonComponent.
 */
export declare function ToolbarButtonComponent(props: ToolbarButtonComponent.IProps): JSX.Element;
/**
 * Adds the toolbar button class to the toolbar widget.
 * @param w Toolbar button widget.
 */
export declare function addToolbarButtonClass(w: Widget): Widget;
/**
 * Phosphor Widget version of static ToolbarButtonComponent.
 */
export declare class ToolbarButton extends ReactWidget {
    private props;
    /**
     * Creates a toolbar button
     * @param props props for underlying `ToolbarButton` componenent
     */
    constructor(props?: ToolbarButtonComponent.IProps);
    render(): JSX.Element;
}
/**
 * Namespace for CommandToolbarButtonComponent.
 */
export declare namespace CommandToolbarButtonComponent {
    /**
     * Interface for CommandToolbarButtonComponent props.
     */
    interface IProps {
        commands: CommandRegistry;
        id: string;
    }
}
/**
 * React component for a toolbar button that wraps a command.
 *
 * This wraps the ToolbarButtonComponent and watches the command registry
 * for changes to the command.
 */
export declare function CommandToolbarButtonComponent(props: CommandToolbarButtonComponent.IProps): JSX.Element;
export declare function addCommandToolbarButtonClass(w: Widget): Widget;
/**
 * Phosphor Widget version of CommandToolbarButtonComponent.
 */
export declare class CommandToolbarButton extends ReactWidget {
    private props;
    /**
     * Creates a command toolbar button
     * @param props props for underlying `CommandToolbarButtonComponent` componenent
     */
    constructor(props: CommandToolbarButtonComponent.IProps);
    render(): JSX.Element;
}
