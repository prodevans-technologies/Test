/// <reference types="react" />
import * as React from "react";
import { AbstractPureComponent } from "../../common/abstractPureComponent";
import { IHandleProps } from "./handleProps";
/**
 * Props for the internal <Handle> component needs some additional info from the parent Slider.
 * N.B. some properties need to be optional for spread in slider.tsx to work
 */
export interface IInternalHandleProps extends IHandleProps {
    disabled?: boolean;
    label: React.ReactChild;
    max?: number;
    min?: number;
    stepSize?: number;
    tickSize?: number;
    tickSizeRatio?: number;
    vertical?: boolean;
}
export interface IHandleState {
    /** whether slider handle is currently being dragged */
    isMoving?: boolean;
}
/** Internal component for a Handle with click/drag/keyboard logic to determine a new value. */
export declare class Handle extends AbstractPureComponent<IInternalHandleProps, IHandleState> {
    static displayName: string;
    state: {
        isMoving: boolean;
    };
    private handleElement;
    private refHandlers;
    componentDidMount(): void;
    render(): JSX.Element;
    componentWillUnmount(): void;
    /** Convert client pixel to value between min and max. */
    clientToValue(clientPixel: number): number;
    mouseEventClientOffset(event: MouseEvent | React.MouseEvent<HTMLElement>): number;
    touchEventClientOffset(event: TouchEvent | React.TouchEvent<HTMLElement>): number;
    beginHandleMovement: (event: React.MouseEvent<HTMLElement> | MouseEvent) => void;
    beginHandleTouchMovement: (event: TouchEvent | React.TouchEvent<HTMLElement>) => void;
    protected validateProps(props: IInternalHandleProps): void;
    private endHandleMovement;
    private endHandleTouchMovement;
    private handleMoveEndedAt;
    private handleHandleMovement;
    private handleHandleTouchMovement;
    private handleMovedTo;
    private handleKeyDown;
    private handleKeyUp;
    /** Clamp value and invoke callback if it differs from current value */
    private changeValue(newValue, callback?);
    /** Clamp value between min and max props */
    private clamp(value);
    private getHandleElementCenterPixel(handleElement);
    private getHandleMidpointAndOffset(handleElement, useOppositeDimension?);
    private removeDocumentEventListeners();
}
