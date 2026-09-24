import { performance } from 'node:perf_hooks';
import { courses } from './data.js';

export class InputError extends Error {}

export function parseFilters(params) {
  const institution = params.get('institutionId') ?? '1';
  const yearText = params.get('year') ?? '2025';
  if (!/^[1-3]$/.test(institution)) throw new InputError('Choose a valid sample institution.');
  if (!/^20\d{2}$/.test(yearText)) throw new InputError('Choose a year between 2000 and 2099.');
  const year = Number(yearText);
  return {
    institutionId: Number(institution), year,
    startDate: `${year}-01-01T00:00:00.000Z`,
    endDate: `${year + 1}-01-01T00:00:00.000Z`,
  };
}

export async function timedQuery(store, filters, mode = 'range') {
  const start = performance.now();
  const rows = await store.query(filters, mode);
  return { rows, durationMs: Number((performance.now() - start).toFixed(3)) };
}

export function present(rows) {
  const responseCount = rows.reduce((sum, row) => sum + row.responseCount, 0);
  const ratingTotal = rows.reduce((sum, row) => sum + row.ratingTotal, 0);
  return {
    rows: rows.map((row) => ({ ...row, ...courses.find((course) => course.id === row.courseOfferingId) })),
    summary: { responseCount, courseCount: rows.length, averageRating: responseCount ? ratingTotal / responseCount : null },
  };
}

// Each variant is warmed once, then measured five times in alternating order.
// Both run against the SAME index. These are query-call timings, not server CPU/IO.
export async function compareQueries(store, filters) {
  const samples = { baseline: [], range: [] };
  let baseline, range;
  await store.query(filters, 'baseline');
  await store.query(filters, 'range');
  for (let i = 0; i < 5; i++) {
    for (const mode of i % 2 ? ['range', 'baseline'] : ['baseline', 'range']) {
      const result = await timedQuery(store, filters, mode);
      samples[mode].push(result.durationMs);
      if (mode === 'baseline') baseline = result.rows;
      else range = result.rows;
    }
  }
  const sameResults = baseline.length === range.length && baseline.every((row, i) =>
    row.courseOfferingId === range[i].courseOfferingId && row.responseCount === range[i].responseCount &&
    row.ratingTotal === range[i].ratingTotal && Math.abs(row.averageRating - range[i].averageRating) < 0.000001);
  const median = (values) => [...values].sort((a, b) => a - b)[2];
  return { sameResults, baselineMs: median(samples.baseline), rangeMs: median(samples.range), samples: 5 };
}
