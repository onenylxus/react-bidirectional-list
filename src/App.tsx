import { useMemo, useState } from 'react';
import TestList from './components/TestList';
import './App.css';
import type { Globals, Property } from 'csstype';

type FlexDirection = Exclude<Property.FlexDirection, Globals>;
type BoundaryMode = 'both' | 'head-only' | 'tail-only' | 'none';

const DIRECTIONS: FlexDirection[] = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
];

const BOUNDARY_MODES: BoundaryMode[] = [
  'both',
  'head-only',
  'tail-only',
  'none',
];

function readInitialDirection(): FlexDirection {
  const fromQuery = new URLSearchParams(window.location.search).get(
    'direction',
  );
  if (!fromQuery || !DIRECTIONS.includes(fromQuery as FlexDirection)) {
    return 'row';
  }

  return fromQuery as FlexDirection;
}

function readInitialBoundaryMode(): BoundaryMode {
  const fromQuery = new URLSearchParams(window.location.search).get('mode');
  if (!fromQuery || !BOUNDARY_MODES.includes(fromQuery as BoundaryMode)) {
    return 'both';
  }

  return fromQuery as BoundaryMode;
}

function readShouldMutateItems() {
  const fromQuery = new URLSearchParams(window.location.search).get('mutate');
  return fromQuery !== 'false';
}

function App() {
  const [direction, setDirection] =
    useState<FlexDirection>(readInitialDirection);
  const [boundaryMode, setBoundaryMode] = useState<BoundaryMode>(
    readInitialBoundaryMode,
  );
  const [shouldMutateItems] = useState(readShouldMutateItems);
  const isRow = useMemo(() => direction.includes('row'), [direction]);
  const hasMoreAtHead = boundaryMode === 'both' || boundaryMode === 'head-only';
  const hasMoreAtTail = boundaryMode === 'both' || boundaryMode === 'tail-only';
  const [headHits, setHeadHits] = useState(0);
  const [tailHits, setTailHits] = useState(0);

  return (
    <div
      className="container"
      style={{
        display: 'grid',
        boxSizing: 'border-box',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#f8f8f8',
        margin: 0,
        padding: '16px',
        justifyItems: 'center',
        alignContent: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="direction-select" style={{ fontWeight: 600 }}>
            Direction
          </label>
          <select
            id="direction-select"
            data-testid="direction-select"
            value={direction}
            onChange={(e) =>
              setDirection(e.currentTarget.value as FlexDirection)
            }
          >
            {DIRECTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="boundary-mode-select" style={{ fontWeight: 600 }}>
            Boundary mode
          </label>
          <select
            id="boundary-mode-select"
            data-testid="boundary-mode-select"
            value={boundaryMode}
            onChange={(e) =>
              setBoundaryMode(e.currentTarget.value as BoundaryMode)
            }
          >
            {BOUNDARY_MODES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        data-testid="list-shell"
        style={{
          width: isRow ? '560px' : '140px',
          height: isRow ? '140px' : '520px',
          maxWidth: '92vw',
          maxHeight: '72vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ display: 'none' }}>
          <span data-testid="head-hits">{headHits}</span>
          <span data-testid="tail-hits">{tailHits}</span>
        </div>
        <TestList
          key={direction}
          direction={direction}
          hasMoreAtHead={hasMoreAtHead}
          hasMoreAtTail={hasMoreAtTail}
          batchSize={20}
          throttleDelay={50}
          mutateOnHit={shouldMutateItems}
          onHeadHit={() => setHeadHits((prev) => prev + 1)}
          onTailHit={() => setTailHits((prev) => prev + 1)}
          viewportStyle={{
            [isRow ? 'width' : 'height']: isRow ? '520px' : '480px',
            [isRow ? 'height' : 'width']: '52px',
            maxWidth: '88vw',
            maxHeight: '66vh',
          }}
        />
      </div>
    </div>
  );
}

export default App;
