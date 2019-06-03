"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_sparklines_1 = require("react-sparklines");
const apputils_1 = require("@jupyterlab/apputils");
const statusbar_1 = require("@jupyterlab/statusbar");
const N_BUFFER = 20;
const MemoryFiller = (props) => {
    return (react_1.default.createElement("div", { className: "jp-MemoryFiller", style: {
            width: `${props.percentage * 100}%`,
            background: `${props.color}`
        } }));
};
class MemoryBar extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.toggleSparklines = () => {
            this.setState({
                isSparklines: !this.state.isSparklines
            });
        };
        this.state = {
            isSparklines: false
        };
    }
    render() {
        const color = this.props.percentage > 0.5
            ? this.props.percentage > 0.8
                ? "red"
                : "orange"
            : "green";
        let component;
        if (this.state.isSparklines) {
            component = (react_1.default.createElement(react_sparklines_1.Sparklines, { data: this.props.data, min: 0.0, max: 1.0, limit: N_BUFFER, width: 250, margin: 0 },
                react_1.default.createElement(react_sparklines_1.SparklinesLine, { style: {
                        stroke: color,
                        strokeWidth: 4,
                        fill: color,
                        fillOpacity: 1
                    } }),
                react_1.default.createElement(react_sparklines_1.SparklinesSpots, null)));
        }
        else {
            component = (react_1.default.createElement(MemoryFiller, { percentage: this.props.percentage, color: color }));
        }
        return (react_1.default.createElement("div", { className: "jp-MemoryBar", onClick: () => this.toggleSparklines() }, component));
    }
}
class MemoryView extends apputils_1.VDomRenderer {
    constructor(refreshRate = 5000) {
        super();
        this.model = new MemoryModel({ refreshRate });
    }
    render() {
        if (!this.model) {
            return null;
        }
        const { memoryLimit, currentMemory, units, percentage, values } = this.model;
        const precision = ["B", "KB", "MB"].indexOf(units) > 0 ? 0 : 2;
        const text = `${currentMemory.toFixed(precision)} ${memoryLimit ? "/ " + memoryLimit.toFixed(precision) : ""} ${units}`;
        return (react_1.default.createElement("div", { className: "jp-MemoryContainer", style: percentage && { width: "200px" } },
            react_1.default.createElement("div", { className: "jp-MemoryText" }, "Mem: "),
            react_1.default.createElement("div", { className: "jp-MemoryWrapper" }, percentage && react_1.default.createElement(MemoryBar, { data: values, percentage: percentage })),
            react_1.default.createElement("div", { className: "jp-MemoryText" }, text)));
    }
}
exports.MemoryView = MemoryView;
class MemoryModel extends statusbar_1.MemoryUsage.Model {
    constructor(options) {
        super(options);
        this._percentage = null;
        this._values = new Array(N_BUFFER).fill(0);
        this._refreshIntervalId = setInterval(() => this.updateValues(), options.refreshRate);
    }
    updateValues() {
        this._percentage = this.memoryLimit
            ? Math.min(this.currentMemory / this.memoryLimit, 1)
            : null;
        this.values.push(this._percentage);
        this.values.shift();
        this.stateChanged.emit(void 0);
    }
    dispose() {
        clearInterval(this._refreshIntervalId);
        super.dispose();
    }
    get values() {
        return this._values;
    }
    get percentage() {
        return this._percentage;
    }
}
