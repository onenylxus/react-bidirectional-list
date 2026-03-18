import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useThrottle from '../hooks/useThrottle';
import Observer, { type ObserverCallback } from './Observer';
import type { Globals, Property } from 'csstype';

/**
 * The **flex-direction** CSS property sets how flex items are placed in the
 * flex container defining the main axis and the direction (normal or
 * reversed).
 *
 * Only explicit values are accepted.
 */
type FlexDirection = Exclude<Property.FlexDirection, Globals>;

/**
 * Incidates which end of the list is triggered.
 */
type Action = 'head' | 'tail';

/**
 * Props for the **BidrectionalList** component.
 */
interface BidirectionalListProps {
  /**
   * Flex direction of the list. Determines how list items are displayed.
   */
  direction: FlexDirection;

  /**
   * List items in bidirectional list.
   */
  children?: React.ReactNode;

  /**
   * Loader component that appears when new items are appending.
   */
  loader?: React.ReactNode;

  /**
   * Indicates whether there are more items to append when the list is scrolled
   * to the head.
   */
  hasMoreAtHead: boolean;

  /**
   * Indicates whether there are more items to append when the list is scrolled
   * to the tail.
   */
  hasMoreAtTail: boolean;

  /**
   * Time interval (in milliseconds) to throttle callback functions.
   */
  throttleDelay?: number;

  /**
   * Indicates whether log output should be disabled.
   */
  disableLog?: boolean;

  /**
   * CSS style of viewport div.
   */
  viewportStyle?: React.CSSProperties;

  /**
   * CSS style of content div. Display is always `flex`, and flex direction has
   * no effect here.
   */
  contentStyle?: Omit<React.CSSProperties, 'display' | 'flexDirection'>;

  /**
   * CSS style of observer div at the head of the list.
   */
  headObserverStyle?: React.CSSProperties;

  /**
   * CSS style of observer div at the tail of the list.
   */
  tailObserverStyle?: React.CSSProperties;

  /**
   * Callback function when the head observer intersects with the viewport.
   */
  onHead?: ObserverCallback;

  /**
   * Callback function when the tail observer intersects with the viewport.
   */
  onTail?: ObserverCallback;
}

// Snippet types
type P = Parameters<ObserverCallback>;
type R = ReturnType<ObserverCallback>;

function getScrollBounds(viewport: HTMLDivElement, isColumn: boolean) {
  if (isColumn) {
    const original = viewport.scrollTop;
    const values = [original];

    viewport.scrollTop = -Number.MAX_SAFE_INTEGER;
    values.push(viewport.scrollTop);
    viewport.scrollTop = Number.MAX_SAFE_INTEGER;
    values.push(viewport.scrollTop);

    const min = Math.min(...values);
    const max = Math.max(...values);
    viewport.scrollTop = original;
    return { min, max };
  }

  const original = viewport.scrollLeft;
  const values = [original];

  viewport.scrollLeft = -Number.MAX_SAFE_INTEGER;
  values.push(viewport.scrollLeft);
  viewport.scrollLeft = Number.MAX_SAFE_INTEGER;
  values.push(viewport.scrollLeft);

  const min = Math.min(...values);
  const max = Math.max(...values);
  viewport.scrollLeft = original;
  return { min, max };
}

/**
 * Bidirectional list component shows list items in a direction, and fires
 * callback when it is scrolled to either the head or the tail.
 *
 * @param props - Props for the **BidirectionalList** component.
 * @returns Rendered bidirectional list component
 */
export default function BidirectionalList({
  direction,
  children,
  loader,
  hasMoreAtHead,
  hasMoreAtTail,
  throttleDelay,
  disableLog,
  viewportStyle,
  contentStyle,
  headObserverStyle,
  tailObserverStyle,
  onHead,
  onTail,
}: BidirectionalListProps) {
  /*
  Memoize the list direction. If direction value in props changed, suggest that
  the component should be rebuilt.
  */

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const directionMemo = useMemo(() => direction, []);
  const isColumn = directionMemo.includes('column');

  useEffect(() => {
    if (direction !== directionMemo && !disableLog) {
      console.warn(
        '%creact-bidirectional-list%c: direction prop changed after init (current: ' +
          direction +
          ', original: ' +
          directionMemo +
          '), should rebuild list if this is intended',
        'font-weight: bold',
        'font-weight: normal',
      );
    }
  }, [direction, directionMemo, disableLog]);

  /*
  Get the viewport when list component mounts, and apply it to observers.
  */

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headObserverRef = useRef<HTMLDivElement>(null);
  const tailObserverRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const initialPositionedRef = useRef(false);

  useEffect(() => {
    if (viewportRef.current) setViewport(viewportRef.current);
  }, []);

  /*
  Save scroll states if callbacks are fired. After the layout changed, restore
  the original scroll view.
  */

  const [action, setAction] = useState<Action | undefined>();
  const scrollWidthRef = useRef(0);
  const scrollHeightRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);

  const saveScrollStates = useCallback(
    (pending: Action) => {
      if (viewportRef.current) {
        if (isColumn) {
          scrollHeightRef.current = viewportRef.current.scrollHeight;
          scrollTopRef.current = viewportRef.current.scrollTop;
        } else {
          scrollWidthRef.current = viewportRef.current.scrollWidth;
          scrollLeftRef.current = viewportRef.current.scrollLeft;
        }
        setAction(pending);
      }
    },
    [isColumn],
  );

  useLayoutEffect(() => {
    if (!viewportRef.current || !action) return;

    const isHead = action === 'head';

    let diff = 0;
    if (isColumn) {
      diff = viewportRef.current.scrollHeight - scrollHeightRef.current;
    } else {
      diff = viewportRef.current.scrollWidth - scrollWidthRef.current;
    }

    switch (directionMemo) {
      case 'row':
        if (isHead) {
          viewportRef.current.scrollLeft = scrollLeftRef.current + diff;
        } else {
          viewportRef.current.scrollLeft = scrollLeftRef.current;
        }
        break;

      case 'row-reverse':
        if (isHead) {
          viewportRef.current.scrollLeft = scrollLeftRef.current;
        } else {
          viewportRef.current.scrollLeft = scrollLeftRef.current + diff;
        }
        break;

      case 'column':
        if (isHead) {
          viewportRef.current.scrollTop = scrollTopRef.current + diff;
        } else {
          viewportRef.current.scrollTop = scrollTopRef.current;
        }
        break;

      case 'column-reverse':
        if (isHead) {
          viewportRef.current.scrollTop = scrollTopRef.current;
        } else {
          viewportRef.current.scrollTop = scrollTopRef.current + diff;
        }
        break;

      default:
        if (!disableLog) {
          console.error(
            '%creact-bidirectional-list%c: internal error (unhandled direction case), please report bug by posting an issue at https://github.com/onenylxus/react-bidirectional-list/issues',
            'font-weight: bold',
            'font-weight: normal',
          );
        }
    }

    setAction(undefined);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  useLayoutEffect(() => {
    if (
      initialPositionedRef.current ||
      action ||
      !viewportRef.current ||
      !contentRef.current
    )
      return;
    if (Children.count(children) === 0) return;

    const frame = requestAnimationFrame(() => {
      if (!viewportRef.current || !contentRef.current) return;

      const { min, max } = getScrollBounds(viewportRef.current, isColumn);
      const hasScrollableRange = max !== min;

      if (hasScrollableRange) {
        const isReverse = directionMemo.endsWith('reverse');
        const head = isReverse ? max : min;
        const tail = isReverse ? min : max;
        const center = (min + max) / 2;

        let target = head;
        if (hasMoreAtHead && hasMoreAtTail) {
          target = center;
        } else if (hasMoreAtHead) {
          target = tail;
        }

        if (isColumn) {
          viewportRef.current.scrollTop = target;
        } else {
          viewportRef.current.scrollLeft = target;
        }

        initialPositionedRef.current = true;
        return;
      }

      let target: Element | null = headObserverRef.current;

      if (hasMoreAtHead && hasMoreAtTail) {
        const childrenCount = contentRef.current.children.length;
        const firstDataIndex = 1;
        const lastDataIndex = childrenCount - 2;

        if (lastDataIndex >= firstDataIndex) {
          const middleDataIndex =
            firstDataIndex + Math.floor((lastDataIndex - firstDataIndex) / 2);
          target = contentRef.current.children.item(middleDataIndex);
        }
      } else if (hasMoreAtHead) {
        target = tailObserverRef.current;
      }

      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: 'center', inline: 'center' });
      }

      initialPositionedRef.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [action, children, directionMemo, hasMoreAtHead, hasMoreAtTail, isColumn]);

  /*
  Throttle the callbacks to prevent unexpected repeat calls.
  */

  const onHeadThrottled = useThrottle<P, R>((entries, observer) => {
    if (!hasMoreAtHead) return;
    saveScrollStates('head');
    onHead?.(entries, observer);
  }, throttleDelay);

  const onTailThrottled = useThrottle<P, R>((entries, observer) => {
    if (!hasMoreAtTail) return;
    saveScrollStates('tail');
    onTail?.(entries, observer);
  }, throttleDelay);

  /*
  Assemble components and return a birectional list.
  */

  return (
    <div
      ref={viewportRef}
      className="bidirectional-list-viewport"
      style={{
        ...viewportStyle,
        [isColumn ? 'overflowY' : 'overflowX']: 'auto',
      }}
    >
      <div
        ref={contentRef}
        className="birectional-list-content"
        style={{
          ...contentStyle,
          position: 'relative',
          display: 'flex',
          flexDirection: directionMemo,
          [isColumn ? 'width' : 'height']: '100%',
          ...(!isColumn
            ? {
                width: 'max-content',
                minWidth: '100%',
              }
            : null),
          alignItems: 'stretch',
        }}
      >
        {action === 'head' ? (
          loader
        ) : (
          <Observer
            viewport={viewport}
            observerRef={headObserverRef}
            style={headObserverStyle}
            testId="head-observer"
            onIntersect={onHeadThrottled}
          />
        )}
        {children}
        {action === 'tail' ? (
          loader
        ) : (
          <Observer
            viewport={viewport}
            observerRef={tailObserverRef}
            style={tailObserverStyle}
            testId="tail-observer"
            onIntersect={onTailThrottled}
          />
        )}
      </div>
    </div>
  );
}
