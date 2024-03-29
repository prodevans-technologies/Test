"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var classnames_1 = tslib_1.__importDefault(require("classnames"));
var React = tslib_1.__importStar(require("react"));
var react_popper_1 = require("react-popper");
var abstractPureComponent_1 = require("../../common/abstractPureComponent");
var Classes = tslib_1.__importStar(require("../../common/classes"));
var Errors = tslib_1.__importStar(require("../../common/errors"));
var props_1 = require("../../common/props");
var Utils = tslib_1.__importStar(require("../../common/utils"));
var overlay_1 = require("../overlay/overlay");
var resizeSensor_1 = require("../resize-sensor/resizeSensor");
var tooltip_1 = require("../tooltip/tooltip");
var popoverArrow_1 = require("./popoverArrow");
var popoverMigrationUtils_1 = require("./popoverMigrationUtils");
var popperUtils_1 = require("./popperUtils");
exports.PopoverInteractionKind = {
    CLICK: "click",
    CLICK_TARGET_ONLY: "click-target",
    HOVER: "hover",
    HOVER_TARGET_ONLY: "hover-target",
};
var Popover = /** @class */ (function (_super) {
    tslib_1.__extends(Popover, _super);
    function Popover() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            hasDarkParent: false,
            isOpen: _this.getIsOpen(_this.props),
            transformOrigin: "",
        };
        // a flag that lets us detect mouse movement between the target and popover,
        // now that mouseleave is triggered when you cross the gap between the two.
        _this.isMouseInTargetOrPopover = false;
        // a flag that indicates whether the target previously lost focus to another
        // element on the same page.
        _this.lostFocusOnSamePage = true;
        _this.refHandlers = {
            popover: function (ref) {
                _this.popoverElement = ref;
                Utils.safeInvoke(_this.props.popoverRef, ref);
            },
            target: function (ref) { return (_this.targetElement = ref); },
        };
        /**
         * Instance method to instruct the `Popover` to recompute its position.
         *
         * This method should only be used if you are updating the target in a way
         * that does not cause it to re-render, such as changing its _position_
         * without changing its _size_ (since `Popover` already repositions when it
         * detects a resize).
         */
        _this.reposition = function () { return Utils.safeInvoke(_this.popperScheduleUpdate); };
        _this.renderPopover = function (popperProps) {
            var _a = _this.props, usePortal = _a.usePortal, interactionKind = _a.interactionKind;
            var transformOrigin = _this.state.transformOrigin;
            // Need to update our reference to this on every render as it will change.
            _this.popperScheduleUpdate = popperProps.scheduleUpdate;
            var popoverHandlers = {
                // always check popover clicks for dismiss class
                onClick: _this.handlePopoverClick,
            };
            if (interactionKind === exports.PopoverInteractionKind.HOVER ||
                (!usePortal && interactionKind === exports.PopoverInteractionKind.HOVER_TARGET_ONLY)) {
                popoverHandlers.onMouseEnter = _this.handleMouseEnter;
                popoverHandlers.onMouseLeave = _this.handleMouseLeave;
            }
            var popoverClasses = classnames_1.default(Classes.POPOVER, (_b = {},
                _b[Classes.DARK] = _this.props.inheritDarkTheme && _this.state.hasDarkParent,
                _b[Classes.MINIMAL] = _this.props.minimal,
                _b), _this.props.popoverClassName);
            return (React.createElement("div", { className: Classes.TRANSITION_CONTAINER, ref: popperProps.ref, style: popperProps.style },
                React.createElement(resizeSensor_1.ResizeSensor, { onResize: _this.reposition },
                    React.createElement("div", tslib_1.__assign({ className: popoverClasses, style: { transformOrigin: transformOrigin } }, popoverHandlers),
                        _this.isArrowEnabled() && (React.createElement(popoverArrow_1.PopoverArrow, { arrowProps: popperProps.arrowProps, placement: popperProps.placement })),
                        React.createElement("div", { className: Classes.POPOVER_CONTENT }, _this.understandChildren().content)))));
            var _b;
        };
        _this.renderTarget = function (referenceProps) {
            var _a = _this.props, openOnTargetFocus = _a.openOnTargetFocus, targetClassName = _a.targetClassName, _b = _a.targetProps, targetProps = _b === void 0 ? {} : _b, TagName = _a.targetTagName;
            var isOpen = _this.state.isOpen;
            var isHoverInteractionKind = _this.isHoverInteractionKind();
            var finalTargetProps = isHoverInteractionKind
                ? {
                    // HOVER handlers
                    onBlur: _this.handleTargetBlur,
                    onFocus: _this.handleTargetFocus,
                    onMouseEnter: _this.handleMouseEnter,
                    onMouseLeave: _this.handleMouseLeave,
                }
                : {
                    // CLICK needs only one handler
                    onClick: _this.handleTargetClick,
                };
            finalTargetProps.className = classnames_1.default(Classes.POPOVER_TARGET, (_c = {}, _c[Classes.POPOVER_OPEN] = isOpen, _c), targetProps.className, targetClassName);
            finalTargetProps.ref = referenceProps.ref;
            var rawTarget = Utils.ensureElement(_this.understandChildren().target);
            var rawTabIndex = rawTarget.props.tabIndex;
            // ensure target is focusable if relevant prop enabled
            var tabIndex = rawTabIndex == null && openOnTargetFocus && isHoverInteractionKind ? 0 : rawTabIndex;
            var clonedTarget = React.cloneElement(rawTarget, {
                className: classnames_1.default(rawTarget.props.className, (_d = {},
                    _d[Classes.ACTIVE] = isOpen && !isHoverInteractionKind,
                    _d)),
                // force disable single Tooltip child when popover is open (BLUEPRINT-552)
                disabled: isOpen && Utils.isElementOfType(rawTarget, tooltip_1.Tooltip) ? true : rawTarget.props.disabled,
                tabIndex: tabIndex,
            });
            return (React.createElement(resizeSensor_1.ResizeSensor, { onResize: _this.reposition },
                React.createElement(TagName, tslib_1.__assign({}, targetProps, finalTargetProps), clonedTarget)));
            var _c, _d;
        };
        _this.handleTargetFocus = function (e) {
            if (_this.props.openOnTargetFocus && _this.isHoverInteractionKind()) {
                if (e.relatedTarget == null && !_this.lostFocusOnSamePage) {
                    // ignore this focus event -- the target was already focused but the page itself
                    // lost focus (e.g. due to switching tabs).
                    return;
                }
                _this.handleMouseEnter(e);
            }
            Utils.safeInvokeMember(_this.props.targetProps, "onFocus", e);
        };
        _this.handleTargetBlur = function (e) {
            if (_this.props.openOnTargetFocus && _this.isHoverInteractionKind()) {
                // if the next element to receive focus is within the popover, we'll want to leave the
                // popover open.
                if (!_this.isElementInPopover(e.relatedTarget)) {
                    _this.handleMouseLeave(e);
                }
            }
            _this.lostFocusOnSamePage = e.relatedTarget != null;
            Utils.safeInvokeMember(_this.props.targetProps, "onBlur", e);
        };
        _this.handleMouseEnter = function (e) {
            _this.isMouseInTargetOrPopover = true;
            // if we're entering the popover, and the mode is set to be HOVER_TARGET_ONLY, we want to manually
            // trigger the mouse leave event, as hovering over the popover shouldn't count.
            if (!_this.props.usePortal &&
                _this.isElementInPopover(e.target) &&
                _this.props.interactionKind === exports.PopoverInteractionKind.HOVER_TARGET_ONLY &&
                !_this.props.openOnTargetFocus) {
                _this.handleMouseLeave(e);
            }
            else if (!_this.props.disabled) {
                // only begin opening popover when it is enabled
                _this.setOpenState(true, e, _this.props.hoverOpenDelay);
            }
            Utils.safeInvokeMember(_this.props.targetProps, "onMouseEnter", e);
        };
        _this.handleMouseLeave = function (e) {
            _this.isMouseInTargetOrPopover = false;
            // wait until the event queue is flushed, because we want to leave the
            // popover open if the mouse entered the popover immediately after
            // leaving the target (or vice versa).
            _this.setTimeout(function () {
                if (_this.isMouseInTargetOrPopover) {
                    return;
                }
                // user-configurable closing delay is helpful when moving mouse from target to popover
                _this.setOpenState(false, e, _this.props.hoverCloseDelay);
            });
            Utils.safeInvokeMember(_this.props.targetProps, "onMouseLeave", e);
        };
        _this.handlePopoverClick = function (e) {
            var eventTarget = e.target;
            // an OVERRIDE inside a DISMISS does not dismiss, and a DISMISS inside an OVERRIDE will dismiss.
            var dismissElement = eventTarget.closest("." + Classes.POPOVER_DISMISS + ", ." + Classes.POPOVER_DISMISS_OVERRIDE);
            var shouldDismiss = dismissElement != null && dismissElement.classList.contains(Classes.POPOVER_DISMISS);
            var isDisabled = eventTarget.closest(":disabled, ." + Classes.DISABLED) != null;
            if (shouldDismiss && !isDisabled && !e.isDefaultPrevented()) {
                _this.setOpenState(false, e);
                if (_this.props.captureDismiss) {
                    e.preventDefault();
                }
            }
        };
        _this.handleOverlayClose = function (e) {
            var eventTarget = e.target;
            // if click was in target, target event listener will handle things, so don't close
            if (!Utils.elementIsOrContains(_this.targetElement, eventTarget) || e.nativeEvent instanceof KeyboardEvent) {
                _this.setOpenState(false, e);
            }
        };
        _this.handleTargetClick = function (e) {
            // ensure click did not originate from within inline popover before closing
            if (!_this.props.disabled && !_this.isElementInPopover(e.target)) {
                if (_this.props.isOpen == null) {
                    _this.setState(function (prevState) { return ({ isOpen: !prevState.isOpen }); });
                }
                else {
                    _this.setOpenState(!_this.props.isOpen, e);
                }
            }
            Utils.safeInvokeMember(_this.props.targetProps, "onClick", e);
        };
        /** Popper modifier that updates React state (for style properties) based on latest data. */
        _this.updatePopoverState = function (data) {
            // always set string; let shouldComponentUpdate determine if update is necessary
            _this.setState({ transformOrigin: popperUtils_1.getTransformOrigin(data) });
            return data;
        };
        return _this;
    }
    Popover.prototype.render = function () {
        // rename wrapper tag to begin with uppercase letter so it's recognized
        // as JSX component instead of intrinsic element. but because of its
        // type, tsc actually recognizes that it is _any_ intrinsic element, so
        // it can typecheck the HTML props!!
        var _a = this.props, className = _a.className, disabled = _a.disabled, WrapperTagName = _a.wrapperTagName;
        var isOpen = this.state.isOpen;
        var isContentEmpty = Utils.ensureElement(this.understandChildren().content) == null;
        // need to do this check in render(), because `isOpen` is derived from
        // state, and state can't necessarily be accessed in validateProps.
        if (isContentEmpty && !disabled && isOpen !== false && !Utils.isNodeEnv("production")) {
            console.warn(Errors.POPOVER_WARN_EMPTY_CONTENT);
        }
        return (React.createElement(react_popper_1.Manager, null,
            React.createElement(WrapperTagName, { className: classnames_1.default(Classes.POPOVER_WRAPPER, className) },
                React.createElement(react_popper_1.Reference, { innerRef: this.refHandlers.target }, this.renderTarget),
                React.createElement(overlay_1.Overlay, { autoFocus: this.props.autoFocus, backdropClassName: Classes.POPOVER_BACKDROP, backdropProps: this.props.backdropProps, canEscapeKeyClose: this.props.canEscapeKeyClose, canOutsideClickClose: this.props.interactionKind === exports.PopoverInteractionKind.CLICK, className: this.props.portalClassName, enforceFocus: this.props.enforceFocus, hasBackdrop: this.props.hasBackdrop, isOpen: isOpen && !isContentEmpty, onClose: this.handleOverlayClose, onClosed: this.props.onClosed, onClosing: this.props.onClosing, onOpened: this.props.onOpened, onOpening: this.props.onOpening, transitionDuration: this.props.transitionDuration, transitionName: Classes.POPOVER, usePortal: this.props.usePortal, portalContainer: this.props.portalContainer },
                    React.createElement(react_popper_1.Popper, { innerRef: this.refHandlers.popover, placement: popoverMigrationUtils_1.positionToPlacement(this.props.position), modifiers: this.getPopperModifiers() }, this.renderPopover)))));
    };
    Popover.prototype.componentDidMount = function () {
        this.updateDarkParent();
    };
    Popover.prototype.componentWillReceiveProps = function (nextProps) {
        _super.prototype.componentWillReceiveProps.call(this, nextProps);
        var nextIsOpen = this.getIsOpen(nextProps);
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
    };
    Popover.prototype.componentDidUpdate = function () {
        this.updateDarkParent();
    };
    Popover.prototype.validateProps = function (props) {
        if (props.isOpen == null && props.onInteraction != null) {
            console.warn(Errors.POPOVER_WARN_UNCONTROLLED_ONINTERACTION);
        }
        if (props.hasBackdrop && !props.usePortal) {
            console.warn(Errors.POPOVER_WARN_HAS_BACKDROP_INLINE);
        }
        if (props.hasBackdrop && props.interactionKind !== exports.PopoverInteractionKind.CLICK) {
            throw new Error(Errors.POPOVER_HAS_BACKDROP_INTERACTION);
        }
        var childrenCount = React.Children.count(props.children);
        var hasContentProp = props.content !== undefined;
        var hasTargetProp = props.target !== undefined;
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
    };
    Popover.prototype.updateDarkParent = function () {
        if (this.props.usePortal && this.state.isOpen) {
            var hasDarkParent = this.targetElement != null && this.targetElement.closest("." + Classes.DARK) != null;
            this.setState({ hasDarkParent: hasDarkParent });
        }
    };
    // content and target can be specified as props or as children. this method
    // normalizes the two approaches, preferring child over prop.
    Popover.prototype.understandChildren = function () {
        var _a = this.props, children = _a.children, contentProp = _a.content, targetProp = _a.target;
        // #validateProps asserts that 1 <= children.length <= 2 so content is optional
        var _b = React.Children.toArray(children), targetChild = _b[0], contentChild = _b[1];
        return {
            content: contentChild == null ? contentProp : contentChild,
            target: targetChild == null ? targetProp : targetChild,
        };
    };
    Popover.prototype.getIsOpen = function (props) {
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
    };
    Popover.prototype.getPopperModifiers = function () {
        var _a = this.props, boundary = _a.boundary, modifiers = _a.modifiers;
        var _b = modifiers.flip, flip = _b === void 0 ? {} : _b, _c = modifiers.preventOverflow, preventOverflow = _c === void 0 ? {} : _c;
        return tslib_1.__assign({}, modifiers, { arrowOffset: {
                enabled: this.isArrowEnabled(),
                fn: popperUtils_1.arrowOffsetModifier,
                order: 510,
            }, flip: tslib_1.__assign({ boundariesElement: boundary }, flip), preventOverflow: tslib_1.__assign({ boundariesElement: boundary }, preventOverflow), updatePopoverState: {
                enabled: true,
                fn: this.updatePopoverState,
                order: 900,
            } });
    };
    // a wrapper around setState({isOpen}) that will call props.onInteraction instead when in controlled mode.
    // starts a timeout to delay changing the state if a non-zero duration is provided.
    Popover.prototype.setOpenState = function (isOpen, e, timeout) {
        var _this = this;
        // cancel any existing timeout because we have new state
        Utils.safeInvoke(this.cancelOpenTimeout);
        if (timeout > 0) {
            this.cancelOpenTimeout = this.setTimeout(function () { return _this.setOpenState(isOpen, e); }, timeout);
        }
        else {
            if (this.props.isOpen == null) {
                this.setState({ isOpen: isOpen });
            }
            else {
                Utils.safeInvoke(this.props.onInteraction, isOpen, e);
            }
            if (!isOpen) {
                Utils.safeInvoke(this.props.onClose, e);
            }
        }
    };
    Popover.prototype.isArrowEnabled = function () {
        var _a = this.props, minimal = _a.minimal, arrow = _a.modifiers.arrow;
        // omitting `arrow` from `modifiers` uses Popper default, which does show an arrow.
        return !minimal && (arrow == null || arrow.enabled);
    };
    Popover.prototype.isElementInPopover = function (element) {
        return this.popoverElement != null && this.popoverElement.contains(element);
    };
    Popover.prototype.isHoverInteractionKind = function () {
        return (this.props.interactionKind === exports.PopoverInteractionKind.HOVER ||
            this.props.interactionKind === exports.PopoverInteractionKind.HOVER_TARGET_ONLY);
    };
    Popover.displayName = props_1.DISPLAYNAME_PREFIX + ".Popover";
    Popover.defaultProps = {
        boundary: "scrollParent",
        captureDismiss: false,
        defaultIsOpen: false,
        disabled: false,
        hasBackdrop: false,
        hoverCloseDelay: 300,
        hoverOpenDelay: 150,
        inheritDarkTheme: true,
        interactionKind: exports.PopoverInteractionKind.CLICK,
        minimal: false,
        modifiers: {},
        openOnTargetFocus: true,
        position: "auto",
        targetTagName: "span",
        transitionDuration: 300,
        usePortal: true,
        wrapperTagName: "span",
    };
    return Popover;
}(abstractPureComponent_1.AbstractPureComponent));
exports.Popover = Popover;
//# sourceMappingURL=popover.js.map