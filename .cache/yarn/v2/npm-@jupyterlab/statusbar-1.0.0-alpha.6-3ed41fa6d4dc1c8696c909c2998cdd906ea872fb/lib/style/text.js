"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const variables_1 = __importDefault(require("./variables"));
const lib_1 = require("typestyle/lib");
exports.baseText = {
    fontSize: variables_1.default.fontSize,
    fontFamily: '"HelveticaNeue-Regular", "Helvetica Neue Regular", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'
};
exports.textItem = lib_1.style(exports.baseText, {
    lineHeight: '26px',
    color: variables_1.default.textColor
});
