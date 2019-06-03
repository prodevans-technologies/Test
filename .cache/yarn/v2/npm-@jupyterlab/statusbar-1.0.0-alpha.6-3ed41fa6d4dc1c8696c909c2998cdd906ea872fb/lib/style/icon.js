"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const variables_1 = __importDefault(require("./variables"));
exports.default = ({ x, y }) => {
    return {
        backgroundRepeat: 'no-repeat',
        backgroundSize: variables_1.default.iconImageSize,
        backgroundPositionY: y !== 0 ? `${y}px` : undefined,
        backgroundPositionX: x !== 0 ? `${x}px` : undefined,
        minHeight: variables_1.default.height,
        width: variables_1.default.iconWidth
    };
};
