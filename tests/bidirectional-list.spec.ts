import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse';

type Stats = {
  min: number;
  max: number;
  count: number;
};

type Hits = {
  head: number;
  tail: number;
};

const directions: Direction[] = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
];

async function readStats(page: Page) {
  return await page.evaluate<[], Stats>(() => {
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
