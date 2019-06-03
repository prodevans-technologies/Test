"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mainmenu_1 = require("@jupyterlab/mainmenu");
const apputils_1 = require("@jupyterlab/apputils");
const coreutils_1 = require("@jupyterlab/coreutils");
const jupyterlab_topbar_1 = require("jupyterlab-topbar");
require("../style/index.css");
var CommandIDs;
(function (CommandIDs) {
    /**
     * Toggle Top Bar visibility
     */
    CommandIDs.toggle = `jupyterlab-topbar-extension:toggle`;
})(CommandIDs || (CommandIDs = {}));
/**
 * Initialization data for the jupyterlab-topbar extension.
 */
const extension = {
    id: "jupyterlab-topbar-extension:plugin",
    autoStart: true,
    optional: [mainmenu_1.IMainMenu, apputils_1.ICommandPalette, coreutils_1.ISettingRegistry],
    provides: jupyterlab_topbar_1.ITopBar,
    activate: (app, menu, palette, settingRegistry) => {
        let topBar = new jupyterlab_topbar_1.TopBar();
        topBar.id = "jp-TopBar";
        topBar.addItem("spacer", jupyterlab_topbar_1.TopBar.createSpacerItem());
        app.commands.addCommand(CommandIDs.toggle, {
            label: "Show Top Bar",
            execute: (args) => {
                topBar.setHidden(topBar.isVisible);
                if (settingRegistry) {
                    settingRegistry.set(extension.id, "visible", topBar.isVisible);
                }
            },
            isToggled: () => topBar.isVisible
        });
        if (menu) {
            menu.viewMenu.addGroup([{ command: CommandIDs.toggle }], 2);
        }
        const category = "Top Bar";
        if (palette) {
            palette.addItem({ command: CommandIDs.toggle, category });
        }
        if (settingRegistry) {
            const updateSettings = (settings) => {
                const visible = settings.get("visible").composite;
                topBar.setHidden(!visible);
                const order = settings.get("order").composite;
                topBar.setOrder(order);
            };
            topBar.changed.connect((sender, orderedNames) => {
                settingRegistry.set(extension.id, 'order', orderedNames);
            });
            Promise.all([settingRegistry.load(extension.id), app.restored])
                .then(([settings]) => {
                updateSettings(settings);
                settings.changed.connect(settings => {
                    updateSettings(settings);
                });
            })
                .catch((reason) => {
                console.error(reason.message);
            });
        }
        app.shell.addToTopArea(topBar);
        return topBar;
    }
};
exports.default = extension;
