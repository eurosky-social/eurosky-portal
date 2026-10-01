---
'eurosky-portal': patch
---

Use `@adonisjs/otel`

This makes things vendor-neutral with OpenTelemetry, off by default.
Set `OTEL_ENABLED=true` and `OTEL_EXPORTER_OTLP_*` environment variables to
send telemetry.
Removes `MONOCLE_API_KEY`.
