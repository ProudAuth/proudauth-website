# Changelog

All notable changes to the ProudAuth website will be recorded here. This
changelog describes the website; imported service release notes remain owned by
ProudAuth and keep their original source provenance.

## Unreleased

### Changed

- Documentation snapshot pinned to service commit `2228053` (proudbase/proudauth#9):
  the two-file Compose installer (`docker-compose.yaml` + `.env`), environment
  reference, trimmed OpenAPI header and the new API conventions page.
- The Docker quickstart is four steps: download, fill in `.env`, start, create
  the first administrator; no `init.sh`, Python or demo profile. The landing
  page, overview and capabilities point to `0.2.0-alpha.2`.

### Added

- Independent landing page and developer documentation build, with canonical
  documentation under `/docs/` and operator-owned identity examples.
- Reviewed service/API/SDK documentation snapshots with per-file SHA-256,
  redaction records and explicit dirty-workspace provenance.
- Offline Node build, loopback preview, standalone publication/redirect/status
  checks and CI with pinned GitHub Actions.
- Cached Swagger assets with license notices, source-independent container
  configuration and clear publication/deployment gates.
- Free GitHub Pages publication with pinned Actions, a custom domain, root 404,
  `.nojekyll`, local assets and verified static artifacts.
- Versioned alpha release downloads and source-free Docker Compose quickstart,
  with the complete 19-variable environment and secret-file reference.
- Exact published commit snapshots for all five SDK guides and an explicit
  offline import command with per-file upstream provenance.
- Commit-pinned service guides and the public cross-repository SDK evidence
  manifest as a downloadable artifact.

### Changed

- The project website describes a self-hosted product; identity, login and
  monitoring belong to each operator's instance.

### Fixed

- Preserve SCIM `/Users/{id}` protocol routes and Markdown code delimiters when
  redacting local filesystem provenance, with sanitizer and rendered-guide
  regression checks.
- Use the configured canonical origin in the quickstart and direct nondefault
  local ports to the released host CLI setup procedure.
