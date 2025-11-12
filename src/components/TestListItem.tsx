'use client';

/**
 * Props for the **TestListItem** component.
 */
interface TestListItemProps {
  /**
   * Item ID that is displayed and used to distinguish between other items in
   * a list.
   */
  itemId: number;

  /**
   * Item width (required in column list).
   */
  width?: React.CSSProperties['width'];

  /**
   * Item height (required in row list).
   */
  height?: React.CSSProperties['height'];

  /**
   * Background color of the item.
   */
  color?: React.CSSProperties['backgroundColor'];
}

/**
 * *Testing component*
 *
 * Test list item component shows a simple div element that can be placed
 * within a test list.
 *
 * @param props - Props for the **TestListItem** component
 * @returns Rendered test list item component
 */
export default function TestListItem({
  itemId,
  width,
  height,
  color,
}: TestListItemProps) {
  return (
    <div
      id={`test-list-item-${itemId}`}
      className="test-list-item"
      style={{
        display: 'flex',
        minWidth: width,
        minHeight: height,
        margin: '4px',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: color,
      }}
    >
      <span>Item {itemId}</span>
    </div>
  );
}
