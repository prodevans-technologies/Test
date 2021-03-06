/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
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
import { DISPLAYNAME_PREFIX, Keys, Popover, Position, TagInput, Utils, } from "@blueprintjs/core";
import { Classes } from "../../common";
import { QueryList } from "../query-list/queryList";
export class MultiSelect extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            isOpen: (this.props.popoverProps && this.props.popoverProps.isOpen) || false,
        };
        this.TypedQueryList = QueryList.ofType();
        this.input = null;
        this.queryList = null;
        this.refHandlers = {
            input: (ref) => {
                this.input = ref;
                Utils.safeInvokeMember(this.props.tagInputProps, "inputRef", ref);
            },
            queryList: (ref) => (this.queryList = ref),
        };
        this.renderQueryList = (listProps) => {
            const { tagInputProps = {}, popoverProps = {}, selectedItems = [], placeholder } = this.props;
            const { handlePaste, handleKeyDown, handleKeyUp } = listProps;
            const handleTagInputAdd = (values, method) => {
                if (method === "paste") {
                    handlePaste(values);
                }
            };
            return (React.createElement(Popover, Object.assign({ autoFocus: false, canEscapeKeyClose: true, enforceFocus: false, isOpen: this.state.isOpen, position: Position.BOTTOM_LEFT }, popoverProps, { className: classNames(listProps.className, popoverProps.className), onInteraction: this.handlePopoverInteraction, popoverClassName: classNames(Classes.MULTISELECT_POPOVER, popoverProps.popoverClassName), onOpened: this.handlePopoverOpened }),
                React.createElement("div", { onKeyDown: this.getTargetKeyDownHandler(handleKeyDown), onKeyUp: this.state.isOpen ? handleKeyUp : undefined },
                    React.createElement(TagInput, Object.assign({ placeholder: placeholder }, tagInputProps, { className: classNames(Classes.MULTISELECT, tagInputProps.className), inputRef: this.refHandlers.input, inputValue: listProps.query, onAdd: handleTagInputAdd, onInputChange: listProps.handleQueryChange, values: selectedItems.map(this.props.tagRenderer) }))),
                React.createElement("div", { onKeyDown: this.getTargetKeyDownHandler(handleKeyDown), onKeyUp: handleKeyUp }, listProps.itemList)));
        };
        this.handleItemSelect = (item, evt) => {
            if (this.input != null) {
                this.input.focus();
            }
            Utils.safeInvoke(this.props.onItemSelect, item, evt);
        };
        this.handleQueryChange = (query, evt) => {
            this.setState({ isOpen: query.length > 0 || !this.props.openOnKeyDown });
            Utils.safeInvoke(this.props.onQueryChange, query, evt);
        };
        this.handlePopoverInteraction = (nextOpenState) => 
        // deferring to rAF to get properly updated document.activeElement
        requestAnimationFrame(() => {
            if (this.input != null && this.input !== document.activeElement) {
                // the input is no longer focused so we can close the popover
                this.setState({ isOpen: false });
            }
            else if (!this.props.openOnKeyDown) {
                // open the popover when focusing the tag input
                this.setState({ isOpen: true });
            }
            Utils.safeInvokeMember(this.props.popoverProps, "onInteraction", nextOpenState);
        });
        this.handlePopoverOpened = (node) => {
            if (this.queryList != null) {
                // scroll active item into view after popover transition completes and all dimensions are stable.
                this.queryList.scrollActiveItemIntoView();
            }
            Utils.safeInvokeMember(this.props.popoverProps, "onOpened", node);
        };
        this.getTargetKeyDownHandler = (handleQueryListKeyDown) => {
            return (e) => {
                const { which } = e;
                if (which === Keys.ESCAPE || which === Keys.TAB) {
                    // By default the escape key will not trigger a blur on the
                    // input element. It must be done explicitly.
                    if (this.input != null) {
                        this.input.blur();
                    }
                    this.setState({ isOpen: false });
                }
                else if (!(which === Keys.BACKSPACE || which === Keys.ARROW_LEFT || which === Keys.ARROW_RIGHT)) {
                    this.setState({ isOpen: true });
                }
                if (this.state.isOpen) {
                    Utils.safeInvoke(handleQueryListKeyDown, e);
                }
            };
        };
    }
    static ofType() {
        return MultiSelect;
    }
    render() {
        // omit props specific to this component, spread the rest.
        const { openOnKeyDown, popoverProps, tagInputProps, ...restProps } = this.props;
        return (React.createElement(this.TypedQueryList, Object.assign({}, restProps, { onItemSelect: this.handleItemSelect, onQueryChange: this.handleQueryChange, ref: this.refHandlers.queryList, renderer: this.renderQueryList })));
    }
}
MultiSelect.displayName = `${DISPLAYNAME_PREFIX}.MultiSelect`;
MultiSelect.defaultProps = {
    placeholder: "Search...",
};
//# sourceMappingURL=multiSelect.js.map