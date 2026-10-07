# Security scope and dependency note

This is a loopback-only, read-only learning demo with fictional responses. There is no authentication or institution-level authorization. Do not use it for real student records or publish it as a public reporting service without designing those controls. Keep database credentials in ignored environment files; never include them in public issues.

## Known dependency limitation (2026-10-07)

`npm audit` reports three moderate entries along `mssql -> tedious -> sprintf-js`, all rooted in [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). The advisory concerns attacker-controlled format-string precision and lists no patched sprintf-js release. Inspection of the installed tedious call sites found fixed format strings; the application itself does not call sprintf and binds report values as typed parameters. This is a limited exposure assessment, not an assertion that the dependency is patched.

The compatible source-map-js update removes the separate high-severity build advisory. Do not apply npm's forced mssql 4.2.0 downgrade: it changes the SQL driver contract outside the project's compatible patch scope. Recheck the upstream chain and run both application and SQL Server integration tests when a supported fix becomes available.
