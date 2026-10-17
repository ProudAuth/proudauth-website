# Changelog

All notable changes to the ProudAuth website will be recorded here. This
changelog describes the website; imported service release notes remain owned by
ProudAuth and keep their original source provenance.

## Unreleased

### Fixed

- Docs search indexes table cells and list items, so environment variables and
  configuration keys such as `PROUDAUTH_TRUSTED_PROXIES` find the page that
  documents them; results are also ranked by how often the terms occur in a page.
- The checks no longer pin fixed counts of guides, API operations, pages and
  downloads: they compare the build with the synced `content.lock.json` and
  OpenAPI contract, so a release that adds an endpoint or a guide deploys
  without a test edit.

### Changed

- The landing page is one screen of graphics: your server at the centre with
  web, mobile, API and services around it, four illustrated pillars (on your
  server, private, free and open source, scales with you) and a single
  "Start now" button to the Docker quickstart. No navigation links, no
  external fonts or scripts; its own `assets/home.css`, with reduced-motion
  support.

### Added

- Deployment follows the latest ProudAuth release automatically: an hourly
  check (or a dispatch from the ProudAuth release workflow) syncs the docs
  from the newest release tag, then builds, checks and deploys.

### Changed

- The version shown anywhere on the site comes from the synced release tag
  (`content.lock.json` `source.release`); `site.config.json` no longer holds one.
- The Docker quickstart is ProudAuth's own install guide at the release tag;
  `/docs/operations/docker-compose/` redirects to it.

- Documentation snapshot pinned to service `main` commit `9fdc0c7` (v0.2.0-alpha.2):
  the two-file Compose installer (`docker-compose.yaml` + `.env`), environment
  reference, trimmed OpenAPI header and the new API conventions page.
- The Docker quickstart is four steps: download `docker-compose.yaml` and `.env`,
  fill in `.env`, `docker compose pull` and `up -d`, create the first
  administrator; no source checkout, image build, `init.sh` or Python. The landing
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
