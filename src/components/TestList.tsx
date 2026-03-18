'use client';

import { useCallback, useMemo, useState } from 'react';
import BidirectionalList from './BidirectionalList';
import type { Globals, Property } from 'csstype';
import TestListItem from './TestListItem';
import { randHexColor } from '../utils/random';

interface TestData {
  id: number;
  size: React.CSSProperties['width' | 'height'];
  color: React.CSSProperties['backgroundColor'];
}

/**
 * Referenced from *BidirectionalList.tsx*. Test components are not bundled, so
 * we have to isolate the types.
 */
type FlexDirection = Exclude<Property.FlexDirection, Globals>;

/**
 * Props for the **TestList** component.
 */
interface TestListProps {
  /**
   * Flex direction of the list. Determines how list items are displayed.
   */
  direction: FlexDirection;

  /**
   * Number of items to load when callback fires. Actual number may be smaller
   * if the list reaches the limits. By default the value is `20`.
   */
  batchSize?: number;

  /**
   * Time interval (in milliseconds) to throttle callback functions.
   */
  throttleDelay?: number;

  /**
   * The list will stop generating items at the head if ID value exceeds the
   * minimum. The limit is lifted if minimum is not provided.
   */
  idMin?: number;

  /**
   * The list will stop generating items at the tail if ID value exceeds the
   * maximum. The limit is lifted if maximum is not provided.
   */
  idMax?: number;

  /**
   * Explicitly control whether loading at the head is enabled.
   */
  hasMoreAtHead?: boolean;

  /**
   * Explicitly control whether loading at the tail is enabled.
   */
  hasMoreAtTail?: boolean;

  /**
   * Disable data mutation when observer callbacks fire.
   */
  mutateOnHit?: boolean;

  /**
   * Number of initial items, starting from 0. Default is `20`.
   */
  initialCount?: number;

  /**
   * Callback fired each time the head observer callback is triggered.
   */
  onHeadHit?: () => void;

  /**
   * Callback fired each time the tail observer callback is triggered.
   */
  onTailHit?: () => void;

  /**
   * Optional viewport style overrides.
   */
  viewportStyle?: React.CSSProperties;
}

/**
 * *Testing component*
 *
 * Test list component demonstrates **BidirectionalList** with multiple
 * **TestListItem** components.
 *
 * @param props - Props for the **TestList** component
 * @returns Rendered test list component
 */
export default function TestList({
  direction,
  batchSize = 20,
  idMin,
  idMax,
  throttleDelay,
  hasMoreAtHead,
  hasMoreAtTail,
  mutateOnHit = true,
  initialCount = 20,
  onHeadHit,
  onTailHit,
  viewportStyle,
}: TestListProps) {
  /*
  Determine CSS property keys and values based on direction.
  */
  const isRow = useMemo(() => direction.includes('row'), [direction]);
  const mainAxisKey = useMemo(() => (isRow ? 'width' : 'height'), [isRow]);
  const crossAxisKey = useMemo(() => (isRow ? 'height' : 'width'), [isRow]);
  const listSize = useMemo(() => (isRow ? '520px' : '480px'), [isRow]);
  const itemSize = useMemo(() => '32px', []);

  /*
  Store data in an array, and perform data control.
  */
  const [data, setData] = useState<TestData[]>(
    Array.from(
      { length: initialCount },
      (_, index): TestData => ({
        id: index,
        size: itemSize,
        color: index === 0 ? '#f8f8f8' : randHexColor(),
      }),
    ),
  );

  const min = useMemo(() => data.at(0)?.id ?? 0, [data]);
  const max = useMemo(() => data.at(-1)?.id ?? 0, [data]);

  const unshiftData = useCallback(() => {
    onHeadHit?.();
    if (!mutateOnHit) return;

    const allowed = idMin === undefined ? batchSize : Math.max(min - idMin, 0);
    const count = Math.min(batchSize, allowed);
    if (count === 0) return;

    const newData = Array.from(
      { length: count },
      (_, k): TestData => ({
        id: min - count + k,
        size: itemSize,
        color: randHexColor(),
      }),
    );

    setData((prevData) => [...newData, ...prevData]);
  }, [batchSize, idMin, itemSize, min, mutateOnHit, onHeadHit]);

  const pushData = useCallback(() => {
    onTailHit?.();
    if (!mutateOnHit) return;

    const allowed = idMax === undefined ? batchSize : Math.max(idMax - max, 0);
    const count = Math.min(batchSize, allowed);
    if (count === 0) return;

    const newData = Array.from(
      { length: count },
      (_, k): TestData => ({
        id: max + 1 + k,
        size: itemSize,
        color: randHexColor(),
      }),
    );
    setData((prevData) => [...prevData, ...newData]);
  }, [batchSize, idMax, itemSize, max, mutateOnHit, onTailHit]);

  const hasMoreHeadResolved =
    hasMoreAtHead ?? (idMin === undefined ? true : min > idMin);
  const hasMoreTailResolved =
    hasMoreAtTail ?? (idMax === undefined ? true : max < idMax);

  /*
  Converts data into list items.
  */
  return (
    <BidirectionalList
      direction={direction}
      hasMoreAtHead={hasMoreHeadResolved}
      hasMoreAtTail={hasMoreTailResolved}
      throttleDelay={throttleDelay}
      viewportStyle={{
        border: '3px solid #000',
        [mainAxisKey]: listSize,
        [crossAxisKey]: itemSize,
        ...viewportStyle,
      }}
      onHead={unshiftData}
      onTail={pushData}
    >
      {data.map(({ id, size, color }) => (
        <TestListItem
          key={id}
          itemId={id}
          width={size}
          height={size}
          color={color}
        />
      ))}
    </BidirectionalList>
  );
}
