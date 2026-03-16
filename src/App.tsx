import { useCallback, useMemo, useState } from 'react';
import BidirectionalList from './components/BidirectionalList';
import './App.css';
import type { Globals, Property } from 'csstype';

type FlexDirection = Exclude<Property.FlexDirection, Globals>;

const DIRECTIONS: FlexDirection[] = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
];

function App() {
  const [direction, setDirection] = useState<FlexDirection>('row');
  const isRow = useMemo(() => direction.includes('row'), [direction]);
  const [items, setItems] = useState<number[]>(
    Array.from({ length: 20 }, (_, index) => index),
  );
  const [headHits, setHeadHits] = useState(0);
  const [tailHits, setTailHits] = useState(0);

  const mainSize = isRow ? '120px' : '80px';
  const crossSize = isRow ? '80px' : '120px';

  const onHead = useCallback(() => {
    setHeadHits((prev) => prev + 1);
    setItems((prev) => {
      const first = prev[0] ?? 0;
      return [first - 2, first - 1, ...prev];
    });
  }, []);

  const onTail = useCallback(() => {
    setTailHits((prev) => prev + 1);
    setItems((prev) => {
      const last = prev[prev.length - 1] ?? 0;
      return [...prev, last + 1, last + 2];
    });
  }, []);

  return (
    <div
      className="container"
      style={{
        display: 'grid',
        width: '100vw',
        height: '100vh',
        background: '#f8f8f8',
        margin: 0,
        padding: '16px',
        justifyItems: 'center',
        alignContent: 'center',
        gap: '12px',
      }}
    >
      <label htmlFor="direction-select" style={{ fontWeight: 600 }}>
        Direction
      </label>
      <select
        id="direction-select"
        data-testid="direction-select"
        value={direction}
        onChange={(e) => setDirection(e.currentTarget.value as FlexDirection)}
      >
        {DIRECTIONS.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <div
        data-testid="list-shell"
        style={{
          width: isRow ? '80vw' : '32vw',
          height: isRow ? '32vh' : '80vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ display: 'none' }}>
          <span data-testid="head-hits">{headHits}</span>
          <span data-testid="tail-hits">{tailHits}</span>
        </div>
        <BidirectionalList
          key={direction}
          direction={direction}
          hasMoreAtHead
          hasMoreAtTail
          throttleDelay={50}
          viewportStyle={{
            border: '3px solid #000',
            [isRow ? 'width' : 'height']: '75vw',
            [isRow ? 'height' : 'width']: '24vh',
          }}
          onHead={onHead}
          onTail={onTail}
        >
          {items.map((item) => (
            <div
              key={item}
              className="e2e-item"
              data-item-id={item}
              style={{
                minWidth: isRow ? mainSize : crossSize,
                minHeight: isRow ? crossSize : mainSize,
                margin: '4px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid #444',
                background: '#fff',
              }}
            >
              Item {item}
            </div>
          ))}
        </BidirectionalList>
      </div>
    </div>
  );
}

export default App;
