"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const buttons_1 = require("@blueprintjs/core/lib/cjs/components/button/buttons");
const icon_1 = require("@blueprintjs/core/lib/cjs/components/icon/icon");
const collapse_1 = require("@blueprintjs/core/lib/cjs/components/collapse/collapse");
const inputGroup_1 = require("@blueprintjs/core/lib/cjs/components/forms/inputGroup");
const htmlSelect_1 = require("@blueprintjs/core/lib/cjs/components/html-select/htmlSelect");
const select_1 = require("@blueprintjs/select/lib/cjs/components/select/select");
require("@blueprintjs/icons/lib/css/blueprint-icons.css");
require("@blueprintjs/core/lib/css/blueprint.css");
require("../style/index.css");
const utils_1 = require("./utils");
var intent_1 = require("@blueprintjs/core/lib/cjs/common/intent");
exports.Intent = intent_1.Intent;
exports.Button = (props) => (React.createElement(buttons_1.Button, Object.assign({}, props, { className: utils_1.combineClassNames(props.className, props.minimal && 'minimal', 'jp-Button') })));
exports.InputGroup = (props) => {
    if (props.rightIcon) {
        return (React.createElement(inputGroup_1.InputGroup, Object.assign({}, props, { className: utils_1.combineClassNames(props.className, 'jp-InputGroup'), rightElement: React.createElement("div", { className: "jp-InputGroupAction" },
                React.createElement(exports.Icon, { className: "jp-Icon", icon: props.rightIcon })) })));
    }
    return (React.createElement(inputGroup_1.InputGroup, Object.assign({}, props, { className: utils_1.combineClassNames(props.className, 'jp-InputGroup') })));
};
exports.Icon = (props) => (React.createElement(icon_1.Icon, Object.assign({}, props, { className: utils_1.combineClassNames(props.className, 'jp-Icon') })));
exports.Collapse = (props) => (React.createElement(collapse_1.Collapse, Object.assign({}, props)));
exports.HTMLSelect = (props) => (React.createElement(htmlSelect_1.HTMLSelect, Object.assign({}, props, { className: utils_1.combineClassNames(props.className, 'jp-HTMLSelect') })));
exports.Select = (props) => (React.createElement(select_1.Select, Object.assign({}, props, { className: utils_1.combineClassNames(props.className, 'jp-Select') })));
