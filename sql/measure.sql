-- Run in your disposable EvaluationDemo database. Enable Actual Execution Plan.
-- Both procedures use the same table/index; this isolates the predicate change.
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
EXEC dbo.GetEvaluationSummaryBaseline @InstitutionId = 1, @Year = 2025;
EXEC dbo.GetEvaluationSummary @InstitutionId = 1, @StartDate = '20250101', @EndDate = '20260101';
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
-- Compare results, rows read, logical reads, CPU, elapsed time, and plans.
-- Repeat for multiple institutions and years; do not clear production caches.
