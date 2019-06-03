"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
var widgets_1 = require("@phosphor/widgets");
var apputils_1 = require("@jupyterlab/apputils");
var coreutils_1 = require("@jupyterlab/coreutils");
var mainmenu_1 = require("@jupyterlab/mainmenu");
/**
 * The command IDs used by the plugin.
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.controlPanel = 'hub:control-panel';
    CommandIDs.logout = 'hub:logout';
})(CommandIDs = exports.CommandIDs || (exports.CommandIDs = {}));
;
/**
 * Activate the jupyterhub extension.
 */
function activateHubExtension(app, palette, mainMenu) {
    // This config is provided by JupyterHub to the single-user server app
    // in a dictionary: app.web_app.settings['page_config_data'].
    var hubHost = coreutils_1.PageConfig.getOption('hub_host');
    var hubPrefix = coreutils_1.PageConfig.getOption('hub_prefix');
    var baseUrl = coreutils_1.PageConfig.getOption('baseUrl');
    if (!hubPrefix) {
        console.log('jupyterlab-hub: No configuration found.');
        return;
    }
    console.log('jupyterlab-hub: Found configuration ', { hubHost: hubHost, hubPrefix: hubPrefix });
    var category = 'Hub';
    var commands = app.commands;
    commands.addCommand(CommandIDs.controlPanel, {
        label: 'Control Panel',
        caption: 'Open the Hub control panel in a new browser tab',
        execute: function () {
            window.open(hubHost + coreutils_1.URLExt.join(hubPrefix, 'home'), '_blank');
        }
    });
    commands.addCommand(CommandIDs.logout, {
        label: 'Logout',
        caption: 'Log out of the Hub',
        execute: function () {
            window.location.href = hubHost + coreutils_1.URLExt.join(baseUrl, 'logout');
        }
    });
    // Add commands and menu itmes.
    var menu = new widgets_1.Menu({ commands: commands });
    menu.title.label = category;
    [
        CommandIDs.controlPanel,
        CommandIDs.logout,
    ].forEach(function (command) {
        palette.addItem({ command: command, category: category });
        menu.addItem({ command: command });
    });
    mainMenu.addMenu(menu, { rank: 100 });
}
/**
 * Initialization data for the jupyterlab_hub extension.
 */
var hubExtension = {
    activate: activateHubExtension,
    id: 'jupyter.extensions.jupyterlab-hub',
    requires: [
        apputils_1.ICommandPalette,
        mainmenu_1.IMainMenu,
    ],
    autoStart: true,
};
exports.default = hubExtension;
