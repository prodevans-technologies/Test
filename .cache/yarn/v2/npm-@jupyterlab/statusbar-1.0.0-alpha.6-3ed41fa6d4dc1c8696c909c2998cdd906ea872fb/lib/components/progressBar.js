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
const progressBar_1 = require("../style/progressBar");
/**
 * A functional tsx component for a progress bar.
 */
function ProgressBar(props) {
    return (React.createElement("div", { className: progressBar_1.progressBarItem },
        React.createElement(Filler, { percentage: props.percentage })));
}
exports.ProgressBar = ProgressBar;
/**
 * A functional tsx component for a partially filled div.
 */
function Filler(props) {
    return (React.createElement("div", { className: progressBar_1.fillerItem, style: {
            width: `${props.percentage}px`
        } }));
}
