import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type BoundaryMode = 'both' | 'head-only' | 'tail-only' | 'none';

type Stats = {
  min: number;
  max: number;
  count: number;
};

type Hits = {
  head: number;
  tail: number;
};

type FocusMetrics = {
  headDistance: number;
  tailDistance: number;
  middleDistance: number;
};

const directions: Direction[] = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
];

async function readStats(page: Page) {
  return await page.evaluate((): Stats => {
    const values = Array.from(document.querySelectorAll('.e2e-item'))
      .map((el) => Number(el.getAttribute('data-item-id')))
      .filter((n) => Number.isFinite(n));

    if (values.length === 0) {
      return { min: 0, max: 0, count: 0 };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  });
}

async function readHits(page: Page) {
  const [headText, tailText] = await Promise.all([
    page.getByTestId('head-hits').innerText(),
    page.getByTestId('tail-hits').innerText(),
  ]);

  return {
    head: Number(headText),
    tail: Number(tailText),
  } as Hits;
}

async function readFocusMetrics(page: Page, direction: Direction) {
  return await page.evaluate((dir: Direction): FocusMetrics => {
    const viewport = document.querySelector('.bidirectional-list-viewport');
    const head = document.querySelector('[data-testid="head-observer"]');
    const tail = document.querySelector('[data-testid="tail-observer"]');
    const items = Array.from(document.querySelectorAll('.e2e-item'));

    if (
      !(viewport instanceof HTMLDivElement) ||
      !(head instanceof HTMLDivElement) ||
      !(tail instanceof HTMLDivElement) ||
      items.length === 0
    ) {
      return {
        headDistance: Number.POSITIVE_INFINITY,
        tailDistance: Number.POSITIVE_INFINITY,
        middleDistance: Number.POSITIVE_INFINITY,
      };
    }

    const axis = dir.includes('column') ? 'y' : 'x';
    const viewportRect = viewport.getBoundingClientRect();
    const headRect = head.getBoundingClientRect();
    const tailRect = tail.getBoundingClientRect();
    const middleRect = items
      .at(Math.floor(items.length / 2))
      ?.getBoundingClientRect();

    if (!middleRect) {
      return {
        headDistance: Number.POSITIVE_INFINITY,
        tailDistance: Number.POSITIVE_INFINITY,
        middleDistance: Number.POSITIVE_INFINITY,
      };
    }

    const distanceToCenter = (rect: DOMRect) => {
      if (axis === 'y') {
        const viewportCenter = viewportRect.top + viewportRect.height / 2;
        const rectCenter = rect.top + rect.height / 2;
        return Math.abs(rectCenter - viewportCenter);
      }

      const viewportCenter = viewportRect.left + viewportRect.width / 2;
      const rectCenter = rect.left + rect.width / 2;
      return Math.abs(rectCenter - viewportCenter);
    };

    return {
      headDistance: distanceToCenter(headRect),
      tailDistance: distanceToCenter(tailRect),
      middleDistance: distanceToCenter(middleRect),
    };
  }, direction);
}

test.describe('BidirectionalList visual behavior across directions', () => {
  for (const direction of directions) {
    test(`loads additional items when scrolled to both boundaries (${direction})`, async ({
      page,
    }) => {
      if (direction === 'row-reverse') {
        test.fail(
          true,
          'Known issue: row-reverse currently does not trigger both observers consistently',
        );
      }

      await page.goto('/');

      const select = page.getByTestId('direction-select');
      await select.selectOption(direction);

      const viewport = page.locator('.bidirectional-list-viewport');
      await expect(viewport).toBeVisible();
      await expect(page.locator('.e2e-item').first()).toBeVisible();

      const baseline = await readStats(page);
      const baselineHits = await readHits(page);

      await page.getByTestId('tail-observer').scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      if (direction === 'row-reverse') {
        await viewport.evaluate((element) => {
          const node = element as HTMLDivElement;
          node.scrollLeft = -node.scrollWidth;
        });
        await page.waitForTimeout(120);
      }
      await page.getByTestId('head-observer').scrollIntoViewIfNeeded();
      await page.waitForTimeout(180);

      await page.getByTestId('head-observer').scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);
      await page.getByTestId('tail-observer').scrollIntoViewIfNeeded();

      const finalHits = await readHits(page);
      expect(finalHits.head).toBeGreaterThan(0);
      expect(finalHits.tail).toBeGreaterThan(0);
      expect(finalHits.head + finalHits.tail).toBeGreaterThan(
        baselineHits.head + baselineHits.tail,
      );

      const finalStats = await readStats(page);
      expect(finalStats.count).toBeGreaterThanOrEqual(baseline.count);
    });
  }
});

test.describe('BidirectionalList initial focus placement', () => {
  const boundaryModes: BoundaryMode[] = [
    'both',
    'head-only',
    'tail-only',
    'none',
  ];

  for (const direction of directions) {
    for (const mode of boundaryModes) {
      test(`sets initial focus for ${mode} (${direction})`, async ({
        page,
      }) => {
        if (
          direction === 'row-reverse' &&
          (mode === 'both' || mode === 'head-only')
        ) {
          test.fail(
            true,
            'Known issue: row-reverse currently has inconsistent boundary behavior',
          );
        }

        await page.goto(`/?direction=${direction}&mode=${mode}&mutate=false`);

        const viewport = page.locator('.bidirectional-list-viewport');
        await expect(viewport).toBeVisible();
        await expect(page.locator('.e2e-item').first()).toBeVisible();
        await page.waitForTimeout(80);

        const metrics = await readFocusMetrics(page, direction);

        if (mode === 'both') {
          expect(metrics.middleDistance).toBeLessThan(metrics.headDistance);
          expect(metrics.middleDistance).toBeLessThan(metrics.tailDistance);
        } else if (mode === 'head-only') {
          expect(metrics.tailDistance).toBeLessThan(metrics.headDistance);
        } else {
          expect(metrics.headDistance).toBeLessThan(metrics.tailDistance);
        }
      });
    }
  }
});
