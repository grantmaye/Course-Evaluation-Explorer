import { useEffect, useRef, useState } from 'react';

const number = (value) => new Intl.NumberFormat('en-US').format(value);
const sqlQuery = `SELECT CourseOfferingId,
  COUNT_BIG(*) AS ResponseCount,
  AVG(CAST(Rating AS decimal(10,2)))
    AS AverageRating
FROM dbo.EvaluationResponses
WHERE InstitutionId = @InstitutionId
  AND SubmittedAt >= @StartDate
  AND SubmittedAt < @EndDate
GROUP BY CourseOfferingId;`;
const indexQuery = `CREATE NONCLUSTERED INDEX
  IX_Responses_Institution_Date
ON dbo.EvaluationResponses
  (InstitutionId, SubmittedAt)
INCLUDE (CourseOfferingId, Rating);`;

async function fetchJson(path, signal) {
  const response = await fetch(path, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request failed.');
  return data;
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({ institutionId: '1', year: '2025' });
  const [tab, setTab] = useState('report');
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');
  const active = useRef(null);
  const compareActive = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    Promise.all([fetchJson('/api/meta', controller.signal), fetchJson('/api/report', controller.signal)])
      .then(([metadata, result]) => { setMeta(metadata); setReport(result); })
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); active.current?.abort(); compareActive.current?.abort(); };
  }, []);

  async function loadReport(event) {
    event.preventDefault();
    active.current?.abort(); compareActive.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setLoading(true); setError(''); setComparison(null); setComparing(false);
    try {
      const [metadata, result] = await Promise.all([
        meta ? Promise.resolve(meta) : fetchJson('/api/meta', controller.signal),
        fetchJson(`/api/report?${new URLSearchParams(filters)}`, controller.signal),
      ]);
      setMeta(metadata); setReport(result);
    } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }

  async function compare() {
    const controller = new AbortController(); compareActive.current = controller;
    setComparing(true); setError('');
    try {
      const result = await fetchJson(`/api/compare?${new URLSearchParams({ institutionId: report.filters.institutionId, year: report.filters.year })}`, controller.signal);
      setComparison(result);
    } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
    finally { if (!controller.signal.aborted) setComparing(false); }
  }

  const institution = meta?.institutions.find((item) => item.id === report?.filters.institutionId);
  const changed = report && (Number(filters.institutionId) !== report.filters.institutionId || Number(filters.year) !== report.filters.year);
  const tabs = [['report', '01', 'Evaluation report'], ['query', '02', 'Query lab'], ['guide', '03', 'Walkthrough']];

  return <div className="app-shell">
    <aside className="sidebar">
      <a href="/" className="brand"><span className="brand-icon">e</span><span>evaluation<br/><b>explorer.</b></span></a>
      <p className="nav-label">THE REPORTING WORKSPACE</p>
      <nav aria-label="Workspace">{tabs.map(([id, count, title]) => <button key={id} className={tab === id ? 'nav-item active' : 'nav-item'} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><span>{count}</span>{title}<span className="nav-arrow">↗</span></button>)}</nav>
      <div className="sidebar-note"><span className="small-label">BUILT TO BE EXPLAINED</span><p>One report.<br/>Every layer visible.</p><div className="stack">React <span>→</span> Node.js <span>→</span> SQL</div></div>
      <div className="sidebar-footer">Independent learning project<br/>Fictional institutions & evaluations</div>
    </aside>
    <main>
      <header className="topbar"><span>Academic insights <span className="slash">/</span> Reporting</span><span className="engine"><i/>{meta?.engine || 'Connecting…'}</span></header>
      <div className="content">
        <div className="page-heading"><div><p className="eyebrow">EVALUATION EXPLORER</p><h1>{tab === 'report' ? 'A clearer view of feedback.' : tab === 'query' ? 'Same answers. Less work?' : 'Follow the data.'}</h1><p className="intro">{tab === 'report' ? 'Explore course evaluations, then see the query behind the numbers.' : tab === 'query' ? 'Compare two date filters. Measure the difference. Keep the results correct.' : 'A five-minute tour from a React filter to a database result.'}</p></div><span className="project-tag">PORTFOLIO DEMO</span></div>
        <form className="filters" onSubmit={loadReport}>
          <label>Institution<select aria-label="Institution" value={filters.institutionId} onChange={(e) => setFilters({ ...filters, institutionId: e.target.value })}>{(meta?.institutions || [{ id: 1, name: 'Northstar College' }]).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Submission year<select aria-label="Submission year" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>{[2023, 2024, 2025, 2026, 2027].map((year) => <option key={year}>{year}</option>)}</select></label>
          <button className="primary" disabled={loading}>{loading ? 'Loading report…' : 'Run report'} <span aria-hidden="true">↗</span></button>
          <p className="filter-note">{changed ? 'Filters changed. Run the report to apply.' : 'One overall rating per submitted evaluation.'}</p>
        </form>
        {error && <div className="error" role="alert">{error} Use Run report to retry.</div>}
        <div role="status" className="sr-only">{loading ? 'Loading report' : report ? `Report loaded for ${institution?.name}, ${report.filters.year}` : ''}</div>
        {report && <div className={loading ? 'report-area loading' : 'report-area'} aria-busy={loading}>
          <div className="report-context"><strong>{institution?.name} <span>· {report.filters.year}</span></strong><span>{number(meta?.totalResponses || 0)} fictional responses in the full dataset</span></div>
          {tab === 'report' && <>
            <section className="metrics" aria-label="Report summary"><Metric title="Submitted evaluations" value={number(report.summary.responseCount)} note="Within the selected college and year"/><Metric title="Average overall rating" value={report.summary.averageRating?.toFixed(2) || '—'} suffix="/ 5" note="Weighted across individual responses"/><Metric title="Course offerings" value={report.summary.courseCount} note="With at least one response"/></section>
            <div className="report-grid"><section className="panel"><div className="panel-heading"><div><span className="small-label">THE RESULTS</span><h2>Feedback by course</h2></div><span className="soft-tag">{report.rows.length} offerings</span></div>
              {report.rows.length ? <div className="table-wrap"><table><thead><tr><th scope="col">Course offering</th><th scope="col">Responses</th><th scope="col">Average rating</th></tr></thead><tbody>{report.rows.map((row) => <tr key={row.courseOfferingId}><td><b>{row.name}</b><small>{row.code} · offering {row.courseOfferingId}</small></td><td>{number(row.responseCount)}</td><td><div className="rating"><span>{row.averageRating.toFixed(2)}</span><div className="rating-track" aria-hidden="true"><i style={{ width: `${row.averageRating * 20}%` }}/></div></div></td></tr>)}</tbody></table></div> : <div className="empty"><span>∅</span><h3>No evaluations in this period</h3><p>Try a year from 2023 through 2026. An empty report is a valid result.</p></div>}
              <div className="panel-foot">Query call: {report.durationMs.toFixed(3)} ms <span>Measured now · {report.engine}</span></div>
            </section><aside className="insight"><span className="small-label">BEHIND THE REPORT</span><h2>A small query.<br/>Useful decisions.</h2><p>Filter one institution, select a date range, and group the matching evaluations by course.</p><ol><li><b>Scope</b><span>Keep each institution’s data separate.</span></li><li><b>Aggregate</b><span>Count responses and preserve fractional ratings.</span></li><li><b>Verify</b><span>Measure query work without changing the answer.</span></li></ol><button className="text-button" onClick={() => setTab('query')}>Explore the SQL <span>↗</span></button></aside></div>
          </>}
          {tab === 'query' && <section className="query-lab"><div className="query-grid"><article className="panel code-panel"><span className="small-label">SQL SERVER · RANGE PREDICATE</span><h2>The reporting query</h2><pre><code>{sqlQuery}</code></pre></article><article className="panel code-panel"><span className="small-label">SQL SERVER · COVERING INDEX</span><h2>Give the query a useful path</h2><pre><code>{indexQuery}</code></pre><p>Institution first, then date. Included columns cover the report. Extra indexes also cost storage and write work.</p></article></div><article className="panel comparison"><div><span className="small-label">MEASURE, THEN DECIDE</span><h2>Function filter vs. date range</h2><p>The SQL Server baseline uses <code>YEAR(SubmittedAt)</code>; the preview uses <code>substr</code>. Both variants use the same index.</p></div><button className="primary" onClick={compare} disabled={comparing || loading}>{comparing ? 'Comparing…' : 'Compare queries'}</button>
            {comparison && <div className="comparison-results" role="status"><Metric title="Function filter" value={comparison.baselineMs.toFixed(3)} suffix="ms" note="Median query-call duration"/><Metric title="Date range" value={comparison.rangeMs.toFixed(3)} suffix="ms" note="Median query-call duration"/><div className={comparison.sameResults ? 'match' : 'error'}><b>{comparison.sameResults ? '✓ Results match' : 'Results differ'}</b><p>Counts, rating totals, and averages checked.</p></div></div>}
            <p className="measurement-note">{report.engine === 'SQLite preview' ? 'These timings come from SQLite, not SQL Server. ' : ''}One warm-up per variant, five measured runs, alternating order. Timing includes the database call and result transfer. This is an illustration, not a production benchmark. Inspect SQL Server plans and logical reads with sql/measure.sql.</p></article></section>}
          {tab === 'guide' && <section className="guide-grid">{[
            ['01', 'Start with the user', 'An administrator needs counts and ratings for a college and year. Change a filter and run the report.', 'src/App.jsx'],
            ['02', 'Follow the request', 'React calls GET /api/report. Node validates the institution and year before asking the data adapter for results.', 'server/app.js → server/report.js'],
            ['03', 'Explain the SQL', 'SQL Server receives typed parameters and executes a stored procedure. The date range supports an index search; the decimal cast preserves fractional averages.', 'server/mssql.js → sql/report.sql'],
            ['04', 'Prove the result', 'Compare both date filters in Query lab. Check counts and averages first, then inspect measurements and index tradeoffs.', 'server/report.js → sql/measure.sql'],
          ].map(([step, title, text, file]) => <article className="panel guide-step" key={step}><span>{step}</span><h2>{title}</h2><p>{text}</p><code>{file}</code></article>)}</section>}
        </div>}
        <footer className="page-footer"><span>React interface · Node.js API · Parameterized SQL</span><span>{meta?.engine === 'SQLite preview' ? 'Portable preview · SQL Server connection available' : 'Synthetic data only'}</span></footer>
      </div>
    </main>
  </div>;
}

function Metric({ title, value, suffix, note }) {
  return <article className="metric"><p>{title}</p><div>{value} {suffix && <span>{suffix}</span>}</div><small>{note}</small></article>;
}
