"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const coreutils_1 = require("@jupyterlab/coreutils");
const disposable_1 = require("@phosphor/disposable");
/**
 * The default shortcuts extension.
 *
 * #### Notes
 * Shortcut values are stored in the setting system. The default values for each
 * shortcut are preset in the settings schema file of this extension.
 * Additionally, each shortcut can be individually set by the end user by
 * modifying its setting (either in the text editor or by modifying its
 * underlying JSON schema file).
 *
 * When setting shortcut selectors, there are two concepts to consider:
 * specificity and matchability. These two interact in sometimes
 * counterintuitive ways. Keyboard events are triggered from an element and
 * they propagate up the DOM until they reach the `documentElement` (`<body>`).
 *
 * When a registered shortcut sequence is fired, the shortcut manager checks
 * the node that fired the event and each of its ancestors until a node matches
 * one or more registered selectors. The *first* matching selector in the
 * chain of ancestors will invoke the shortcut handler and the traversal will
 * end at that point. If a node matches more than one selector, the handler for
 * whichever selector is more *specific* fires.
 * @see https://www.w3.org/TR/css3-selectors/#specificity
 *
 * The practical consequence of this is that a very broadly matching selector,
 * e.g. `'*'` or `'div'` may match and therefore invoke a handler *before* a
 * more specific selector. The most common pitfall is to use the universal
 * (`'*'`) selector. For almost any use case where a global keyboard shortcut is
 * required, using the `'body'` selector is more appropriate.
 */
const plugin = {
    id: '@jupyterlab/shortcuts-extension:plugin',
    requires: [coreutils_1.ISettingRegistry],
    activate: (app, settingRegistry) => {
        const { commands } = app;
        settingRegistry
            .load(plugin.id)
            .then(settings => {
            Private.loadShortcuts(commands, settings.composite);
            settings.changed.connect(() => {
                Private.loadShortcuts(commands, settings.composite);
            });
        })
            .catch((reason) => {
            console.error('Loading shortcut settings failed.', reason.message);
        });
    },
    autoStart: true
};
/**
 * Export the plugin as default.
 */
exports.default = plugin;
/**
 * A namespace for private module data.
 */
var Private;
(function (Private) {
    /**
     * The internal collection of currently loaded shortcuts.
     */
    let disposables;
    /**
     * Load the keyboard shortcuts from settings.
     */
    function loadShortcuts(commands, composite) {
        if (disposables) {
            disposables.dispose();
        }
        disposables = Object.keys(composite).reduce((acc, val) => {
            const options = normalizeOptions(composite[val]);
            if (options) {
                acc.add(commands.addKeyBinding(options));
            }
            return acc;
        }, new disposable_1.DisposableSet());
    }
    Private.loadShortcuts = loadShortcuts;
    /**
     * Normalize potential keyboard shortcut options.
     */
    function normalizeOptions(value) {
        if (!value || typeof value !== 'object') {
            return undefined;
        }
        const { isArray } = Array;
        const valid = 'command' in value &&
            'keys' in value &&
            'selector' in value &&
            isArray(value.keys);
        return valid ? value : undefined;
    }
})(Private || (Private = {}));
