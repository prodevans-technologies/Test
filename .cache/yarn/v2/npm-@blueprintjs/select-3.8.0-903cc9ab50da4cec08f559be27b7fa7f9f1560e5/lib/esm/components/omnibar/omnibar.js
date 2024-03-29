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
import * as tslib_1 from "tslib";
import classNames from "classnames";
import * as React from "react";
import { DISPLAYNAME_PREFIX, InputGroup, Overlay, Utils, } from "@blueprintjs/core";
import { Classes } from "../../common";
import { QueryList } from "../query-list/queryList";
var Omnibar = /** @class */ (function (_super) {
    tslib_1.__extends(Omnibar, _super);
    function Omnibar() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.TypedQueryList = QueryList.ofType();
        _this.queryList = null;
        _this.refHandlers = {
            queryList: function (ref) { return (_this.queryList = ref); },
        };
        _this.renderQueryList = function (listProps) {
            var _a = _this.props, _b = _a.inputProps, inputProps = _b === void 0 ? {} : _b, isOpen = _a.isOpen, _c = _a.overlayProps, overlayProps = _c === void 0 ? {} : _c;
            var handleKeyDown = listProps.handleKeyDown, handleKeyUp = listProps.handleKeyUp;
            var handlers = isOpen ? { onKeyDown: handleKeyDown, onKeyUp: handleKeyUp } : {};
            return (React.createElement(Overlay, tslib_1.__assign({ hasBackdrop: true }, overlayProps, { isOpen: isOpen, className: classNames(Classes.OMNIBAR_OVERLAY, overlayProps.className), onClose: _this.handleOverlayClose }),
                React.createElement("div", tslib_1.__assign({ className: classNames(Classes.OMNIBAR, listProps.className) }, handlers),
                    React.createElement(InputGroup, tslib_1.__assign({ autoFocus: true, large: true, leftIcon: "search", placeholder: "Search..." }, inputProps, { onChange: listProps.handleQueryChange, value: listProps.query })),
                    listProps.itemList)));
        };
        _this.handleOverlayClose = function (event) {
            Utils.safeInvokeMember(_this.props.overlayProps, "onClose", event);
            Utils.safeInvoke(_this.props.onClose, event);
        };
        return _this;
    }
    Omnibar.ofType = function () {
        return Omnibar;
    };
    Omnibar.prototype.render = function () {
        // omit props specific to this component, spread the rest.
        var _a = this.props, _b = _a.initialContent, initialContent = _b === void 0 ? null : _b, isOpen = _a.isOpen, inputProps = _a.inputProps, overlayProps = _a.overlayProps, restProps = tslib_1.__rest(_a, ["initialContent", "isOpen", "inputProps", "overlayProps"]);
        return (React.createElement(this.TypedQueryList, tslib_1.__assign({}, restProps, { initialContent: initialContent, ref: this.refHandlers.queryList, renderer: this.renderQueryList })));
    };
    Omnibar.displayName = DISPLAYNAME_PREFIX + ".Omnibar";
    return Omnibar;
}(React.PureComponent));
export { Omnibar };
//# sourceMappingURL=omnibar.js.map