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
import { Button, DISPLAYNAME_PREFIX, InputGroup, Keys, Popover, Position, Utils, } from "@blueprintjs/core";
import { Classes } from "../../common";
import { QueryList } from "../query-list/queryList";
export class Select extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = { isOpen: false };
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
            // not using defaultProps cuz they're hard to type with generics (can't use <T> on static members)
            const { filterable = true, disabled = false, inputProps = {}, popoverProps = {} } = this.props;
            const input = (React.createElement(InputGroup, Object.assign({ leftIcon: "search", placeholder: "Filter...", rightElement: this.maybeRenderClearButton(listProps.query) }, inputProps, { inputRef: this.refHandlers.input, onChange: listProps.handleQueryChange, value: listProps.query })));
            const { handleKeyDown, handleKeyUp } = listProps;
            return (React.createElement(Popover, Object.assign({ autoFocus: false, enforceFocus: false, isOpen: this.state.isOpen, disabled: disabled, position: Position.BOTTOM_LEFT }, popoverProps, { className: classNames(listProps.className, popoverProps.className), onInteraction: this.handlePopoverInteraction, popoverClassName: classNames(Classes.SELECT_POPOVER, popoverProps.popoverClassName), onOpening: this.handlePopoverOpening, onOpened: this.handlePopoverOpened, onClosing: this.handlePopoverClosing }),
                React.createElement("div", { onKeyDown: this.state.isOpen ? handleKeyDown : this.handleTargetKeyDown, onKeyUp: this.state.isOpen ? handleKeyUp : undefined }, this.props.children),
                React.createElement("div", { onKeyDown: handleKeyDown, onKeyUp: handleKeyUp },
                    filterable ? input : undefined,
                    listProps.itemList)));
        };
        this.handleTargetKeyDown = (event) => {
            // open popover when arrow key pressed on target while closed
            if (event.which === Keys.ARROW_UP || event.which === Keys.ARROW_DOWN) {
                event.preventDefault();
                this.setState({ isOpen: true });
            }
        };
        this.handleItemSelect = (item, event) => {
            this.setState({ isOpen: false });
            Utils.safeInvoke(this.props.onItemSelect, item, event);
        };
        this.handlePopoverInteraction = (isOpen) => {
            this.setState({ isOpen });
            Utils.safeInvokeMember(this.props.popoverProps, "onInteraction", isOpen);
        };
        this.handlePopoverOpening = (node) => {
            // save currently focused element before popover steals focus, so we can restore it when closing.
            this.previousFocusedElement = document.activeElement;
            if (this.props.resetOnClose) {
                this.resetQuery();
            }
            Utils.safeInvokeMember(this.props.popoverProps, "onOpening", node);
        };
        this.handlePopoverOpened = (node) => {
            // scroll active item into view after popover transition completes and all dimensions are stable.
            if (this.queryList != null) {
                this.queryList.scrollActiveItemIntoView();
            }
            requestAnimationFrame(() => {
                const { inputProps = {} } = this.props;
                // autofocus is enabled by default
                if (inputProps.autoFocus !== false && this.input != null) {
                    this.input.focus();
                }
            });
            Utils.safeInvokeMember(this.props.popoverProps, "onOpened", node);
        };
        this.handlePopoverClosing = (node) => {
            // restore focus to saved element.
            // timeout allows popover to begin closing and remove focus handlers beforehand.
            requestAnimationFrame(() => {
                if (this.previousFocusedElement !== undefined) {
                    this.previousFocusedElement.focus();
                    this.previousFocusedElement = undefined;
                }
            });
            Utils.safeInvokeMember(this.props.popoverProps, "onClosing", node);
        };
        this.resetQuery = () => this.queryList && this.queryList.setQuery("", true);
    }
    static ofType() {
        return Select;
    }
    render() {
        // omit props specific to this component, spread the rest.
        const { filterable, inputProps, popoverProps, ...restProps } = this.props;
        return (React.createElement(this.TypedQueryList, Object.assign({}, restProps, { onItemSelect: this.handleItemSelect, ref: this.refHandlers.queryList, renderer: this.renderQueryList })));
    }
    componentDidUpdate(_prevProps, prevState) {
        if (this.state.isOpen && !prevState.isOpen && this.queryList != null) {
            this.queryList.scrollActiveItemIntoView();
        }
    }
    maybeRenderClearButton(query) {
        return query.length > 0 ? React.createElement(Button, { icon: "cross", minimal: true, onClick: this.resetQuery }) : undefined;
    }
}
Select.displayName = `${DISPLAYNAME_PREFIX}.Select`;
//# sourceMappingURL=select.js.map