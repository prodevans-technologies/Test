"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const coreutils_1 = require("@jupyterlab/coreutils");
const jupyterlab_topbar_1 = require("jupyterlab-topbar");
const memoryView_1 = require("./memoryView");
require("../style/index.css");
/**
 * Initialization data for the jupyterlab-system-monitor extension.
 */
const extension = {
    id: "jupyterlab-system-monitor:plugin",
    autoStart: true,
    requires: [jupyterlab_topbar_1.ITopBar],
    optional: [coreutils_1.ISettingRegistry],
    activate: (app, topBar, settingRegistry) => __awaiter(this, void 0, void 0, function* () {
        let refreshRate;
        if (settingRegistry) {
            const settings = yield settingRegistry.load(extension.id);
            refreshRate = settings.get('refreshRate').composite;
        }
        let memory = new memoryView_1.MemoryView(refreshRate);
        topBar.addItem("memory", memory);
    })
};
exports.default = extension;
