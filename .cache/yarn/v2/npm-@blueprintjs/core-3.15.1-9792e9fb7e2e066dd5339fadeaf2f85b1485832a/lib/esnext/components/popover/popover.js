/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import classNames from "classnames";
import * as React from "react";
import { Manager, Popper, Reference } from "react-popper";
import { AbstractPureComponent } from "../../common/abstractPureComponent";
import * as Classes from "../../common/classes";
import * as Errors from "../../common/errors";
import { DISPLAYNAME_PREFIX } from "../../common/props";
import * as Utils from "../../common/utils";
import { Overlay } from "../overlay/overlay";
import { ResizeSensor } from "../resize-sensor/resizeSensor";
import { Tooltip } from "../tooltip/tooltip";
import { PopoverArrow } from "./popoverArrow";
import { positionToPlacement } from "./popoverMigrationUtils";
import { arrowOffsetModifier, getTransformOrigin } from "./popperUtils";
export const PopoverInteractionKind = {
    CLICK: "click",
    CLICK_TARGET_ONLY: "click-target",
    HOVER: "hover",
    HOVER_TARGET_ONLY: "hover-target",
};
export class Popover extends AbstractPureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            hasDarkParent: false,
            isOpen: this.getIsOpen(this.props),
            transformOrigin: "",
        };
        // a flag that lets us detect mouse movement between the target and popover,
        // now that mouseleave is triggered when you cross the gap between the two.
        this.isMouseInTargetOrPopover = false;
        // a flag that indicates whether the target previously lost focus to another
        // element on the same page.
        this.lostFocusOnSamePage = true;
        this.refHandlers = {
            popover: (ref) => {
                this.popoverElement = ref;
                Utils.safeInvoke(this.props.popoverRef, ref);
            },
            target: (ref) => (this.targetElement = ref),
        };
        /**
         * Instance method to instruct the `Popover` to recompute its position.
         *
         * This method should only be used if you are updating the target in a way
         * that does not cause it to re-render, such as changing its _position_
         * without changing its _size_ (since `Popover` already repositions when it
         * detects a resize).
         */
        this.reposition = () => Utils.safeInvoke(this.popperScheduleUpdate);
        this.renderPopover = (popperProps) => {
            const { usePortal, interactionKind } = this.props;
            const { transformOrigin } = this.state;
            // Need to update our reference to this on every render as it will change.
            this.popperScheduleUpdate = popperProps.scheduleUpdate;
            const popoverHandlers = {
                // always check popover clicks for dismiss class
                onClick: this.handlePopoverClick,
            };
            if (interactionKind === PopoverInteractionKind.HOVER ||
                (!usePortal && interactionKind === PopoverInteractionKind.HOVER_TARGET_ONLY)) {
                popoverHandlers.onMouseEnter = this.handleMouseEnter;
                popoverHandlers.onMouseLeave = this.handleMouseLeave;
            }
            const popoverClasses = classNames(Classes.POPOVER, {
                [Classes.DARK]: this.props.inheritDarkTheme && this.state.hasDarkParent,
                [Classes.MINIMAL]: this.props.minimal,
            }, this.props.popoverClassName);
            return (React.createElement("div", { className: Classes.TRANSITION_CONTAINER, ref: popperProps.ref, style: popperProps.style },
                React.createElement(ResizeSensor, { onResize: this.reposition },
                    React.createElement("div", Object.assign({ className: popoverClasses, style: { transformOrigin } }, popoverHandlers),
                        this.isArrowEnabled() && (React.createElement(PopoverArrow, { arrowProps: popperProps.arrowProps, placement: popperProps.placement })),
                        React.createElement("div", { className: Classes.POPOVER_CONTENT }, this.understandChildren().content)))));
        };
        this.renderTarget = (referenceProps) => {
            const { openOnTargetFocus, targetClassName, targetProps = {}, targetTagName: TagName } = this.props;
            const { isOpen } = this.state;
            const isHoverInteractionKind = this.isHoverInteractionKind();
            const finalTargetProps = isHoverInteractionKind
                ? {
                    // HOVER handlers
                    onBlur: this.handleTargetBlur,
                    onFocus: this.handleTargetFocus,
                    onMouseEnter: this.handleMouseEnter,
                    onMouseLeave: this.handleMouseLeave,
                }
                : {
                    // CLICK needs only one handler
                    onClick: this.handleTargetClick,
                };
            finalTargetProps.className = classNames(Classes.POPOVER_TARGET, { [Classes.POPOVER_OPEN]: isOpen }, targetProps.className, targetClassName);
            finalTargetProps.ref = referenceProps.ref;
            const rawTarget = Utils.ensureElement(this.understandChildren().target);
            const rawTabIndex = rawTarget.props.tabIndex;
            // ensure target is focusable if relevant prop enabled
            const tabIndex = rawTabIndex == null && openOnTargetFocus && isHoverInteractionKind ? 0 : rawTabIndex;
            const clonedTarget = React.cloneElement(rawTarget, {
                className: classNames(rawTarget.props.className, {
                    [Classes.ACTIVE]: isOpen && !isHoverInteractionKind,
                }),
                // force disable single Tooltip child when popover is open (BLUEPRINT-552)
                disabled: isOpen && Utils.isElementOfType(rawTarget, Tooltip) ? true : rawTarget.props.disabled,
                tabIndex,
            });
            return (React.createElement(ResizeSensor, { onResize: this.reposition },
                React.createElement(TagName, Object.assign({}, targetProps, finalTargetProps), clonedTarget)));
        };
        this.handleTargetFocus = (e) => {
            if (this.props.openOnTargetFocus && this.isHoverInteractionKind()) {
                if (e.relatedTarget == null && !this.lostFocusOnSamePage) {
                    // ignore this focus event -- the target was already focused but the page itself
                    // lost focus (e.g. due to switching tabs).
                    return;
                }
                this.handleMouseEnter(e);
            }
            Utils.safeInvokeMember(this.props.targetProps, "onFocus", e);
        };
        this.handleTargetBlur = (e) => {
            if (this.props.openOnTargetFocus && this.isHoverInteractionKind()) {
                // if the next element to receive focus is within the popover, we'll want to leave the
                // popover open.
                if (!this.isElementInPopover(e.relatedTarget)) {
                    this.handleMouseLeave(e);
                }
            }
            this.lostFocusOnSamePage = e.relatedTarget != null;
            Utils.safeInvokeMember(this.props.targetProps, "onBlur", e);
        };
        this.handleMouseEnter = (e) => {
            this.isMouseInTargetOrPopover = true;
            // if we're entering the popover, and the mode is set to be HOVER_TARGET_ONLY, we want to manually
            // trigger the mouse leave event, as hovering over the popover shouldn't count.
            if (!this.props.usePortal &&
                this.isElementInPopover(e.target) &&
                this.props.interactionKind === PopoverInteractionKind.HOVER_TARGET_ONLY &&
                !this.props.openOnTargetFocus) {
                this.handleMouseLeave(e);
            }
            else if (!this.props.disabled) {
                // only begin opening popover when it is enabled
                this.setOpenState(true, e, this.props.hoverOpenDelay);
            }
            Utils.safeInvokeMember(this.props.targetProps, "onMouseEnter", e);
        };
        this.handleMouseLeave = (e) => {
            this.isMouseInTargetOrPopover = false;
            // wait until the event queue is flushed, because we want to leave the
            // popover open if the mouse entered the popover immediately after
            // leaving the target (or vice versa).
            this.setTimeout(() => {
                if (this.isMouseInTargetOrPopover) {
                    return;
                }
                // user-configurable closing delay is helpful when moving mouse from target to popover
                this.setOpenState(false, e, this.props.hoverCloseDelay);
            });
            Utils.safeInvokeMember(this.props.targetProps, "onMouseLeave", e);
        };
        this.handlePopoverClick = (e) => {
            const eventTarget = e.target;
            // an OVERRIDE inside a DISMISS does not dismiss, and a DISMISS inside an OVERRIDE will dismiss.
            const dismissElement = eventTarget.closest(`.${Classes.POPOVER_DISMISS}, .${Classes.POPOVER_DISMISS_OVERRIDE}`);
            const shouldDismiss = dismissElement != null && dismissElement.classList.contains(Classes.POPOVER_DISMISS);
            const isDisabled = eventTarget.closest(`:disabled, .${Classes.DISABLED}`) != null;
            if (shouldDismiss && !isDisabled && !e.isDefaultPrevented()) {
                this.setOpenState(false, e);
                if (this.props.captureDismiss) {
                    e.preventDefault();
                }
            }
        };
        this.handleOverlayClose = (e) => {
            const eventTarget = e.target;
            // if click was in target, target event listener will handle things, so don't close
            if (!Utils.elementIsOrContains(this.targetElement, eventTarget) || e.nativeEvent instanceof KeyboardEvent) {
                this.setOpenState(false, e);
            }
        };
        this.handleTargetClick = (e) => {
            // ensure click did not originate from within inline popover before closing
            if (!this.props.disabled && !this.isElementInPopover(e.target)) {
                if (this.props.isOpen == null) {
                    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
                }
                else {
                    this.setOpenState(!this.props.isOpen, e);
                }
            }
            Utils.safeInvokeMember(this.props.targetProps, "onClick", e);
        };
        /** Popper modifier that updates React state (for style properties) based on latest data. */
        this.updatePopoverState = data => {
            // always set string; let shouldComponentUpdate determine if update is necessary
            this.setState({ transformOrigin: getTransformOrigin(data) });
            return data;
        };
    }
    render() {
        // rename wrapper tag to begin with uppercase letter so it's recognized
        // as JSX component instead of intrinsic element. but because of its
        // type, tsc actually recognizes that it is _any_ intrinsic element, so
        // it can typecheck the HTML props!!
        const { className, disabled, wrapperTagName: WrapperTagName } = this.props;
        const { isOpen } = this.state;
        const isContentEmpty = Utils.ensureElement(this.understandChildren().content) == null;
        // need to do this check in render(), because `isOpen` is derived from
        // state, and state can't necessarily be accessed in validateProps.
        if (isContentEmpty && !disabled && isOpen !== false && !Utils.isNodeEnv("production")) {
            console.warn(Errors.POPOVER_WARN_EMPTY_CONTENT);
        }
        return (React.createElement(Manager, null,
            React.createElement(WrapperTagName, { className: classNames(Classes.POPOVER_WRAPPER, className) },
                React.createElement(Reference, { innerRef: this.refHandlers.target }, this.renderTarget),
                React.createElement(Overlay, { autoFocus: this.props.autoFocus, backdropClassName: Classes.POPOVER_BACKDROP, backdropProps: this.props.backdropProps, canEscapeKeyClose: this.props.canEscapeKeyClose, canOutsideClickClose: this.props.interactionKind === PopoverInteractionKind.CLICK, className: this.props.portalClassName, enforceFocus: this.props.enforceFocus, hasBackdrop: this.props.hasBackdrop, isOpen: isOpen && !isContentEmpty, onClose: this.handleOverlayClose, onClosed: this.props.onClosed, onClosing: this.props.onClosing, onOpened: this.props.onOpened, onOpening: this.props.onOpening, transitionDuration: this.props.transitionDuration, transitionName: Classes.POPOVER, usePortal: this.props.usePortal, portalContainer: this.props.portalContainer },
                    React.createElement(Popper, { innerRef: this.refHandlers.popover, placement: positionToPlacement(this.props.position), modifiers: this.getPopperModifiers() }, this.renderPopover)))));
    }
    componentDidMount() {
        this.updateDarkParent();
    }
    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);
        const nextIsOpen = this.getIsOpen(nextProps);
        if (nextProps.isOpen != null && nextIsOpen !== this.state.isOpen) {
            this.setOpenState(nextIsOpen);
            // tricky: setOpenState calls setState only if this.props.isOpen is
            // not controlled, so we need to invoke setState manually here.
            this.setState({ isOpen: nextIsOpen });
        }
        else if (this.state.isOpen && nextProps.isOpen == null && nextProps.disabled) {
            // special case: close an uncontrolled popover when disabled is set to true
            this.setOpenState(false);
        }
    }
    componentDidUpdate() {
        this.updateDarkParent();
    }
    validateProps(props) {
        if (props.isOpen == null && props.onInteraction != null) {
            console.warn(Errors.POPOVER_WARN_UNCONTROLLED_ONINTERACTION);
        }
        if (props.hasBackdrop && !props.usePortal) {
            console.warn(Errors.POPOVER_WARN_HAS_BACKDROP_INLINE);
        }
        if (props.hasBackdrop && props.interactionKind !== PopoverInteractionKind.CLICK) {
            throw new Error(Errors.POPOVER_HAS_BACKDROP_INTERACTION);
        }
        const childrenCount = React.Children.count(props.children);
        const hasContentProp = props.content !== undefined;
        const hasTargetProp = props.target !== undefined;
        if (childrenCount === 0 && !hasTargetProp) {
            throw new Error(Errors.POPOVER_REQUIRES_TARGET);
        }
        if (childrenCount > 2) {
            console.warn(Errors.POPOVER_WARN_TOO_MANY_CHILDREN);
        }
        if (childrenCount > 0 && hasTargetProp) {
            console.warn(Errors.POPOVER_WARN_DOUBLE_TARGET);
        }
        if (childrenCount === 2 && hasContentProp) {
            console.warn(Errors.POPOVER_WARN_DOUBLE_CONTENT);
        }
    }
    updateDarkParent() {
        if (this.props.usePortal && this.state.isOpen) {
            const hasDarkParent = this.targetElement != null && this.targetElement.closest(`.${Classes.DARK}`) != null;
            this.setState({ hasDarkParent });
        }
    }
    // content and target can be specified as props or as children. this method
    // normalizes the two approaches, preferring child over prop.
    understandChildren() {
        const { children, content: contentProp, target: targetProp } = this.props;
        // #validateProps asserts that 1 <= children.length <= 2 so content is optional
        const [targetChild, contentChild] = React.Children.toArray(children);
        return {
            content: contentChild == null ? contentProp : contentChild,
            target: targetChild == null ? targetProp : targetChild,
        };
    }
    getIsOpen(props) {
        // disabled popovers should never be allowed to open.
        if (props.disabled) {
            return false;
        }
        else if (props.isOpen != null) {
            return props.isOpen;
        }
        else {
            return props.defaultIsOpen;
        }
    }
    getPopperModifiers() {
        const { boundary, modifiers } = this.props;
        const { flip = {}, preventOverflow = {} } = modifiers;
        return {
            ...modifiers,
            arrowOffset: {
                enabled: this.isArrowEnabled(),
                fn: arrowOffsetModifier,
                order: 510,
            },
            flip: { boundariesElement: boundary, ...flip },
            preventOverflow: { boundariesElement: boundary, ...preventOverflow },
            updatePopoverState: {
                enabled: true,
                fn: this.updatePopoverState,
                order: 900,
            },
        };
    }
    // a wrapper around setState({isOpen}) that will call props.onInteraction instead when in controlled mode.
    // starts a timeout to delay changing the state if a non-zero duration is provided.
    setOpenState(isOpen, e, timeout) {
        // cancel any existing timeout because we have new state
        Utils.safeInvoke(this.cancelOpenTimeout);
        if (timeout > 0) {
            this.cancelOpenTimeout = this.setTimeout(() => this.setOpenState(isOpen, e), timeout);
        }
        else {
            if (this.props.isOpen == null) {
                this.setState({ isOpen });
            }
            else {
                Utils.safeInvoke(this.props.onInteraction, isOpen, e);
            }
            if (!isOpen) {
                Utils.safeInvoke(this.props.onClose, e);
            }
        }
    }
    isArrowEnabled() {
        const { minimal, modifiers: { arrow }, } = this.props;
        // omitting `arrow` from `modifiers` uses Popper default, which does show an arrow.
        return !minimal && (arrow == null || arrow.enabled);
    }
    isElementInPopover(element) {
        return this.popoverElement != null && this.popoverElement.contains(element);
    }
    isHoverInteractionKind() {
        return (this.props.interactionKind === PopoverInteractionKind.HOVER ||
            this.props.interactionKind === PopoverInteractionKind.HOVER_TARGET_ONLY);
    }
}
Popover.displayName = `${DISPLAYNAME_PREFIX}.Popover`;
Popover.defaultProps = {
    boundary: "scrollParent",
    captureDismiss: false,
    defaultIsOpen: false,
    disabled: false,
    hasBackdrop: false,
    hoverCloseDelay: 300,
    hoverOpenDelay: 150,
    inheritDarkTheme: true,
    interactionKind: PopoverInteractionKind.CLICK,
    minimal: false,
    modifiers: {},
    openOnTargetFocus: true,
    position: "auto",
    targetTagName: "span",
    transitionDuration: 300,
    usePortal: true,
    wrapperTagName: "span",
};
//# sourceMappingURL=popover.js.map