# Five minutes: SQL reporting with a React front end

## Open with the business problem

“This is a small learning project that models a course-evaluation report. An administrator needs the number of submitted evaluations and the average rating for a college and year. It has a React interface, a Node.js API, and a SQL Server implementation. For an easy local demonstration, it also has a labeled SQLite preview.”

Use `npm run demo`, then open http://localhost:4100. The screen identifies which engine is actually running.

## 1. Show the report

“Each row is a course offering. The overall average is weighted by individual responses, so a class with ten responses doesn't have the same weight as one with a thousand. This is an average rating, not a response rate; a rate would require an eligible-student denominator.”

Choose another college and run the report. Explain that results remain labeled with the applied filters until the new request finishes. The UI handles loading, failures, empty results, and stale requests.

## 2. Follow the request

Open `server/app.js`, then `server/report.js`.

“The API validates the institution and year before querying. The year becomes an inclusive start and exclusive end timestamp. The database, rather than the browser, filters and aggregates the responses.”

Open `server/mssql.js`.

“The SQL Server adapter reuses a connection pool. It binds input values using explicit SQL types and executes a named stored procedure. It doesn't construct SQL by concatenating user values.”

## 3. Explain the SQL

Open `sql/report.sql`.

“The baseline applies YEAR to the submission column. The alternative compares the column directly with date boundaries. That gives an index on institution and date a useful search range. GROUP BY produces one result per course, COUNT_BIG counts responses, and converting the rating to decimal preserves fractional averages.”

Open `sql/schema.sql`.

“The index first organizes data by institution, then date. Course and rating are included so the query can be covered without making them search keys. I'd check existing indexes and actual workload before creating it in a production database.”

## 4. Verify, don't promise

Open Query lab and compare.

“Both variants use the same index. They run once to warm up, then five measured times in alternating order. The screen shows medians and checks that counts, totals and averages agree. These timings describe this running engine and sample dataset. For SQL Server diagnosis I'd additionally inspect the actual plan, logical reads, CPU, blocking, and representative parameters.”

The UI displays a representative reporting SELECT without the extra ratingTotal and ordering fields used by the API. `sql/report.sql` is the complete authoritative SQL Server implementation.

## 5. Close on tradeoffs

“Indexes consume storage and add write work. Stored procedures are useful for a clear database interface, but aren't automatically faster. Before releasing a real fix, I'd verify result correctness, measure with realistic data, and check concurrent submission performance.”

Select 2027 to demonstrate an empty result. Do not quote a performance improvement from a previous employer based on this project. It is a current AI-assisted recreation for learning; explain the parts you have actually reviewed and understood.
