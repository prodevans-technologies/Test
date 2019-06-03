"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_1 = require("./text");
const lib_1 = require("typestyle/lib");
const variables_1 = __importDefault(require("./variables"));
const layout_1 = require("./layout");
const itemPadding = {
    paddingLeft: variables_1.default.itemPadding,
    paddingRight: variables_1.default.itemPadding
};
const interactiveHover = {
    $nest: {
        '&:hover': {
            backgroundColor: variables_1.default.hoverColor
        }
    }
};
const clicked = {
    backgroundColor: variables_1.default.clickColor,
    $nest: {
        ['.' + text_1.textItem]: {
            color: variables_1.default.textClickColor
        }
    }
};
exports.statusBar = lib_1.style({
    background: variables_1.default.backgroundColor,
    minHeight: variables_1.default.height,
    justifyContent: 'space-between',
    paddingLeft: variables_1.default.statusBarPadding,
    paddingRight: variables_1.default.statusBarPadding
}, layout_1.centeredFlex);
exports.side = lib_1.style(layout_1.centeredFlex);
exports.leftSide = lib_1.style(layout_1.leftToRight);
exports.rightSide = lib_1.style(layout_1.rightToLeft);
exports.item = lib_1.style({
    maxHeight: variables_1.default.height,
    marginLeft: variables_1.default.itemMargin,
    marginRight: variables_1.default.itemMargin,
    height: variables_1.default.height
}, itemPadding);
exports.clickedItem = lib_1.style(clicked);
exports.interactiveItem = lib_1.style(interactiveHover);
