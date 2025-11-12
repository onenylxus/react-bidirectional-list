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
   * if the list reaches the limits. By default the value is `10`.
   */
  batchSize?: number;

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
  batchSize = 10,
  idMin,
  idMax,
}: TestListProps) {
  /*
  Determine CSS property keys and values based on direction.
  */
  const isRow = useMemo(() => direction.includes('row'), [direction]);
  const mainAxisKey = useMemo(() => (isRow ? 'width' : 'height'), [isRow]);
  const crossAxisKey = useMemo(() => (isRow ? 'height' : 'width'), [isRow]);
  const listSize = useMemo(() => (isRow ? '75vw' : '75vh'), [isRow]);
  const listItemMainSize = useMemo(() => (isRow ? '25vw' : '25vh'), [isRow]);
  const listItemCrossSize = useMemo(() => (isRow ? '10vh' : '10vw'), [isRow]);

  /*
  Store data in an array, and perform data control.
  */
  const [data, setData] = useState<TestData[]>([
    { id: 0, size: listItemMainSize, color: '#f8f8f8' },
  ]);

  const min = useMemo(() => data.at(0)?.id ?? 0, [data]);
  const max = useMemo(() => data.at(-1)?.id ?? 0, [data]);

  const unshiftData = useCallback(() => {
    const count = idMin
      ? Math.max(Math.min(min - idMin, 0), batchSize)
      : batchSize;
    if (count === 0) return;

    const newData = Array.from(
      { length: count },
      (_, k): TestData => ({
        id: min - count + k,
        size: listItemMainSize,
        color: randHexColor(),
      }),
    );

    setData((prevData) => [...newData, ...prevData]);
  }, [batchSize, idMin, listItemMainSize, min]);

  const pushData = useCallback(() => {
    const count = idMax
      ? Math.max(Math.min(max - idMax, 0), batchSize)
      : batchSize;
    if (count === 0) return;

    const newData = Array.from(
      { length: count },
      (_, k): TestData => ({
        id: max + 1 + k,
        size: listItemMainSize,
        color: randHexColor(),
      }),
    );
    setData((prevData) => [...prevData, ...newData]);
  }, [batchSize, idMax, listItemMainSize, max]);

  /*
  Converts data into list items.
  */
  return (
    <BidirectionalList
      direction={direction}
      hasMoreAtHead={idMax ? max < idMax : true}
      hasMoreAtTail={idMin ? min < idMin : true}
      viewportStyle={{
        border: '3px solid #000',
        [mainAxisKey]: listSize,
        [crossAxisKey]: listItemCrossSize,
      }}
      onHead={unshiftData}
      onTail={pushData}
    >
      {data.map(({ id, size, color }) => (
        <TestListItem
          key={id}
          itemId={id}
          {...{ [mainAxisKey]: size }}
          color={color}
        />
      ))}
    </BidirectionalList>
  );
}
