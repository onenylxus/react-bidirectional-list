import { useEffect, useRef } from 'react';

/**
 * Callback type equivalent to **IntersectionObserverCallback** that extends
 * generic function type.
 */
export type ObserverCallback = (
  ...args: Parameters<IntersectionObserverCallback>
) => ReturnType<IntersectionObserverCallback>;

/**
 * Props for the **Observer** component.
 */
interface ObserverProps {
  /**
   * Root element for **IntersectionObserver**.
   */
  viewport: HTMLDivElement | null;

  /**
   * Optional style for Observer div element.
   */
  style?: React.CSSProperties;

  /**
   *  Callback that fires when intersection occurs.
   */
  onIntersect: ObserverCallback;
}

/**
 * Observer component helps to observe intersection with the viewport, and
 * fires callback when intersection occurs.
 *
 * @param props - Props for the **Observer** component
 * @returns Rendered observer component
 */
export default function Observer({
  viewport,
  style,
  onIntersect,
}: ObserverProps) {
  const ref = useRef<HTMLDivElement>(null);

  /*
  Set up native **IntersectionObserver**. If observer div intersects with the
  viewport, fire the callback.
  */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        if (entries[0].intersectionRatio > 0) onIntersect(entries, observer);
      },
      { root: viewport, threshold: 0 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onIntersect, viewport]);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        minWidth: style?.minWidth || '1px',
        minHeight: style?.minHeight || '1px',
      }}
    />
  );
}
