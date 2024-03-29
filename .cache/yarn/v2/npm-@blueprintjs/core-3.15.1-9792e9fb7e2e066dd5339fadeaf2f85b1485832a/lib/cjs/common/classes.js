"use strict";
/*
 * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var alignment_1 = require("./alignment");
var elevation_1 = require("./elevation");
var intent_1 = require("./intent");
var position_1 = require("./position");
var NS = process.env.BLUEPRINT_NAMESPACE || "bp3";
// modifiers
exports.ACTIVE = NS + "-active";
exports.ALIGN_LEFT = NS + "-align-left";
exports.ALIGN_RIGHT = NS + "-align-right";
exports.DARK = NS + "-dark";
exports.DISABLED = NS + "-disabled";
exports.FILL = NS + "-fill";
exports.FIXED = NS + "-fixed";
exports.FIXED_TOP = NS + "-fixed-top";
exports.INLINE = NS + "-inline";
exports.INTERACTIVE = NS + "-interactive";
exports.LARGE = NS + "-large";
exports.LOADING = NS + "-loading";
exports.MINIMAL = NS + "-minimal";
exports.MULTILINE = NS + "-multiline";
exports.ROUND = NS + "-round";
exports.SMALL = NS + "-small";
exports.VERTICAL = NS + "-vertical";
exports.POSITION_TOP = positionClass(position_1.Position.TOP);
exports.POSITION_BOTTOM = positionClass(position_1.Position.BOTTOM);
exports.POSITION_LEFT = positionClass(position_1.Position.LEFT);
exports.POSITION_RIGHT = positionClass(position_1.Position.RIGHT);
exports.ELEVATION_0 = elevationClass(elevation_1.Elevation.ZERO);
exports.ELEVATION_1 = elevationClass(elevation_1.Elevation.ONE);
exports.ELEVATION_2 = elevationClass(elevation_1.Elevation.TWO);
exports.ELEVATION_3 = elevationClass(elevation_1.Elevation.THREE);
exports.ELEVATION_4 = elevationClass(elevation_1.Elevation.FOUR);
exports.INTENT_PRIMARY = intentClass(intent_1.Intent.PRIMARY);
exports.INTENT_SUCCESS = intentClass(intent_1.Intent.SUCCESS);
exports.INTENT_WARNING = intentClass(intent_1.Intent.WARNING);
exports.INTENT_DANGER = intentClass(intent_1.Intent.DANGER);
exports.FOCUS_DISABLED = NS + "-focus-disabled";
// text utilities
exports.UI_TEXT = NS + "-ui-text";
exports.RUNNING_TEXT = NS + "-running-text";
exports.MONOSPACE_TEXT = NS + "-monospace-text";
exports.TEXT_LARGE = NS + "-text-large";
exports.TEXT_SMALL = NS + "-text-small";
exports.TEXT_MUTED = NS + "-text-muted";
exports.TEXT_DISABLED = NS + "-text-disabled";
exports.TEXT_OVERFLOW_ELLIPSIS = NS + "-text-overflow-ellipsis";
// textual elements
exports.BLOCKQUOTE = NS + "-blockquote";
exports.CODE = NS + "-code";
exports.CODE_BLOCK = NS + "-code-block";
exports.HEADING = NS + "-heading";
exports.LIST = NS + "-list";
exports.LIST_UNSTYLED = NS + "-list-unstyled";
exports.RTL = NS + "-rtl";
// components
exports.ALERT = NS + "-alert";
exports.ALERT_BODY = exports.ALERT + "-body";
exports.ALERT_CONTENTS = exports.ALERT + "-contents";
exports.ALERT_FOOTER = exports.ALERT + "-footer";
exports.BREADCRUMB = NS + "-breadcrumb";
exports.BREADCRUMB_CURRENT = exports.BREADCRUMB + "-current";
exports.BREADCRUMBS = exports.BREADCRUMB + "s";
exports.BREADCRUMBS_COLLAPSED = exports.BREADCRUMB + "s-collapsed";
exports.BUTTON = NS + "-button";
exports.BUTTON_GROUP = exports.BUTTON + "-group";
exports.BUTTON_SPINNER = exports.BUTTON + "-spinner";
exports.BUTTON_TEXT = exports.BUTTON + "-text";
exports.CALLOUT = NS + "-callout";
exports.CALLOUT_ICON = exports.CALLOUT + "-icon";
exports.CARD = NS + "-card";
exports.COLLAPSE = NS + "-collapse";
exports.COLLAPSE_BODY = exports.COLLAPSE + "-body";
exports.COLLAPSIBLE_LIST = NS + "-collapse-list";
exports.CONTEXT_MENU = NS + "-context-menu";
exports.CONTEXT_MENU_POPOVER_TARGET = exports.CONTEXT_MENU + "-popover-target";
exports.CONTROL_GROUP = NS + "-control-group";
exports.DIALOG = NS + "-dialog";
exports.DIALOG_CONTAINER = exports.DIALOG + "-container";
exports.DIALOG_BODY = exports.DIALOG + "-body";
exports.DIALOG_CLOSE_BUTTON = exports.DIALOG + "-close-button";
exports.DIALOG_FOOTER = exports.DIALOG + "-footer";
exports.DIALOG_FOOTER_ACTIONS = exports.DIALOG + "-footer-actions";
exports.DIALOG_HEADER = exports.DIALOG + "-header";
exports.DIVIDER = NS + "-divider";
exports.DRAWER = NS + "-drawer";
exports.DRAWER_BODY = exports.DRAWER + "-body";
exports.DRAWER_FOOTER = exports.DRAWER + "-footer";
exports.DRAWER_HEADER = exports.DRAWER + "-header";
exports.EDITABLE_TEXT = NS + "-editable-text";
exports.EDITABLE_TEXT_CONTENT = exports.EDITABLE_TEXT + "-content";
exports.EDITABLE_TEXT_EDITING = exports.EDITABLE_TEXT + "-editing";
exports.EDITABLE_TEXT_INPUT = exports.EDITABLE_TEXT + "-input";
exports.EDITABLE_TEXT_PLACEHOLDER = exports.EDITABLE_TEXT + "-placeholder";
exports.FLEX_EXPANDER = NS + "-flex-expander";
exports.HTML_SELECT = NS + "-html-select";
/** @deprecated prefer `<HTMLSelect>` component */
exports.SELECT = NS + "-select";
exports.HTML_TABLE = NS + "-html-table";
exports.HTML_TABLE_BORDERED = exports.HTML_TABLE + "-bordered";
exports.HTML_TABLE_CONDENSED = exports.HTML_TABLE + "-condensed";
exports.HTML_TABLE_STRIPED = exports.HTML_TABLE + "-striped";
exports.INPUT = NS + "-input";
exports.INPUT_GHOST = exports.INPUT + "-ghost";
exports.INPUT_GROUP = exports.INPUT + "-group";
exports.INPUT_ACTION = exports.INPUT + "-action";
exports.CONTROL = NS + "-control";
exports.CONTROL_INDICATOR = exports.CONTROL + "-indicator";
exports.CONTROL_INDICATOR_CHILD = exports.CONTROL_INDICATOR + "-child";
exports.CHECKBOX = NS + "-checkbox";
exports.RADIO = NS + "-radio";
exports.SWITCH = NS + "-switch";
exports.SWITCH_INNER_TEXT = exports.SWITCH + "-inner-text";
exports.FILE_INPUT = NS + "-file-input";
exports.FILE_INPUT_HAS_SELECTION = NS + "-file-input-has-selection";
exports.FILE_UPLOAD_INPUT = NS + "-file-upload-input";
exports.KEY = NS + "-key";
exports.KEY_COMBO = exports.KEY + "-combo";
exports.MODIFIER_KEY = NS + "-modifier-key";
exports.HOTKEY = NS + "-hotkey";
exports.HOTKEY_LABEL = exports.HOTKEY + "-label";
exports.HOTKEY_COLUMN = exports.HOTKEY + "-column";
exports.HOTKEY_DIALOG = exports.HOTKEY + "-dialog";
exports.LABEL = NS + "-label";
exports.FORM_GROUP = NS + "-form-group";
exports.FORM_CONTENT = NS + "-form-content";
exports.FORM_HELPER_TEXT = NS + "-form-helper-text";
exports.MENU = NS + "-menu";
exports.MENU_ITEM = exports.MENU + "-item";
exports.MENU_ITEM_LABEL = exports.MENU_ITEM + "-label";
exports.MENU_SUBMENU = NS + "-submenu";
exports.MENU_DIVIDER = exports.MENU + "-divider";
exports.MENU_HEADER = exports.MENU + "-header";
exports.NAVBAR = NS + "-navbar";
exports.NAVBAR_GROUP = exports.NAVBAR + "-group";
exports.NAVBAR_HEADING = exports.NAVBAR + "-heading";
exports.NAVBAR_DIVIDER = exports.NAVBAR + "-divider";
exports.NON_IDEAL_STATE = NS + "-non-ideal-state";
exports.NON_IDEAL_STATE_VISUAL = exports.NON_IDEAL_STATE + "-visual";
exports.NUMERIC_INPUT = NS + "-numeric-input";
exports.OVERFLOW_LIST = NS + "-overflow-list";
exports.OVERFLOW_LIST_SPACER = exports.OVERFLOW_LIST + "-spacer";
exports.OVERLAY = NS + "-overlay";
exports.OVERLAY_BACKDROP = exports.OVERLAY + "-backdrop";
exports.OVERLAY_CONTAINER = exports.OVERLAY + "-container";
exports.OVERLAY_CONTENT = exports.OVERLAY + "-content";
exports.OVERLAY_INLINE = exports.OVERLAY + "-inline";
exports.OVERLAY_OPEN = exports.OVERLAY + "-open";
exports.OVERLAY_SCROLL_CONTAINER = exports.OVERLAY + "-scroll-container";
exports.PANEL_STACK = NS + "-panel-stack";
exports.PANEL_STACK_HEADER = exports.PANEL_STACK + "-header";
exports.PANEL_STACK_HEADER_BACK = exports.PANEL_STACK + "-header-back";
exports.PANEL_STACK_VIEW = exports.PANEL_STACK + "-view";
exports.POPOVER = NS + "-popover";
exports.POPOVER_ARROW = exports.POPOVER + "-arrow";
exports.POPOVER_BACKDROP = exports.POPOVER + "-backdrop";
exports.POPOVER_CONTENT = exports.POPOVER + "-content";
exports.POPOVER_CONTENT_SIZING = exports.POPOVER_CONTENT + "-sizing";
exports.POPOVER_DISMISS = exports.POPOVER + "-dismiss";
exports.POPOVER_DISMISS_OVERRIDE = exports.POPOVER_DISMISS + "-override";
exports.POPOVER_OPEN = exports.POPOVER + "-open";
exports.POPOVER_TARGET = exports.POPOVER + "-target";
exports.POPOVER_WRAPPER = exports.POPOVER + "-wrapper";
exports.TRANSITION_CONTAINER = NS + "-transition-container";
exports.PROGRESS_BAR = NS + "-progress-bar";
exports.PROGRESS_METER = NS + "-progress-meter";
exports.PROGRESS_NO_STRIPES = NS + "-no-stripes";
exports.PROGRESS_NO_ANIMATION = NS + "-no-animation";
exports.PORTAL = NS + "-portal";
exports.SKELETON = NS + "-skeleton";
exports.SLIDER = NS + "-slider";
exports.SLIDER_AXIS = exports.SLIDER + "-axis";
exports.SLIDER_HANDLE = exports.SLIDER + "-handle";
exports.SLIDER_LABEL = exports.SLIDER + "-label";
exports.SLIDER_TRACK = exports.SLIDER + "-track";
exports.SLIDER_PROGRESS = exports.SLIDER + "-progress";
exports.START = NS + "-start";
exports.END = NS + "-end";
exports.SPINNER = NS + "-spinner";
exports.SPINNER_ANIMATION = exports.SPINNER + "-animation";
exports.SPINNER_HEAD = exports.SPINNER + "-head";
exports.SPINNER_NO_SPIN = NS + "-no-spin";
exports.SPINNER_TRACK = exports.SPINNER + "-track";
exports.TAB = NS + "-tab";
exports.TAB_INDICATOR = exports.TAB + "-indicator";
exports.TAB_INDICATOR_WRAPPER = exports.TAB_INDICATOR + "-wrapper";
exports.TAB_LIST = exports.TAB + "-list";
exports.TAB_PANEL = exports.TAB + "-panel";
exports.TABS = exports.TAB + "s";
exports.TAG = NS + "-tag";
exports.TAG_REMOVE = exports.TAG + "-remove";
exports.TAG_INPUT = NS + "-tag-input";
exports.TAG_INPUT_ICON = exports.TAG_INPUT + "-icon";
exports.TAG_INPUT_VALUES = exports.TAG_INPUT + "-values";
exports.TOAST = NS + "-toast";
exports.TOAST_CONTAINER = exports.TOAST + "-container";
exports.TOAST_MESSAGE = exports.TOAST + "-message";
exports.TOOLTIP = NS + "-tooltip";
exports.TOOLTIP_INDICATOR = exports.TOOLTIP + "-indicator";
exports.TREE = NS + "-tree";
exports.TREE_NODE = NS + "-tree-node";
exports.TREE_NODE_CARET = exports.TREE_NODE + "-caret";
exports.TREE_NODE_CARET_CLOSED = exports.TREE_NODE_CARET + "-closed";
exports.TREE_NODE_CARET_NONE = exports.TREE_NODE_CARET + "-none";
exports.TREE_NODE_CARET_OPEN = exports.TREE_NODE_CARET + "-open";
exports.TREE_NODE_CONTENT = exports.TREE_NODE + "-content";
exports.TREE_NODE_EXPANDED = exports.TREE_NODE + "-expanded";
exports.TREE_NODE_ICON = exports.TREE_NODE + "-icon";
exports.TREE_NODE_LABEL = exports.TREE_NODE + "-label";
exports.TREE_NODE_LIST = exports.TREE_NODE + "-list";
exports.TREE_NODE_SECONDARY_LABEL = exports.TREE_NODE + "-secondary-label";
exports.TREE_NODE_SELECTED = exports.TREE_NODE + "-selected";
exports.TREE_ROOT = NS + "-tree-root";
exports.ICON = NS + "-icon";
exports.ICON_STANDARD = exports.ICON + "-standard";
exports.ICON_LARGE = exports.ICON + "-large";
/**
 * Returns the namespace prefix for all Blueprint CSS classes.
 * Customize this namespace at build time with the `process.env.BLUEPRINT_NAMESPACE` environment variable.
 */
function getClassNamespace() {
    return NS;
}
exports.getClassNamespace = getClassNamespace;
/** Return CSS class for alignment. */
function alignmentClass(alignment) {
    switch (alignment) {
        case alignment_1.Alignment.LEFT:
            return exports.ALIGN_LEFT;
        case alignment_1.Alignment.RIGHT:
            return exports.ALIGN_RIGHT;
        default:
            return undefined;
    }
}
exports.alignmentClass = alignmentClass;
function elevationClass(elevation) {
    if (elevation == null) {
        return undefined;
    }
    return NS + "-elevation-" + elevation;
}
exports.elevationClass = elevationClass;
/** Returns CSS class for icon name. */
function iconClass(iconName) {
    if (iconName == null) {
        return undefined;
    }
    return iconName.indexOf(NS + "-icon-") === 0 ? iconName : NS + "-icon-" + iconName;
}
exports.iconClass = iconClass;
/** Return CSS class for intent. */
function intentClass(intent) {
    if (intent == null || intent === intent_1.Intent.NONE) {
        return undefined;
    }
    return NS + "-intent-" + intent.toLowerCase();
}
exports.intentClass = intentClass;
function positionClass(position) {
    if (position == null) {
        return undefined;
    }
    return NS + "-position-" + position;
}
exports.positionClass = positionClass;
//# sourceMappingURL=classes.js.map