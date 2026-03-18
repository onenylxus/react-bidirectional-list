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

function getContrastTextColor(
  backgroundColor?: React.CSSProperties['backgroundColor'],
) {
  if (typeof backgroundColor !== 'string') return '#111';

  const hex = backgroundColor.trim();
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
  if (!isHex) return '#111';

  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;

  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  const linear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  const luminance =
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;

  return contrastWithWhite > contrastWithBlack ? '#fff' : '#000';
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
  const textColor = getContrastTextColor(color);

  return (
    <div
      id={`test-list-item-${itemId}`}
      className="test-list-item e2e-item"
      data-item-id={itemId}
      style={{
        display: 'flex',
        flex: '0 0 auto',
        width: width ?? '32px',
        height: height ?? '32px',
        aspectRatio: '1 / 1',
        margin: '2px',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '3px',
        backgroundColor: color,
        color: textColor,
        fontSize: '10px',
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      <span>{itemId}</span>
    </div>
  );
}
