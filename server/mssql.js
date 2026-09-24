import sql from 'mssql';

export function sqlConfig(database = process.env.SQL_DATABASE || 'EvaluationDemo') {
  if (!process.env.SQL_PASSWORD) throw new Error('SQL_PASSWORD is required for SQL Server mode.');
  return {
    server: process.env.SQL_HOST || 'localhost',
    port: Number(process.env.SQL_PORT || 1433),
    user: process.env.SQL_USER || 'sa', password: process.env.SQL_PASSWORD, database,
    connectionTimeout: 5000, requestTimeout: 15000,
    pool: { max: 4, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: process.env.SQL_ENCRYPT !== 'false', trustServerCertificate: process.env.SQL_TRUST_CERTIFICATE === 'true' },
  };
}

export async function createMssqlStore() {
  const pool = await new sql.ConnectionPool(sqlConfig()).connect();
  pool.on('error', (error) => console.error('Database pool error:', error.message));
  const count = await pool.request().query('SELECT COUNT_BIG(*) AS total FROM dbo.EvaluationResponses');
  return {
    engine: 'SQL Server', totalResponses: Number(count.recordset[0].total),
    async query(filters, mode = 'range') {
      // Values are bound with explicit SQL types; no user input becomes SQL text.
      const request = pool.request().input('InstitutionId', sql.Int, filters.institutionId);
      const result = mode === 'baseline'
        ? await request.input('Year', sql.Int, filters.year).execute('dbo.GetEvaluationSummaryBaseline')
        : await request.input('StartDate', sql.DateTime2, new Date(filters.startDate))
          .input('EndDate', sql.DateTime2, new Date(filters.endDate)).execute('dbo.GetEvaluationSummary');
      return result.recordset.map((row) => ({ courseOfferingId: Number(row.courseOfferingId),
        responseCount: Number(row.responseCount), ratingTotal: Number(row.ratingTotal), averageRating: Number(row.averageRating) }));
    },
    async close() { await pool.close(); },
  };
}
