import React from 'react';
import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
/**
 * A namespace for LineColComponent.
 */
declare namespace LineColComponent {
    /**
     * Props for LineColComponent.
     */
    interface IProps {
        /**
         * The current line number.
         */
        line: number;
        /**
         * The current column number.
         */
        column: number;
        /**
         * A click handler for the LineColComponent, which
         * we use to launch the LineFormComponent.
         */
        handleClick: () => void;
    }
}
/**
 * A pure functional component for rendering a line/column
 * status item.
 */
declare function LineColComponent(props: LineColComponent.IProps): React.ReactElement<LineColComponent.IProps>;
/**
 * A widget implementing a line/column status item.
 */
export declare class LineCol extends VDomRenderer<LineCol.Model> {
    /**
     * Construct a new LineCol status item.
     */
    constructor();
    /**
     * Render the status item.
     */
    render(): React.ReactElement<LineColComponent.IProps> | null;
    /**
     * A click handler for the widget.
     */
    private _handleClick;
    /**
     * Handle submission for the widget.
     */
    private _handleSubmit;
    private _popup;
}
/**
 * A namespace for LineCol statics.
 */
export declare namespace LineCol {
    /**
     * A VDom model for a status item tracking the line/column of an editor.
     */
    class Model extends VDomModel {
        /**
         * The current editor of the model.
         */
        editor: CodeEditor.IEditor | null;
        /**
         * The current line of the model.
         */
        readonly line: number;
        /**
         * The current column of the model.
         */
        readonly column: number;
        /**
         * React to a change in the cursors of the current editor.
         */
        private _onSelectionChanged;
        private _getAllState;
        private _triggerChange;
        private _line;
        private _column;
        private _editor;
    }
}
export {};
