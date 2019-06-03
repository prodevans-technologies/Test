"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("typestyle/lib");
exports.progressBarItem = lib_1.style({
    background: 'black',
    height: '10px',
    width: '100px',
    border: '1px solid black',
    borderRadius: '3px',
    marginLeft: '4px',
    overflow: 'hidden'
});
exports.fillerItem = lib_1.style({
    background: 'var(--jp-brand-color2)',
    height: '10px'
});
