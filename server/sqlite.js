import { DatabaseSync } from 'node:sqlite';
import { makeResponses } from './data.js';

export function createSqliteStore(responses = makeResponses()) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE EvaluationResponses (
    ResponseId INTEGER PRIMARY KEY,
    InstitutionId INTEGER NOT NULL CHECK (InstitutionId BETWEEN 1 AND 3),
    CourseOfferingId INTEGER NOT NULL,
    SubmittedAt TEXT NOT NULL,
    Rating INTEGER NOT NULL CHECK (Rating BETWEEN 1 AND 5));`);
  const insert = db.prepare('INSERT INTO EvaluationResponses VALUES (?, ?, ?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const row of responses) insert.run(row.responseId, row.institutionId, row.courseOfferingId, row.submittedAt, row.rating);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
  db.exec('CREATE INDEX IX_Responses_Institution_Date ON EvaluationResponses (InstitutionId, SubmittedAt, CourseOfferingId, Rating)');
  const select = `SELECT CourseOfferingId AS courseOfferingId, COUNT(*) AS responseCount,
    SUM(Rating) AS ratingTotal, AVG(Rating * 1.0) AS averageRating FROM EvaluationResponses
    WHERE InstitutionId = ? AND `;
  const tail = ' GROUP BY CourseOfferingId ORDER BY CourseOfferingId';
  const baseline = db.prepare(select + 'substr(SubmittedAt, 1, 4) = ?' + tail);
  const range = db.prepare(select + 'SubmittedAt >= ? AND SubmittedAt < ?' + tail);
  return {
    engine: 'SQLite preview', totalResponses: responses.length,
    query(filters, mode = 'range') {
      const rows = mode === 'baseline'
        ? baseline.all(filters.institutionId, String(filters.year))
        : range.all(filters.institutionId, filters.startDate, filters.endDate);
      return rows.map((row) => ({ ...row }));
    },
    close() { db.close(); },
  };
}
