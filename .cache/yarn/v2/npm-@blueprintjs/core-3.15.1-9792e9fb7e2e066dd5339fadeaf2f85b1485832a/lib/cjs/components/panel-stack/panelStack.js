"use strict";
/*
 * Copyright 2018 Palantir Technologies, Inc. All rights reserved.
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
var react_transition_group_1 = require("react-transition-group");
var Classes = tslib_1.__importStar(require("../../common/classes"));
var utils_1 = require("../../common/utils");
var panelView_1 = require("./panelView");
var PanelStack = /** @class */ (function (_super) {
    tslib_1.__extends(PanelStack, _super);
    function PanelStack() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            direction: "push",
            stack: [_this.props.initialPanel],
        };
        _this.handlePanelClose = function (panel) {
            var stack = _this.state.stack;
            // only remove this panel if it is at the top and not the only one.
            if (stack[0] !== panel || stack.length <= 1) {
                return;
            }
            utils_1.safeInvoke(_this.props.onClose, panel);
            _this.setState(function (state) { return ({
                direction: "pop",
                stack: state.stack.filter(function (p) { return p !== panel; }),
            }); });
        };
        _this.handlePanelOpen = function (panel) {
            utils_1.safeInvoke(_this.props.onOpen, panel);
            _this.setState(function (state) { return ({
                direction: "push",
                stack: [panel].concat(state.stack),
            }); });
        };
        return _this;
    }
    PanelStack.prototype.render = function () {
        var classes = classnames_1.default(Classes.PANEL_STACK, Classes.PANEL_STACK + "-" + this.state.direction, this.props.className);
        return (React.createElement(react_transition_group_1.TransitionGroup, { className: classes, component: "div" }, this.renderCurrentPanel()));
    };
    PanelStack.prototype.renderCurrentPanel = function () {
        var stack = this.state.stack;
        if (stack.length === 0) {
            return null;
        }
        var activePanel = stack[0], previousPanel = stack[1];
        return (React.createElement(react_transition_group_1.CSSTransition, { classNames: Classes.PANEL_STACK, key: stack.length, timeout: 400 },
            React.createElement(panelView_1.PanelView, { onClose: this.handlePanelClose, onOpen: this.handlePanelOpen, panel: activePanel, previousPanel: previousPanel })));
    };
    return PanelStack;
}(React.PureComponent));
exports.PanelStack = PanelStack;
//# sourceMappingURL=panelStack.js.map