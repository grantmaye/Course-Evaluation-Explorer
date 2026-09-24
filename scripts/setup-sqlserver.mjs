import sql from 'mssql';
import { readFile } from 'node:fs/promises';
import { sqlConfig } from '../server/mssql.js';
import { makeResponses } from '../server/data.js';

const database = process.env.SQL_DATABASE || 'EvaluationDemo';
if (!/^EvaluationDemo(?:_[A-Za-z0-9]+)?$/.test(database)) throw new Error('Setup is limited to disposable EvaluationDemo databases.');
let admin;
for (let attempt = 0; attempt < 30; attempt++) {
  try { admin = await new sql.ConnectionPool(sqlConfig('master')).connect(); break; }
  catch (error) { if (attempt === 29) throw error; await new Promise((resolve) => setTimeout(resolve, 2000)); }
}
try {
  // Database name is restricted above; values in report queries use typed parameters.
  await admin.request().query(`IF DB_ID('${database}') IS NULL CREATE DATABASE [${database}]`);
} finally { await admin.close(); }
const pool = await new sql.ConnectionPool(sqlConfig()).connect();
try {
  for (const file of ['schema.sql', 'report.sql']) {
    const script = await readFile(new URL(`../sql/${file}`, import.meta.url), 'utf8');
    for (const batch of script.split(/^GO\s*$/m).filter((part) => part.trim())) await pool.request().batch(batch);
  }
  const count = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.EvaluationResponses');
  if (count.recordset[0].total === 0) {
    const table = new sql.Table('dbo.EvaluationResponses');
    table.create = false;
    table.columns.add('ResponseId', sql.Int, { nullable: false });
    table.columns.add('InstitutionId', sql.Int, { nullable: false });
    table.columns.add('CourseOfferingId', sql.Int, { nullable: false });
    table.columns.add('SubmittedAt', sql.DateTime2(3), { nullable: false });
    table.columns.add('Rating', sql.TinyInt, { nullable: false });
    for (const row of makeResponses()) table.rows.add(row.responseId, row.institutionId, row.courseOfferingId, new Date(row.submittedAt), row.rating);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try { await new sql.Request(transaction).bulk(table); await transaction.commit(); }
    catch (error) { await transaction.rollback(); throw error; }
    console.log('Seeded 60,000 fictional evaluations.');
  }
  console.log('SQL Server schema and stored procedures are ready.');
} finally { await pool.close(); }
