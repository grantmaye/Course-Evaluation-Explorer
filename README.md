# Evaluation Explorer

[![Verify](https://github.com/grantmaye/Course-Evaluation-Explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/grantmaye/Course-Evaluation-Explorer/actions/workflows/ci.yml)

A small **React + Node.js + SQL Server** reporting application. Explore fictional course evaluations, inspect the reporting query, and compare a function-based date filter with an equivalent date range.

This is an independent, AI-assisted learning project inspired by course-evaluation reporting. It contains no employer code, student records, or historical performance claims.

## Run on your computer

Use **Node.js 24.15 or newer**.

```bash
git clone https://github.com/grantmaye/Course-Evaluation-Explorer.git
cd Course-Evaluation-Explorer
npm ci
npm run demo
```

Open **http://localhost:4100**. No account, Docker, or database installation is needed for the default preview. Stop with Ctrl+C. Once built, `npm start` starts it again. For editing with hot reload, run `npm run dev` and open http://localhost:5173.

**The portable preview runs SQLite, not SQL Server.** The UI labels the active engine. It loads 60,000 deterministic fictional responses in memory each time the server starts. SQLite does not run T-SQL stored procedures, and its timings do not establish SQL Server performance. The SQL Server adapter is a separate real implementation, exercised by the SQL Server CI job.

## Five-minute demo

1. Open Northstar College, 2025. Explain the response count, weighted average rating, and course table.
2. Change the college and run the report. Point out that the backend validates inputs and filters by institution.
3. Open **Query lab**. Explain `YEAR(SubmittedAt)` versus a direct date range.
4. Explain the index: institution and date are search keys; course and rating are included columns.
5. Click **Compare queries**. Both variants should return identical counts, sums, and averages. Timings are measured, not manufactured. The range is not guaranteed to win every run.
6. Select 2027 to show the empty state. Open **Walkthrough** to follow the code path.

See [the interview walkthrough](docs/INTERVIEW-WALKTHROUGH.md).

## Connect to SQL Server

Use a disposable SQL Server 2022+ instance or compatible Azure SQL development database. On Apple Silicon, the portable preview is the easiest local route; use a supported external SQL Server instance for T-SQL execution. Microsoft documents SQL Server Linux containers for x86-64, not an ARM-native Mac database installation.

Copy `.env.example` to `.env`, select `DB_DRIVER=mssql`, and provide the server, database, user, and password. Certificate verification stays enabled by default. Set `SQL_TRUST_CERTIFICATE=true` only for a local development server using a self-signed certificate.

```bash
npm run db:setup
npm run test:sqlserver
npm run demo
```

Setup creates the named database if permitted, installs the schema, index and procedures, and seeds it only if the table is empty. It is deliberately restricted to names beginning with `EvaluationDemo` (optionally followed by an underscore and alphanumeric suffix). It does not drop existing data. The setup identity needs database/schema creation permissions; the runtime could use a separate identity granted EXECUTE on the two procedures and SELECT for the row-count metadata query.

To inspect SQL Server execution plans, logical reads, CPU and elapsed time, run `sql/measure.sql` in that database with an actual execution plan enabled. The app's timings include the database call and result transfer; they are not server CPU or logical-read metrics.

## Code map

| File | Responsibility |
| --- | --- |
| `src/App.jsx` | React filters, loading/error/empty states, report, query lab |
| `server/app.js` | Read-only HTTP API and built frontend |
| `server/report.js` | Input validation, weighted summaries, query comparison |
| `server/mssql.js` | Connection pool and typed stored-procedure parameters |
| `sql/report.sql` | Baseline and range-based T-SQL stored procedures |
| `sql/schema.sql` | Table constraints and covering index |
| `server/sqlite.js` | Explicitly labeled portable preview adapter |
| `server/data.js` | Repeatable fictional fixtures |

Data flow: **React → GET /api/report → validation → database adapter → aggregate rows → React table**.

`GET /api/meta` returns fictional institutions and engine metadata. `GET /api/report?institutionId=1&year=2025` returns a report. `GET /api/compare?institutionId=1&year=2025` executes both predicates with one warm-up each and five alternating measured runs, returning median query-call durations and a result equality check. Both variants use the same index; this is not a before/after index benchmark.

## Verification

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
# Requires the seeded SQL Server development database:
npm run test:sqlserver
```

Tests cover institution isolation, inclusive/exclusive timestamp boundaries, fractional and weighted averages, empty data, invalid inputs, HTTP behavior, browser filters/comparison/retry, and real SQL Server procedures against an independent expected-result calculation. CI runs the SQL Server tests in a Linux SQL Server 2022 container. Check the workflow result for the current commit; configuration alone is not proof of a passing run.

## Deliberate limits

The application binds to localhost and is a read-only local learning demo. There is no authentication or user authorization; the institution selector is not an authorization boundary. Do not expose it as a public multi-tenant service without adding those controls. It has no real student information, completion-rate denominator, survey-question model, or submission workflow. Courses without responses are absent from the aggregate. The default synchronous SQLite adapter blocks the Node event loop and is intended for this small local dataset. SQL Server uses asynchronous pooled requests.

Course IDs identify fictional reusable offerings in this simplified dataset. A production academic model would define institution, course, section, term, enrollment, submission uniqueness, access control and privacy rules explicitly. An index improves some reads while costing storage and writes; investigate actual plans and workload before adding one.

## References

- [Microsoft: index design](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-index-design-guide)
- [Microsoft: AVG return types](https://learn.microsoft.com/en-us/sql/t-sql/functions/avg-transact-sql)
- [Microsoft: SQL Server container requirements](https://learn.microsoft.com/en-us/sql/linux/install-upgrade/quickstart-install-docker)
- [node-mssql: SQL Server driver](https://github.com/tediousjs/node-mssql)
- [Node.js SQLite](https://nodejs.org/api/sqlite.html)
- [Vite](https://vite.dev/guide/)
