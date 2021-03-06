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
import { DISPLAYNAME_PREFIX, InputGroup, Overlay, Utils, } from "@blueprintjs/core";
import { Classes } from "../../common";
import { QueryList } from "../query-list/queryList";
export class Omnibar extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.TypedQueryList = QueryList.ofType();
        this.queryList = null;
        this.refHandlers = {
            queryList: (ref) => (this.queryList = ref),
        };
        this.renderQueryList = (listProps) => {
            const { inputProps = {}, isOpen, overlayProps = {} } = this.props;
            const { handleKeyDown, handleKeyUp } = listProps;
            const handlers = isOpen ? { onKeyDown: handleKeyDown, onKeyUp: handleKeyUp } : {};
            return (React.createElement(Overlay, Object.assign({ hasBackdrop: true }, overlayProps, { isOpen: isOpen, className: classNames(Classes.OMNIBAR_OVERLAY, overlayProps.className), onClose: this.handleOverlayClose }),
                React.createElement("div", Object.assign({ className: classNames(Classes.OMNIBAR, listProps.className) }, handlers),
                    React.createElement(InputGroup, Object.assign({ autoFocus: true, large: true, leftIcon: "search", placeholder: "Search..." }, inputProps, { onChange: listProps.handleQueryChange, value: listProps.query })),
                    listProps.itemList)));
        };
        this.handleOverlayClose = (event) => {
            Utils.safeInvokeMember(this.props.overlayProps, "onClose", event);
            Utils.safeInvoke(this.props.onClose, event);
        };
    }
    static ofType() {
        return Omnibar;
    }
    render() {
        // omit props specific to this component, spread the rest.
        const { initialContent = null, isOpen, inputProps, overlayProps, ...restProps } = this.props;
        return (React.createElement(this.TypedQueryList, Object.assign({}, restProps, { initialContent: initialContent, ref: this.refHandlers.queryList, renderer: this.renderQueryList })));
    }
}
Omnibar.displayName = `${DISPLAYNAME_PREFIX}.Omnibar`;
//# sourceMappingURL=omnibar.js.map