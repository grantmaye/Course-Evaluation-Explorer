# The story behind Evaluation Explorer

## A reporting problem worth making visible

A report can be easy to read and still be wrong. A rating summary can accidentally weight tiny and large courses equally. A date filter can omit the last milliseconds of a year or include the next year's responses. An optimization can run faster while changing the answer. Evaluation Explorer makes those concerns visible in a small React, Node, and SQL application.

The README describes an independent, AI-assisted learning project inspired by course-evaluation reporting. That is the supported origin story. There is no claim here of a particular institution commissioning it, a former employer's implementation, actual student data, revenue, or a measured historical performance gain. The [fixture generator](../server/data.js) creates all 60,000 responses and the three named institutions are fictional.

## A hypothetical user and workflow

Imagine an analyst at the fictional Northstar College preparing a course-feedback discussion. Before a focused reporting tool, they might export responses, filter a spreadsheet by year, create several summaries, and send a static table with little explanation of its calculation. A developer asked to accelerate that report might compare timings without first checking equality.

In this application the analyst chooses the institution and submission year, runs the report, and sees response counts, weighted overall mean, and course-level ratings. A changed control does not silently relabel old data: the screen asks them to run the report to apply it. If the period has no feedback, it displays an empty state instead of pretending the rating is zero.

The analyst and developer can then open Query lab together. They inspect the date-range predicate and covering index, compare the function-based filter with the range, and check results before discussing timings. A mismatch in any measured run prevents a matching final pair from giving false reassurance. This is a hypothetical collaboration, not a documented customer outcome.

## Who benefits?

**SQL learners** get a real example of typed parameters, grouping, fractional averages, half-open date intervals, and indexes. **Full-stack developers** can follow one request through React, HTTP validation, interchangeable adapters, and presentation logic. **Reviewers/interviewers** can run precise failure cases and ask why a measurement means what it claims. **Academic reporting teams exploring requirements** can use it as a conversation starter, while recognizing that privacy, authorization, enrollment, and actual survey models remain outside the demo.

The practical value is a reproducible explanation of correctness and performance tradeoffs. It does not prescribe judgments about teachers or students, and it has no institutional benchmark behind it.

## Before and after

| Concern | Hypothetical ad hoc process | Demonstrated behavior |
| --- | --- | --- |
| Filter scope | Repeated manual spreadsheet filters | Validated institution/year request |
| Overall rating | Risk of averaging course means | Sum of all rating points divided by all responses |
| Time boundaries | End-of-year precision guesses | Inclusive start, exclusive next-year start |
| Missing data | Blank or misleading zero | Explicit empty report and null mean |
| Optimization | Compare isolated stopwatch values | Warmups, alternating runs, medians, result equality |
| Portability | Need a database server immediately | Labeled in-memory SQLite preview |
| SQL credibility | Show query text without executing it | Separate SQL Server adapter and integration job |

The [report calculations](../server/report.js) and [stored procedures](../sql/report.sql) are the evidence behind this workflow. The SQLite label is part of the teaching: a portable preview must not masquerade as SQL Server performance evidence.

## A 60–90 second demonstration

“Evaluation Explorer is a fictional course-reporting workspace. It starts with a simple question: for one institution and year, how many responses did each course receive, and what was the overall rating?

Here is Northstar College in 2025. The overall mean is weighted across responses, not an average of course averages. I can change institution and run the report; the server validates those filters before querying.

Now I open Query lab. The baseline applies a year function to the timestamp. The alternative uses an inclusive start and exclusive end, which gives the index a direct date range. Both use the same index.

Compare queries warms each variant, alternates five measured runs, and reports medians. More importantly, every measured result must agree on counts, sums, and averages. A faster wrong result is not an optimization.

This instance says SQLite preview. It is convenient for local exploration; SQL Server has a separate adapter, stored procedures, and integration tests. These timings are not a production benchmark.

Finally, 2027 shows the empty state. The application explains uncertainty and absence as carefully as it shows numbers.”

## Limits that shape the next version

This is a local, read-only demo with no student records or authentication. Selecting an institution filters data; it does not authorize access. There is no enrollment denominator or response uniqueness model, so completion rates would be invented. Courses without responses do not appear. The synchronous SQLite preview is intentionally small; it is not a scaling architecture.

A next version for real institutional use would begin with privacy and authorization requirements, a course/section/term/enrollment schema, and reporting definitions agreed with users. SQL performance work would use real workload plans and reads, while preserving result correctness. The [technical manual](technical-manual.md) provides labs and extension exercises for discussing those changes without claiming they already exist.
