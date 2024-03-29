/// <reference types="react" />
import { IconName } from "@blueprintjs/icons";
import { AbstractPureComponent, HTMLInputProps, IIntentProps, IProps, MaybeElement, Position } from "../../common";
export interface INumericInputProps extends IIntentProps, IProps {
    /**
     * Whether to allow only floating-point number characters in the field,
     * mimicking the native `input[type="number"]`.
     * @default true
     */
    allowNumericCharactersOnly?: boolean;
    /**
     * The position of the buttons with respect to the input field.
     * @default Position.RIGHT
     */
    buttonPosition?: typeof Position.LEFT | typeof Position.RIGHT | "none";
    /**
     * Whether the value should be clamped to `[min, max]` on blur.
     * The value will be clamped to each bound only if the bound is defined.
     * Note that native `input[type="number"]` controls do *NOT* clamp on blur.
     * @default false
     */
    clampValueOnBlur?: boolean;
    /**
     * Whether the input is non-interactive.
     * @default false
     */
    disabled?: boolean;
    /** Whether the numeric input should take up the full width of its container. */
    fill?: boolean;
    /**
     * Ref handler that receives HTML `<input>` element backing this component.
     */
    inputRef?: (ref: HTMLInputElement | null) => any;
    /**
     * If set to `true`, the input will display with larger styling.
     * This is equivalent to setting `Classes.LARGE` via className on the
     * parent control group and on the child input group.
     * @default false
     */
    large?: boolean;
    /**
     * Name of a Blueprint UI icon (or an icon element) to render on the left side of input.
     */
    leftIcon?: IconName | MaybeElement;
    /**
     * The increment between successive values when <kbd>shift</kbd> is held.
     * Pass explicit `null` value to disable this interaction.
     * @default 10
     */
    majorStepSize?: number | null;
    /** The maximum value of the input. */
    max?: number;
    /** The minimum value of the input. */
    min?: number;
    /**
     * The increment between successive values when <kbd>alt</kbd> is held.
     * Pass explicit `null` value to disable this interaction.
     * @default 0.1
     */
    minorStepSize?: number | null;
    /** The placeholder text in the absence of any value. */
    placeholder?: string;
    /**
     * Element to render on right side of input.
     * For best results, use a minimal button, tag, or small spinner.
     */
    rightElement?: JSX.Element;
    /**
     * Whether the entire text field should be selected on focus.
     * @default false
     */
    selectAllOnFocus?: boolean;
    /**
     * Whether the entire text field should be selected on increment.
     * @default false
     */
    selectAllOnIncrement?: boolean;
    /**
     * The increment between successive values when no modifier keys are held.
     * @default 1
     */
    stepSize?: number;
    /** The value to display in the input field. */
    value?: number | string;
    /** The callback invoked when the value changes due to a button click. */
    onButtonClick?(valueAsNumber: number, valueAsString: string): void;
    /** The callback invoked when the value changes due to typing, arrow keys, or button clicks. */
    onValueChange?(valueAsNumber: number, valueAsString: string): void;
}
export interface INumericInputState {
    shouldSelectAfterUpdate: boolean;
    stepMaxPrecision: number;
    value: string;
}
export declare class NumericInput extends AbstractPureComponent<HTMLInputProps & INumericInputProps, INumericInputState> {
    static displayName: string;
    static VALUE_EMPTY: string;
    static VALUE_ZERO: string;
    static defaultProps: INumericInputProps;
    private static CONTINUOUS_CHANGE_DELAY;
    private static CONTINUOUS_CHANGE_INTERVAL;
    state: INumericInputState;
    private didPasteEventJustOccur;
    private delta;
    private inputElement;
    private intervalId;
    private incrementButtonHandlers;
    private decrementButtonHandlers;
    componentWillReceiveProps(nextProps: HTMLInputProps & INumericInputProps): void;
    render(): JSX.Element;
    componentDidUpdate(): void;
    protected validateProps(nextProps: HTMLInputProps & INumericInputProps): void;
    private renderButtons();
    private renderInput();
    private inputRef;
    private getButtonEventHandlers(direction);
    private handleButtonClick;
    private startContinuousChange();
    private stopContinuousChange;
    private handleContinuousChange;
    private handleInputFocus;
    private handleInputBlur;
    private handleInputKeyDown;
    private handleInputKeyPress;
    private handleInputPaste;
    private handleInputChange;
    private invokeValueCallback(value, callback);
    private incrementValue(delta);
    private getIncrementDelta(direction, isShiftKeyPressed, isAltKeyPressed);
    private getSanitizedValue(value, delta?, min?, max?);
    private getStepMaxPrecision(props);
    private updateDelta(direction, e);
}
