import React, { useEffect, useRef, useState } from "react";

export interface InfiniteListProps<T> {
  items: T[];
  loadMoreItems: () => void;
  itemRenderer: (card: T) => JSX.Element;
  itemProps: any;
  hasMore: Boolean;
  loading: Boolean;
  loadingMessage: string;
  noMoreItemsMessage: string;
}

export interface ItemHolderProps {
  height: number;
  margin: number;
  styles: any;
  index: number;
  child: JSX.Element;
}

// This component is used to wrap each item. It is used to calculate each item's top
// so we can simulate a list layout with absolute positions.
export const ItemHolder = (props: ItemHolderProps) => {
  const { height, margin, styles, index, child } = props;

  return (
    <div
      className="itemHolder"
      style={{ ...styles, height, top: index * (height + margin) + margin }}
    >
      {child}
    </div>
  );
};

function InfiniteList<T extends { id: string | number, index: number }>(props: InfiniteListProps<T>) {
  const {
    // List of items that will go through `itemRenderer` function later.
    // Please note that each item MUST have a valid `index` property.
    items,

    // Item's height and margin are required and are used to calculate each item's top
    // so we can simulate a list layout with absolute positions.
    itemProps = { height: 300, margin: 10, style: {} },

    // Determines if `loadMoreItems` should be called when the list is scrolled to the
    // bottom or not.
    hasMore = true,

    // This callback function is called when ever user reaches the bottom of list.
    loadMoreItems = () => { },

    // These two components will be added to list when data is loading or there are
    // no more items to load. They will be replaced by '-' if not provided.
    loadingMessage = "Loading...",
    noMoreItemsMessage = "No more data",

    // Determines whether new data is being loaded or not.
    loading = false,

    // This function is used to render each item. It will be called for each item in
    // `items` array. since the rendered items are wrapped in an absolute positioned
    // div, there is no need to use a `key` prop.
    itemRenderer = (item) => item,
  } = props;

  // This ref is used to get the list's height and scroll position.
  const listRef = useRef<HTMLDivElement>(null);

  // We need to keep track of list's height and scroll position to determine which
  // items are visible and which are not. So we can render only visible items.
  // We also need to know if user has reached the bottom of list or not.
  const [listHeight, setListHeight] = useState(0);
  const [listScrollTop, setListScrollTop] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);

  const handleScroll = () => {
    // @ts-ignore
    const { scrollTop, scrollHeight, offsetHeight } = listRef.current;
    setListScrollTop(scrollTop);
    setReachedEnd(scrollHeight - scrollTop < offsetHeight + 10);
  };

  const handleResize = () => {
    if (listRef.current) {
      const listHeight = listRef.current.offsetHeight;
      setListHeight(listHeight);
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Trigger `loadMoreItems` when user reaches the bottom of list.
  useEffect(() => {
    if (reachedEnd && hasMore) loadMoreItems();
  }, [reachedEnd]);

  // This function to determines if an item is visible or not. It is used to
  // filter out invisible items. It uses `listScrollTop` and `listHeight` to calculate
  // the visible area of list. Then it uses item's index, height and margin to calculate
  // the visible area of each item. If the two areas overlap, the item is visible.
  function isVisible(index: number) {
    const { height, margin } = itemProps;
    const itemHeight = height + margin;

    const itemTop = index * itemHeight + margin;
    const itemBottom = itemTop + height;
    const listBottom = listScrollTop + listHeight;

    return (
      itemBottom > listScrollTop - itemHeight &&
      itemTop < listBottom + itemHeight
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      position: 'absolute'
    }} ref={listRef} onScroll={handleScroll}>
      {items
        .filter(({ index }) => isVisible(index))
        .map((item) => (
          <ItemHolder
            key={item.id}
            {...itemProps}
            index={item.index}
            child={itemRenderer(item)}
          />
        ))}

      <div
        style={{
          position: 'absolute',
          top:
            items.length * (itemProps.height + itemProps.margin) +
            itemProps.margin,
        }}
      >
        {hasMore
          ? loading
            ? loadingMessage
            : "There is nothing"
          : noMoreItemsMessage}
      </div>
    </div>
  );
};
export default InfiniteList