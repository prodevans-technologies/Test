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
import * as React from "react";
import { DISPLAYNAME_PREFIX, Keys, Menu, Utils } from "@blueprintjs/core";
import { executeItemsEqual, getActiveItem, getCreateNewItem, isCreateNewItem, renderFilteredItems, } from "../../common";
export class QueryList extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.refHandlers = {
            itemsParent: (ref) => (this.itemsParentRef = ref),
        };
        /**
         * Flag indicating that we should check whether selected item is in viewport
         * after rendering, typically because of keyboard change. Set to `true` when
         * manipulating state in a way that may cause active item to scroll away.
         */
        this.shouldCheckActiveItemInViewport = false;
        /**
         * The item that we expect to be the next selected active item (based on click
         * or key interactions). When scrollToActiveItem = false, used to detect if
         * an unexpected external change to the active item has been made.
         */
        this.expectedNextActiveItem = null;
        /** default `itemListRenderer` implementation */
        this.renderItemList = (listProps) => {
            const { initialContent, noResults } = this.props;
            // omit noResults if createNewItemFromQuery and createNewItemRenderer are both supplied, and query is not empty
            const maybeNoResults = this.isCreateItemRendered() ? null : noResults;
            const menuContent = renderFilteredItems(listProps, maybeNoResults, initialContent);
            const createItemView = this.isCreateItemRendered() ? this.renderCreateItemMenuItem(this.state.query) : null;
            if (menuContent == null && createItemView == null) {
                return null;
            }
            return (React.createElement(Menu, { ulRef: listProps.itemsParentRef },
                menuContent,
                createItemView));
        };
        /** wrapper around `itemRenderer` to inject props */
        this.renderItem = (item, index) => {
            const { activeItem, query } = this.state;
            const matchesPredicate = this.state.filteredItems.indexOf(item) >= 0;
            const modifiers = {
                active: executeItemsEqual(this.props.itemsEqual, getActiveItem(activeItem), item),
                disabled: isItemDisabled(item, index, this.props.itemDisabled),
                matchesPredicate,
            };
            return this.props.itemRenderer(item, {
                handleClick: e => this.handleItemSelect(item, e),
                index,
                modifiers,
                query,
            });
        };
        this.renderCreateItemMenuItem = (query) => {
            const { activeItem } = this.state;
            const handleClick = evt => {
                this.handleItemCreate(query, evt);
            };
            const isActive = isCreateNewItem(activeItem);
            return Utils.safeInvoke(this.props.createNewItemRenderer, query, isActive, handleClick);
        };
        this.handleItemCreate = (query, evt) => {
            // we keep a cached createNewItem in state, but might as well recompute
            // the result just to be sure it's perfectly in sync with the query.
            const item = Utils.safeInvoke(this.props.createNewItemFromQuery, query);
            if (item != null) {
                Utils.safeInvoke(this.props.onItemSelect, item, evt);
                this.setQuery("", true);
            }
        };
        this.handleItemSelect = (item, event) => {
            this.setActiveItem(item);
            Utils.safeInvoke(this.props.onItemSelect, item, event);
            if (this.props.resetOnSelect) {
                this.setQuery("", true);
            }
        };
        this.handlePaste = (queries) => {
            const { createNewItemFromQuery, onItemsPaste } = this.props;
            let nextActiveItem;
            const nextQueries = [];
            // Find an exising item that exactly matches each pasted value, or
            // create a new item if possible. Ignore unmatched values if creating
            // items is disabled.
            const pastedItemsToEmit = [];
            for (const query of queries) {
                const equalItem = getMatchingItem(query, this.props);
                if (equalItem !== undefined) {
                    nextActiveItem = equalItem;
                    pastedItemsToEmit.push(equalItem);
                }
                else if (this.canCreateItems()) {
                    const newItem = Utils.safeInvoke(createNewItemFromQuery, query);
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
            this.setQuery(nextQueries.join(", "), false);
            // UX nicety: update the active item if we matched with at least one
            // existing item.
            if (nextActiveItem !== undefined) {
                this.setActiveItem(nextActiveItem);
            }
            Utils.safeInvoke(onItemsPaste, pastedItemsToEmit);
        };
        this.handleKeyDown = (event) => {
            const { keyCode } = event;
            if (keyCode === Keys.ARROW_UP || keyCode === Keys.ARROW_DOWN) {
                event.preventDefault();
                const nextActiveItem = this.getNextActiveItem(keyCode === Keys.ARROW_UP ? -1 : 1);
                if (nextActiveItem != null) {
                    this.setActiveItem(nextActiveItem);
                }
            }
            Utils.safeInvoke(this.props.onKeyDown, event);
        };
        this.handleKeyUp = (event) => {
            const { onKeyUp } = this.props;
            const { activeItem } = this.state;
            // using keyup for enter to play nice with Button's keyboard clicking.
            // if we were to process enter on keydown, then Button would click itself on keyup
            // and the popvoer would re-open out of our control :(.
            if (event.keyCode === Keys.ENTER) {
                event.preventDefault();
                if (activeItem == null || isCreateNewItem(activeItem)) {
                    this.handleItemCreate(this.state.query, event);
                }
                else {
                    this.handleItemSelect(activeItem, event);
                }
            }
            Utils.safeInvoke(onKeyUp, event);
        };
        this.handleQueryChange = (event) => {
            const query = event == null ? "" : event.target.value;
            this.setQuery(query);
            Utils.safeInvoke(this.props.onQueryChange, query, event);
        };
        const { query = "" } = props;
        const createNewItem = Utils.safeInvoke(props.createNewItemFromQuery, query);
        const filteredItems = getFilteredItems(query, props);
        this.state = {
            activeItem: this.props.activeItem !== undefined
                ? this.props.activeItem
                : getFirstEnabledItem(filteredItems, props.itemDisabled),
            createNewItem,
            filteredItems,
            query,
        };
    }
    static ofType() {
        return QueryList;
    }
    render() {
        const { className, items, renderer, itemListRenderer = this.renderItemList } = this.props;
        const { createNewItem, ...spreadableState } = this.state;
        return renderer({
            ...spreadableState,
            className,
            handleItemSelect: this.handleItemSelect,
            handleKeyDown: this.handleKeyDown,
            handleKeyUp: this.handleKeyUp,
            handlePaste: this.handlePaste,
            handleQueryChange: this.handleQueryChange,
            itemList: itemListRenderer({
                ...spreadableState,
                items,
                itemsParentRef: this.refHandlers.itemsParent,
                renderItem: this.renderItem,
            }),
        });
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.activeItem !== undefined) {
            this.shouldCheckActiveItemInViewport = true;
            this.setState({ activeItem: nextProps.activeItem });
        }
        if (nextProps.query != null) {
            this.setQuery(nextProps.query, nextProps.resetOnQuery, nextProps);
        }
    }
    componentDidUpdate(prevProps) {
        if (!Utils.shallowCompareKeys(this.props, prevProps, {
            include: ["items", "itemListPredicate", "itemPredicate"],
        })) {
            this.setQuery(this.state.query);
        }
        if (this.shouldCheckActiveItemInViewport) {
            // update scroll position immediately before repaint so DOM is accurate
            // (latest filteredItems) and to avoid flicker.
            requestAnimationFrame(() => this.scrollActiveItemIntoView());
            // reset the flag
            this.shouldCheckActiveItemInViewport = false;
        }
    }
    scrollActiveItemIntoView() {
        const scrollToActiveItem = this.props.scrollToActiveItem !== false;
        const externalChangeToActiveItem = !executeItemsEqual(this.props.itemsEqual, getActiveItem(this.expectedNextActiveItem), getActiveItem(this.props.activeItem));
        this.expectedNextActiveItem = null;
        if (!scrollToActiveItem && externalChangeToActiveItem) {
            return;
        }
        const activeElement = this.getActiveElement();
        if (this.itemsParentRef != null && activeElement != null) {
            const { offsetTop: activeTop, offsetHeight: activeHeight } = activeElement;
            const { offsetTop: parentOffsetTop, scrollTop: parentScrollTop, clientHeight: parentHeight, } = this.itemsParentRef;
            // compute padding on parent element to ensure we always leave space
            const { paddingTop, paddingBottom } = this.getItemsParentPadding();
            // compute the two edges of the active item for comparison, including parent padding
            const activeBottomEdge = activeTop + activeHeight + paddingBottom - parentOffsetTop;
            const activeTopEdge = activeTop - paddingTop - parentOffsetTop;
            if (activeBottomEdge >= parentScrollTop + parentHeight) {
                // offscreen bottom: align bottom of item with bottom of viewport
                this.itemsParentRef.scrollTop = activeBottomEdge + activeHeight - parentHeight;
            }
            else if (activeTopEdge <= parentScrollTop) {
                // offscreen top: align top of item with top of viewport
                this.itemsParentRef.scrollTop = activeTopEdge - activeHeight;
            }
        }
    }
    setQuery(query, resetActiveItem = this.props.resetOnQuery, props = this.props) {
        const { createNewItemFromQuery } = props;
        this.shouldCheckActiveItemInViewport = true;
        const hasQueryChanged = query !== this.state.query;
        if (hasQueryChanged) {
            Utils.safeInvoke(props.onQueryChange, query);
        }
        const filteredItems = getFilteredItems(query, props);
        const createNewItem = createNewItemFromQuery != null && query !== "" ? createNewItemFromQuery(query) : undefined;
        this.setState({ createNewItem, filteredItems, query });
        // always reset active item if it's now filtered or disabled
        const activeIndex = this.getActiveIndex(filteredItems);
        const shouldUpdateActiveItem = resetActiveItem ||
            activeIndex < 0 ||
            isItemDisabled(getActiveItem(this.state.activeItem), activeIndex, props.itemDisabled);
        if (hasQueryChanged && shouldUpdateActiveItem) {
            this.setActiveItem(getFirstEnabledItem(filteredItems, props.itemDisabled));
        }
    }
    getActiveElement() {
        const { activeItem } = this.state;
        if (this.itemsParentRef != null) {
            if (isCreateNewItem(activeItem)) {
                return this.itemsParentRef.children.item(this.state.filteredItems.length);
            }
            else {
                const activeIndex = this.getActiveIndex();
                return this.itemsParentRef.children.item(activeIndex);
            }
        }
        return undefined;
    }
    getActiveIndex(items = this.state.filteredItems) {
        const { activeItem } = this.state;
        if (activeItem == null || isCreateNewItem(activeItem)) {
            return -1;
        }
        // NOTE: this operation is O(n) so it should be avoided in render(). safe for events though.
        for (let i = 0; i < items.length; ++i) {
            if (executeItemsEqual(this.props.itemsEqual, items[i], activeItem)) {
                return i;
            }
        }
        return -1;
    }
    getItemsParentPadding() {
        // assert ref exists because it was checked before calling
        const { paddingTop, paddingBottom } = getComputedStyle(this.itemsParentRef);
        return {
            paddingBottom: pxToNumber(paddingBottom),
            paddingTop: pxToNumber(paddingTop),
        };
    }
    /**
     * Get the next enabled item, moving in the given direction from the start
     * index. A `null` return value means no suitable item was found.
     * @param direction amount to move in each iteration, typically +/-1
     */
    getNextActiveItem(direction, startIndex = this.getActiveIndex()) {
        if (this.isCreateItemRendered()) {
            const reachedCreate = (startIndex === 0 && direction === -1) ||
                (startIndex === this.state.filteredItems.length - 1 && direction === 1);
            if (reachedCreate) {
                return getCreateNewItem();
            }
        }
        return getFirstEnabledItem(this.state.filteredItems, this.props.itemDisabled, direction, startIndex);
    }
    setActiveItem(activeItem) {
        this.expectedNextActiveItem = activeItem;
        if (this.props.activeItem === undefined) {
            // indicate that the active item may need to be scrolled into view after update.
            this.shouldCheckActiveItemInViewport = true;
            this.setState({ activeItem });
        }
        if (isCreateNewItem(activeItem)) {
            Utils.safeInvoke(this.props.onActiveItemChange, null, true);
        }
        else {
            Utils.safeInvoke(this.props.onActiveItemChange, activeItem, false);
        }
    }
    isCreateItemRendered() {
        return (this.canCreateItems() &&
            this.state.query !== "" &&
            // this check is unfortunately O(N) on the number of items, but
            // alas, hiding the "Create Item" option when it exactly matches an
            // existing item is much clearer.
            !this.wouldCreatedItemMatchSomeExistingItem());
    }
    canCreateItems() {
        return this.props.createNewItemFromQuery != null && this.props.createNewItemRenderer != null;
    }
    wouldCreatedItemMatchSomeExistingItem() {
        // search only the filtered items, not the full items list, because we
        // only need to check items that match the current query.
        return this.state.filteredItems.some(item => executeItemsEqual(this.props.itemsEqual, item, this.state.createNewItem));
    }
}
QueryList.displayName = `${DISPLAYNAME_PREFIX}.QueryList`;
QueryList.defaultProps = {
    resetOnQuery: true,
};
function pxToNumber(value) {
    return value == null ? 0 : parseInt(value.slice(0, -2), 10);
}
function getMatchingItem(query, { items, itemPredicate }) {
    if (Utils.isFunction(itemPredicate)) {
        // .find() doesn't exist in ES5. Alternative: use a for loop instead of
        // .filter() so that we can return as soon as we find the first match.
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (itemPredicate(query, item, i, true)) {
                return item;
            }
        }
    }
    return undefined;
}
function getFilteredItems(query, { items, itemPredicate, itemListPredicate }) {
    if (Utils.isFunction(itemListPredicate)) {
        // note that implementations can reorder the items here
        return itemListPredicate(query, items);
    }
    else if (Utils.isFunction(itemPredicate)) {
        return items.filter((item, index) => itemPredicate(query, item, index));
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
export function getFirstEnabledItem(items, itemDisabled, direction = 1, startIndex = items.length - 1) {
    if (items.length === 0) {
        return null;
    }
    // remember where we started to prevent an infinite loop
    let index = startIndex;
    const maxIndex = items.length - 1;
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