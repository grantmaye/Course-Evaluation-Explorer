import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqliteStore } from '../server/sqlite.js';
import { parseFilters, present, compareQueries } from '../server/report.js';
import { createApp } from '../server/app.js';

const fixture = [
  [1, 1, 101, '2025-01-01T00:00:00.000Z', 4],
  [2, 1, 101, '2025-12-31T23:59:59.999Z', 5],
  [3, 1, 101, '2026-01-01T00:00:00.000Z', 1],
  [4, 2, 101, '2025-06-01T00:00:00.000Z', 1],
  [5, 1, 102, '2025-06-01T00:00:00.000Z', 3],
  [6, 1, 101, '2024-12-31T23:59:59.999Z', 2],
].map(([responseId, institutionId, courseOfferingId, submittedAt, rating]) => ({ responseId, institutionId, courseOfferingId, submittedAt, rating }));
const filters = parseFilters(new URLSearchParams('institutionId=1&year=2025'));

test('range includes start, excludes end, isolates colleges, and preserves fractional averages', () => {
  const store = createSqliteStore(fixture);
  try {
    assert.deepEqual(store.query(filters), [
      { courseOfferingId: 101, responseCount: 2, ratingTotal: 9, averageRating: 4.5 },
      { courseOfferingId: 102, responseCount: 1, ratingTotal: 3, averageRating: 3 },
    ]);
    assert.deepEqual(present(store.query(filters)).summary, { responseCount: 3, courseCount: 2, averageRating: 4 });
  } finally { store.close(); }
});
test('both predicates return the same results and produce measured nonnegative durations', async () => {
  const store = createSqliteStore(fixture);
  try {
    const comparison = await compareQueries(store, filters);
    assert.equal(comparison.sameResults, true);
    assert.equal(comparison.samples, 5);
    assert.ok(comparison.baselineMs >= 0 && comparison.rangeMs >= 0);
  } finally { store.close(); }
});
test('empty report has zero counts and a null average', () => {
  const store = createSqliteStore(fixture);
  try { assert.deepEqual(present(store.query({ ...filters, startDate: '2027-01-01', endDate: '2028-01-01' })).summary,
    { responseCount: 0, courseCount: 0, averageRating: null }); }
  finally { store.close(); }
});
test('validation rejects unknown colleges, injected SQL, and malformed years', () => {
  for (const input of ['institutionId=4', 'institutionId=1%20OR%201%3D1', 'year=2025junk', 'year=NaN', 'year=2100', 'year=']) {
    assert.throws(() => parseFilters(new URLSearchParams(input)));
  }
});
test('HTTP API returns correct aggregates and fails safely on invalid requests', async (t) => {
  const store = createSqliteStore(fixture);
  const app = createApp(store);
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise((resolve) => app.close(resolve)); store.close(); });
  const base = `http://127.0.0.1:${app.address().port}`;
  const good = await fetch(`${base}/api/report?institutionId=1&year=2025`);
  assert.equal(good.status, 200);
  assert.equal((await good.json()).summary.averageRating, 4);
  assert.equal((await fetch(`${base}/api/report?institutionId=9`)).status, 400);
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  assert.equal((await fetch(`${base}/api/report`, { method: 'POST' })).status, 405);
  const comparison = await (await fetch(`${base}/api/compare?institutionId=1&year=2025`)).json();
  assert.equal(comparison.sameResults, true);
});
