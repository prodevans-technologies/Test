"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const lib_1 = require("typestyle/lib");
const layout_1 = require("../style/layout");
const groupItemLayout = lib_1.style(layout_1.centeredFlex, layout_1.leftToRight);
/**
 * A tsx component for a set of items logically grouped together.
 */
function GroupItem(props) {
    const { spacing, children, className } = props, rest = __rest(props, ["spacing", "children", "className"]);
    const numChildren = React.Children.count(children);
    return (React.createElement("div", Object.assign({ className: lib_1.classes(groupItemLayout, className) }, rest), React.Children.map(children, (child, i) => {
        if (i === 0) {
            return React.createElement("div", { style: { marginRight: `${spacing}px` } }, child);
        }
        else if (i === numChildren - 1) {
            return React.createElement("div", { style: { marginLeft: `${spacing}px` } }, child);
        }
        else {
            return React.createElement("div", { style: { margin: `0px ${spacing}px` } }, child);
        }
    })));
}
exports.GroupItem = GroupItem;
