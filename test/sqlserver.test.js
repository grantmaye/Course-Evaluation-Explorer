import test from 'node:test';
import assert from 'node:assert/strict';
import sql from 'mssql';
import { createMssqlStore, sqlConfig } from '../server/mssql.js';
import { makeResponses } from '../server/data.js';
import { parseFilters, compareQueries } from '../server/report.js';

test('SQL Server stored procedures agree with an independent fixture aggregation', async () => {
  const store = await createMssqlStore();
  const fixtures = makeResponses();
  try {
    assert.equal(store.totalResponses, 60000);
    for (const institutionId of [1, 2, 3]) {
      for (const year of [2023, 2025, 2026, 2027]) {
        const filters = parseFilters(new URLSearchParams({ institutionId, year }));
        const expected = new Map();
        for (const row of fixtures) if (row.institutionId === institutionId && row.submittedAt >= filters.startDate && row.submittedAt < filters.endDate) {
          const totals = expected.get(row.courseOfferingId) || { count: 0, sum: 0 };
          totals.count++; totals.sum += row.rating; expected.set(row.courseOfferingId, totals);
        }
        const rows = await store.query(filters);
        assert.equal(rows.length, expected.size);
        for (const row of rows) {
          const totals = expected.get(row.courseOfferingId);
          assert.equal(row.responseCount, totals.count);
          assert.equal(row.ratingTotal, totals.sum);
          assert.ok(Math.abs(row.averageRating - totals.sum / totals.count) < 0.000001);
        }
        assert.equal((await compareQueries(store, filters)).sameResults, true);
      }
    }
  } finally { await store.close(); }
});

test('SQL Server enforces boundaries, tenant filtering, decimal means, and procedure validation', async () => {
  const pool = await new sql.ConnectionPool(sqlConfig()).connect();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx).query(`INSERT INTO dbo.EvaluationResponses VALUES
      (900001,1,999,'20900101',4), (900002,1,999,'20901231 23:59:59.999',5),
      (900003,1,999,'20910101',1), (900004,2,999,'20900601',1);`);
    const result = await new sql.Request(tx).input('InstitutionId', sql.Int, 1)
      .input('StartDate', sql.DateTime2, new Date('2090-01-01T00:00:00Z'))
      .input('EndDate', sql.DateTime2, new Date('2091-01-01T00:00:00Z')).execute('dbo.GetEvaluationSummary');
    assert.equal(Number(result.recordset[0].responseCount), 2);
    assert.equal(result.recordset[0].averageRating, 4.5);
  } finally { await tx.rollback(); }
  try {
    await assert.rejects(pool.request().input('InstitutionId', sql.Int, 1)
      .input('StartDate', sql.DateTime2, new Date('2026-01-01T00:00:00Z'))
      .input('EndDate', sql.DateTime2, new Date('2025-01-01T00:00:00Z')).execute('dbo.GetEvaluationSummary'), /valid institution and date range/);
  } finally { await pool.close(); }
});
