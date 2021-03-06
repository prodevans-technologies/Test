/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
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
import * as tslib_1 from "tslib";
import * as React from "react";
import { DISPLAYNAME_PREFIX, Keys, Menu, Utils } from "@blueprintjs/core";
import { executeItemsEqual, getActiveItem, getCreateNewItem, isCreateNewItem, renderFilteredItems, } from "../../common";
var QueryList = /** @class */ (function (_super) {
    tslib_1.__extends(QueryList, _super);
    function QueryList(props, context) {
        var _this = _super.call(this, props, context) || this;
        _this.refHandlers = {
            itemsParent: function (ref) { return (_this.itemsParentRef = ref); },
        };
        /**
         * Flag indicating that we should check whether selected item is in viewport
         * after rendering, typically because of keyboard change. Set to `true` when
         * manipulating state in a way that may cause active item to scroll away.
         */
        _this.shouldCheckActiveItemInViewport = false;
        /**
         * The item that we expect to be the next selected active item (based on click
         * or key interactions). When scrollToActiveItem = false, used to detect if
         * an unexpected external change to the active item has been made.
         */
        _this.expectedNextActiveItem = null;
        /** default `itemListRenderer` implementation */
        _this.renderItemList = function (listProps) {
            var _a = _this.props, initialContent = _a.initialContent, noResults = _a.noResults;
            // omit noResults if createNewItemFromQuery and createNewItemRenderer are both supplied, and query is not empty
            var maybeNoResults = _this.isCreateItemRendered() ? null : noResults;
            var menuContent = renderFilteredItems(listProps, maybeNoResults, initialContent);
            var createItemView = _this.isCreateItemRendered() ? _this.renderCreateItemMenuItem(_this.state.query) : null;
            if (menuContent == null && createItemView == null) {
                return null;
            }
            return (React.createElement(Menu, { ulRef: listProps.itemsParentRef },
                menuContent,
                createItemView));
        };
        /** wrapper around `itemRenderer` to inject props */
        _this.renderItem = function (item, index) {
            var _a = _this.state, activeItem = _a.activeItem, query = _a.query;
            var matchesPredicate = _this.state.filteredItems.indexOf(item) >= 0;
            var modifiers = {
                active: executeItemsEqual(_this.props.itemsEqual, getActiveItem(activeItem), item),
                disabled: isItemDisabled(item, index, _this.props.itemDisabled),
                matchesPredicate: matchesPredicate,
            };
            return _this.props.itemRenderer(item, {
                handleClick: function (e) { return _this.handleItemSelect(item, e); },
                index: index,
                modifiers: modifiers,
                query: query,
            });
        };
        _this.renderCreateItemMenuItem = function (query) {
            var activeItem = _this.state.activeItem;
            var handleClick = function (evt) {
                _this.handleItemCreate(query, evt);
            };
            var isActive = isCreateNewItem(activeItem);
            return Utils.safeInvoke(_this.props.createNewItemRenderer, query, isActive, handleClick);
        };
        _this.handleItemCreate = function (query, evt) {
            // we keep a cached createNewItem in state, but might as well recompute
            // the result just to be sure it's perfectly in sync with the query.
            var item = Utils.safeInvoke(_this.props.createNewItemFromQuery, query);
            if (item != null) {
                Utils.safeInvoke(_this.props.onItemSelect, item, evt);
                _this.setQuery("", true);
            }
        };
        _this.handleItemSelect = function (item, event) {
            _this.setActiveItem(item);
            Utils.safeInvoke(_this.props.onItemSelect, item, event);
            if (_this.props.resetOnSelect) {
                _this.setQuery("", true);
            }
        };
        _this.handlePaste = function (queries) {
            var _a = _this.props, createNewItemFromQuery = _a.createNewItemFromQuery, onItemsPaste = _a.onItemsPaste;
            var nextActiveItem;
            var nextQueries = [];
            // Find an exising item that exactly matches each pasted value, or
            // create a new item if possible. Ignore unmatched values if creating
            // items is disabled.
            var pastedItemsToEmit = [];
            for (var _i = 0, queries_1 = queries; _i < queries_1.length; _i++) {
                var query = queries_1[_i];
                var equalItem = getMatchingItem(query, _this.props);
                if (equalItem !== undefined) {
                    nextActiveItem = equalItem;
                    pastedItemsToEmit.push(equalItem);
                }
                else if (_this.canCreateItems()) {
                    var newItem = Utils.safeInvoke(createNewItemFromQuery, query);
                    if (newItem !== undefined) {
                        pastedItemsToEmit.push(newItem);
                    }
                }
                else {
                    nextQueries.push(query);
                }
            }
            // UX nicety: combine all unmatched queries into a single
            // comma-separated query in the input, so we don't lose any information.
            // And don't reset the active item; we'll do that ourselves below.
            _this.setQuery(nextQueries.join(", "), false);
            // UX nicety: update the active item if we matched with at least one
            // existing item.
            if (nextActiveItem !== undefined) {
                _this.setActiveItem(nextActiveItem);
            }
            Utils.safeInvoke(onItemsPaste, pastedItemsToEmit);
        };
        _this.handleKeyDown = function (event) {
            var keyCode = event.keyCode;
            if (keyCode === Keys.ARROW_UP || keyCode === Keys.ARROW_DOWN) {
                event.preventDefault();
                var nextActiveItem = _this.getNextActiveItem(keyCode === Keys.ARROW_UP ? -1 : 1);
                if (nextActiveItem != null) {
                    _this.setActiveItem(nextActiveItem);
                }
            }
            Utils.safeInvoke(_this.props.onKeyDown, event);
        };
        _this.handleKeyUp = function (event) {
            var onKeyUp = _this.props.onKeyUp;
            var activeItem = _this.state.activeItem;
            // using keyup for enter to play nice with Button's keyboard clicking.
            // if we were to process enter on keydown, then Button would click itself on keyup
            // and the popvoer would re-open out of our control :(.
            if (event.keyCode === Keys.ENTER) {
                event.preventDefault();
                if (activeItem == null || isCreateNewItem(activeItem)) {
                    _this.handleItemCreate(_this.state.query, event);
                }
                else {
                    _this.handleItemSelect(activeItem, event);
                }
            }
            Utils.safeInvoke(onKeyUp, event);
        };
        _this.handleQueryChange = function (event) {
            var query = event == null ? "" : event.target.value;
            _this.setQuery(query);
            Utils.safeInvoke(_this.props.onQueryChange, query, event);
        };
        var _a = props.query, query = _a === void 0 ? "" : _a;
        var createNewItem = Utils.safeInvoke(props.createNewItemFromQuery, query);
        var filteredItems = getFilteredItems(query, props);
        _this.state = {
            activeItem: _this.props.activeItem !== undefined
                ? _this.props.activeItem
                : getFirstEnabledItem(filteredItems, props.itemDisabled),
            createNewItem: createNewItem,
            filteredItems: filteredItems,
            query: query,
        };
        return _this;
    }
    QueryList.ofType = function () {
        return QueryList;
    };
    QueryList.prototype.render = function () {
        var _a = this.props, className = _a.className, items = _a.items, renderer = _a.renderer, _b = _a.itemListRenderer, itemListRenderer = _b === void 0 ? this.renderItemList : _b;
        var _c = this.state, createNewItem = _c.createNewItem, spreadableState = tslib_1.__rest(_c, ["createNewItem"]);
        return renderer(tslib_1.__assign({}, spreadableState, { className: className, handleItemSelect: this.handleItemSelect, handleKeyDown: this.handleKeyDown, handleKeyUp: this.handleKeyUp, handlePaste: this.handlePaste, handleQueryChange: this.handleQueryChange, itemList: itemListRenderer(tslib_1.__assign({}, spreadableState, { items: items, itemsParentRef: this.refHandlers.itemsParent, renderItem: this.renderItem })) }));
    };
    QueryList.prototype.componentWillReceiveProps = function (nextProps) {
        if (nextProps.activeItem !== undefined) {
            this.shouldCheckActiveItemInViewport = true;
            this.setState({ activeItem: nextProps.activeItem });
        }
        if (nextProps.query != null) {
            this.setQuery(nextProps.query, nextProps.resetOnQuery, nextProps);
        }
    };
    QueryList.prototype.componentDidUpdate = function (prevProps) {
        var _this = this;
        if (!Utils.shallowCompareKeys(this.props, prevProps, {
            include: ["items", "itemListPredicate", "itemPredicate"],
        })) {
            this.setQuery(this.state.query);
        }
        if (this.shouldCheckActiveItemInViewport) {
            // update scroll position immediately before repaint so DOM is accurate
            // (latest filteredItems) and to avoid flicker.
            requestAnimationFrame(function () { return _this.scrollActiveItemIntoView(); });
            // reset the flag
            this.shouldCheckActiveItemInViewport = false;
        }
    };
    QueryList.prototype.scrollActiveItemIntoView = function () {
        var scrollToActiveItem = this.props.scrollToActiveItem !== false;
        var externalChangeToActiveItem = !executeItemsEqual(this.props.itemsEqual, getActiveItem(this.expectedNextActiveItem), getActiveItem(this.props.activeItem));
        this.expectedNextActiveItem = null;
        if (!scrollToActiveItem && externalChangeToActiveItem) {
            return;
        }
        var activeElement = this.getActiveElement();
        if (this.itemsParentRef != null && activeElement != null) {
            var activeTop = activeElement.offsetTop, activeHeight = activeElement.offsetHeight;
            var _a = this.itemsParentRef, parentOffsetTop = _a.offsetTop, parentScrollTop = _a.scrollTop, parentHeight = _a.clientHeight;
            // compute padding on parent element to ensure we always leave space
            var _b = this.getItemsParentPadding(), paddingTop = _b.paddingTop, paddingBottom = _b.paddingBottom;
            // compute the two edges of the active item for comparison, including parent padding
            var activeBottomEdge = activeTop + activeHeight + paddingBottom - parentOffsetTop;
            var activeTopEdge = activeTop - paddingTop - parentOffsetTop;
            if (activeBottomEdge >= parentScrollTop + parentHeight) {
                // offscreen bottom: align bottom of item with bottom of viewport
                this.itemsParentRef.scrollTop = activeBottomEdge + activeHeight - parentHeight;
            }
            else if (activeTopEdge <= parentScrollTop) {
                // offscreen top: align top of item with top of viewport
                this.itemsParentRef.scrollTop = activeTopEdge - activeHeight;
            }
        }
    };
    QueryList.prototype.setQuery = function (query, resetActiveItem, props) {
        if (resetActiveItem === void 0) { resetActiveItem = this.props.resetOnQuery; }
        if (props === void 0) { props = this.props; }
        var createNewItemFromQuery = props.createNewItemFromQuery;
        this.shouldCheckActiveItemInViewport = true;
        var hasQueryChanged = query !== this.state.query;
        if (hasQueryChanged) {
            Utils.safeInvoke(props.onQueryChange, query);
        }
        var filteredItems = getFilteredItems(query, props);
        var createNewItem = createNewItemFromQuery != null && query !== "" ? createNewItemFromQuery(query) : undefined;
        this.setState({ createNewItem: createNewItem, filteredItems: filteredItems, query: query });
        // always reset active item if it's now filtered or disabled
        var activeIndex = this.getActiveIndex(filteredItems);
        var shouldUpdateActiveItem = resetActiveItem ||
            activeIndex < 0 ||
            isItemDisabled(getActiveItem(this.state.activeItem), activeIndex, props.itemDisabled);
        if (hasQueryChanged && shouldUpdateActiveItem) {
            this.setActiveItem(getFirstEnabledItem(filteredItems, props.itemDisabled));
        }
    };
    QueryList.prototype.getActiveElement = function () {
        var activeItem = this.state.activeItem;
        if (this.itemsParentRef != null) {
            if (isCreateNewItem(activeItem)) {
                return this.itemsParentRef.children.item(this.state.filteredItems.length);
            }
            else {
                var activeIndex = this.getActiveIndex();
                return this.itemsParentRef.children.item(activeIndex);
            }
        }
        return undefined;
    };
    QueryList.prototype.getActiveIndex = function (items) {
        if (items === void 0) { items = this.state.filteredItems; }
        var activeItem = this.state.activeItem;
        if (activeItem == null || isCreateNewItem(activeItem)) {
            return -1;
        }
        // NOTE: this operation is O(n) so it should be avoided in render(). safe for events though.
        for (var i = 0; i < items.length; ++i) {
            if (executeItemsEqual(this.props.itemsEqual, items[i], activeItem)) {
                return i;
            }
        }
        return -1;
    };
    QueryList.prototype.getItemsParentPadding = function () {
        // assert ref exists because it was checked before calling
        var _a = getComputedStyle(this.itemsParentRef), paddingTop = _a.paddingTop, paddingBottom = _a.paddingBottom;
        return {
            paddingBottom: pxToNumber(paddingBottom),
            paddingTop: pxToNumber(paddingTop),
        };
    };
    /**
     * Get the next enabled item, moving in the given direction from the start
     * index. A `null` return value means no suitable item was found.
     * @param direction amount to move in each iteration, typically +/-1
     */
    QueryList.prototype.getNextActiveItem = function (direction, startIndex) {
        if (startIndex === void 0) { startIndex = this.getActiveIndex(); }
        if (this.isCreateItemRendered()) {
            var reachedCreate = (startIndex === 0 && direction === -1) ||
                (startIndex === this.state.filteredItems.length - 1 && direction === 1);
            if (reachedCreate) {
                return getCreateNewItem();
            }
        }
        return getFirstEnabledItem(this.state.filteredItems, this.props.itemDisabled, direction, startIndex);
    };
    QueryList.prototype.setActiveItem = function (activeItem) {
        this.expectedNextActiveItem = activeItem;
        if (this.props.activeItem === undefined) {
            // indicate that the active item may need to be scrolled into view after update.
            this.shouldCheckActiveItemInViewport = true;
            this.setState({ activeItem: activeItem });
        }
        if (isCreateNewItem(activeItem)) {
            Utils.safeInvoke(this.props.onActiveItemChange, null, true);
        }
        else {
            Utils.safeInvoke(this.props.onActiveItemChange, activeItem, false);
        }
    };
    QueryList.prototype.isCreateItemRendered = function () {
        return (this.canCreateItems() &&
            this.state.query !== "" &&
            // this check is unfortunately O(N) on the number of items, but
            // alas, hiding the "Create Item" option when it exactly matches an
            // existing item is much clearer.
            !this.wouldCreatedItemMatchSomeExistingItem());
    };
    QueryList.prototype.canCreateItems = function () {
        return this.props.createNewItemFromQuery != null && this.props.createNewItemRenderer != null;
    };
    QueryList.prototype.wouldCreatedItemMatchSomeExistingItem = function () {
        var _this = this;
        // search only the filtered items, not the full items list, because we
        // only need to check items that match the current query.
        return this.state.filteredItems.some(function (item) {
            return executeItemsEqual(_this.props.itemsEqual, item, _this.state.createNewItem);
        });
    };
    QueryList.displayName = DISPLAYNAME_PREFIX + ".QueryList";
    QueryList.defaultProps = {
        resetOnQuery: true,
    };
    return QueryList;
}(React.Component));
export { QueryList };
function pxToNumber(value) {
    return value == null ? 0 : parseInt(value.slice(0, -2), 10);
}
function getMatchingItem(query, _a) {
    var items = _a.items, itemPredicate = _a.itemPredicate;
    if (Utils.isFunction(itemPredicate)) {
        // .find() doesn't exist in ES5. Alternative: use a for loop instead of
        // .filter() so that we can return as soon as we find the first match.
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (itemPredicate(query, item, i, true)) {
                return item;
            }
        }
    }
    return undefined;
}
function getFilteredItems(query, _a) {
    var items = _a.items, itemPredicate = _a.itemPredicate, itemListPredicate = _a.itemListPredicate;
    if (Utils.isFunction(itemListPredicate)) {
        // note that implementations can reorder the items here
        return itemListPredicate(query, items);
    }
    else if (Utils.isFunction(itemPredicate)) {
        return items.filter(function (item, index) { return itemPredicate(query, item, index); });
    }
    return items;
}
/** Wrap number around min/max values: if it exceeds one bound, return the other. */
function wrapNumber(value, min, max) {
    if (value < min) {
        return max;
    }
    else if (value > max) {
        return min;
    }
    return value;
}
function isItemDisabled(item, index, itemDisabled) {
    if (itemDisabled == null || item == null) {
        return false;
    }
    else if (Utils.isFunction(itemDisabled)) {
        return itemDisabled(item, index);
    }
    return !!item[itemDisabled];
}
/**
 * Get the next enabled item, moving in the given direction from the start
 * index. A `null` return value means no suitable item was found.
 * @param items the list of items
 * @param isItemDisabled callback to determine if a given item is disabled
 * @param direction amount to move in each iteration, typically +/-1
 * @param startIndex which index to begin moving from
 */
export function getFirstEnabledItem(items, itemDisabled, direction, startIndex) {
    if (direction === void 0) { direction = 1; }
    if (startIndex === void 0) { startIndex = items.length - 1; }
    if (items.length === 0) {
        return null;
    }
    // remember where we started to prevent an infinite loop
    var index = startIndex;
    var maxIndex = items.length - 1;
    do {
        // find first non-disabled item
        index = wrapNumber(index + direction, 0, maxIndex);
        if (!isItemDisabled(items[index], index, itemDisabled)) {
            return items[index];
        }
    } while (index !== startIndex);
    return null;
}
//# sourceMappingURL=queryList.js.map