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
import { DISPLAYNAME_PREFIX, InputGroup, Keys, Popover, Position, Utils, } from "@blueprintjs/core";
import { Classes } from "../../common";
import { QueryList } from "../query-list/queryList";
export class Suggest extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            isOpen: (this.props.popoverProps != null && this.props.popoverProps.isOpen) || false,
            selectedItem: this.getInitialSelectedItem(),
        };
        this.TypedQueryList = QueryList.ofType();
        this.input = null;
        this.queryList = null;
        this.refHandlers = {
            input: (ref) => {
                this.input = ref;
                Utils.safeInvokeMember(this.props.inputProps, "inputRef", ref);
            },
            queryList: (ref) => (this.queryList = ref),
        };
        this.renderQueryList = (listProps) => {
            const { inputProps = {}, popoverProps = {} } = this.props;
            const { isOpen, selectedItem } = this.state;
            const { handleKeyDown, handleKeyUp } = listProps;
            const { placeholder = "Search..." } = inputProps;
            const selectedItemText = selectedItem ? this.props.inputValueRenderer(selectedItem) : "";
            // placeholder shows selected item while open.
            const inputPlaceholder = isOpen && selectedItemText ? selectedItemText : placeholder;
            // value shows query when open, and query remains when closed if nothing is selected.
            // if resetOnClose is enabled, then hide query when not open. (see handlePopoverOpening)
            const inputValue = isOpen
                ? listProps.query
                : selectedItemText || (this.props.resetOnClose ? "" : listProps.query);
            return (React.createElement(Popover, Object.assign({ autoFocus: false, enforceFocus: false, isOpen: isOpen, position: Position.BOTTOM_LEFT }, popoverProps, { className: classNames(listProps.className, popoverProps.className), onInteraction: this.handlePopoverInteraction, popoverClassName: classNames(Classes.SELECT_POPOVER, popoverProps.popoverClassName), onOpening: this.handlePopoverOpening, onOpened: this.handlePopoverOpened }),
                React.createElement(InputGroup, Object.assign({ disabled: this.props.disabled }, inputProps, { inputRef: this.refHandlers.input, onChange: listProps.handleQueryChange, onFocus: this.handleInputFocus, onKeyDown: this.getTargetKeyDownHandler(handleKeyDown), onKeyUp: this.getTargetKeyUpHandler(handleKeyUp), placeholder: inputPlaceholder, value: inputValue })),
                React.createElement("div", { onKeyDown: handleKeyDown, onKeyUp: handleKeyUp }, listProps.itemList)));
        };
        this.selectText = () => {
            // wait until the input is properly focused to select the text inside of it
            requestAnimationFrame(() => {
                if (this.input != null) {
                    this.input.setSelectionRange(0, this.input.value.length);
                }
            });
        };
        this.handleInputFocus = (event) => {
            this.selectText();
            // TODO can we leverage Popover.openOnTargetFocus for this?
            if (!this.props.openOnKeyDown) {
                this.setState({ isOpen: true });
            }
            Utils.safeInvokeMember(this.props.inputProps, "onFocus", event);
        };
        this.handleItemSelect = (item, event) => {
            let nextOpenState;
            if (!this.props.closeOnSelect) {
                if (this.input != null) {
                    this.input.focus();
                }
                this.selectText();
                nextOpenState = true;
            }
            else {
                if (this.input != null) {
                    this.input.blur();
                }
                nextOpenState = false;
            }
            // the internal state should only change when uncontrolled.
            if (this.props.selectedItem === undefined) {
                this.setState({
                    isOpen: nextOpenState,
                    selectedItem: item,
                });
            }
            else {
                // otherwise just set the next open state.
                this.setState({ isOpen: nextOpenState });
            }
            Utils.safeInvoke(this.props.onItemSelect, item, event);
        };
        this.handlePopoverInteraction = (nextOpenState) => requestAnimationFrame(() => {
            if (this.input != null && this.input !== document.activeElement) {
                // the input is no longer focused so we can close the popover
                this.setState({ isOpen: false });
            }
            Utils.safeInvokeMember(this.props.popoverProps, "onInteraction", nextOpenState);
        });
        this.handlePopoverOpening = (node) => {
            // reset query before opening instead of when closing to prevent flash of unfiltered items.
            // this is a limitation of the interactions between QueryList state and Popover transitions.
            if (this.props.resetOnClose && this.queryList) {
                this.queryList.setQuery("", true);
            }
            Utils.safeInvokeMember(this.props.popoverProps, "onOpening", node);
        };
        this.handlePopoverOpened = (node) => {
            // scroll active item into view after popover transition completes and all dimensions are stable.
            if (this.queryList != null) {
                this.queryList.scrollActiveItemIntoView();
            }
            Utils.safeInvokeMember(this.props.popoverProps, "onOpened", node);
        };
        this.getTargetKeyDownHandler = (handleQueryListKeyDown) => {
            return (evt) => {
                const { which } = evt;
                if (which === Keys.ESCAPE || which === Keys.TAB) {
                    if (this.input != null) {
                        this.input.blur();
                    }
                    this.setState({ isOpen: false });
                }
                else if (this.props.openOnKeyDown &&
                    which !== Keys.BACKSPACE &&
                    which !== Keys.ARROW_LEFT &&
                    which !== Keys.ARROW_RIGHT) {
                    this.setState({ isOpen: true });
                }
                if (this.state.isOpen) {
                    Utils.safeInvoke(handleQueryListKeyDown, evt);
                }
                Utils.safeInvokeMember(this.props.inputProps, "onKeyDown", evt);
            };
        };
        this.getTargetKeyUpHandler = (handleQueryListKeyUp) => {
            return (evt) => {
                if (this.state.isOpen) {
                    Utils.safeInvoke(handleQueryListKeyUp, evt);
                }
                Utils.safeInvokeMember(this.props.inputProps, "onKeyUp", evt);
            };
        };
    }
    static ofType() {
        return Suggest;
    }
    render() {
        // omit props specific to this component, spread the rest.
        const { disabled, inputProps, popoverProps, ...restProps } = this.props;
        return (React.createElement(this.TypedQueryList, Object.assign({}, restProps, { onItemSelect: this.handleItemSelect, ref: this.refHandlers.queryList, renderer: this.renderQueryList })));
    }
    componentWillReceiveProps(nextProps) {
        // If the selected item prop changes, update the underlying state.
        if (nextProps.selectedItem !== undefined && nextProps.selectedItem !== this.state.selectedItem) {
            this.setState({ selectedItem: nextProps.selectedItem });
        }
    }
    componentDidUpdate(_prevProps, prevState) {
        if (this.state.isOpen && !prevState.isOpen && this.queryList != null) {
            this.queryList.scrollActiveItemIntoView();
        }
    }
    getInitialSelectedItem() {
        // controlled > uncontrolled > default
        if (this.props.selectedItem !== undefined) {
            return this.props.selectedItem;
        }
        else if (this.props.defaultSelectedItem !== undefined) {
            return this.props.defaultSelectedItem;
        }
        else {
            return null;
        }
    }
}
Suggest.displayName = `${DISPLAYNAME_PREFIX}.Suggest`;
Suggest.defaultProps = {
    closeOnSelect: true,
    openOnKeyDown: false,
    resetOnClose: false,
};
//# sourceMappingURL=suggest.js.map