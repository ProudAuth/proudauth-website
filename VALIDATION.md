# Website split validation — 2026-10-13

This staging repository was prepared independently from the active ProudAuth
checkout. No original source files, running services, Cloudflare routes, DNS,
issuer records, Git repositories or GitHub settings were changed.

## Source and publication inputs

- 215 imported inputs are recorded with exact SHA-256 values and source-byte
  provenance in `content.lock.json`.
- The original HEAD is `5ff6ddb852b572a05d4b1b5e6afdf2ecc1350a11`, with
  `dirty:true`, `state:workspace-snapshot` and `commitPinned:false`. Per-file
  `matchesHead` flags distinguish unchanged files from uncommitted content.
- Only selected technical guides, API contracts/schemas, SDK READMEs and already
  publicly selected benchmark artifacts were imported. Private plan/matrix files,
  `.state/`, database dumps, deployment secrets, image archives and seeds were
  excluded. Absolute user/temporary paths are redacted; original and redacted
  hashes are separately recorded.
- Vendored marked/js-yaml licenses and cached Swagger UI 5.33.2 license/notices
  are retained. No package, image or other dependency was downloaded.

## Checks performed

`npm run check` passes on local Node.js **25.9.0**: 10 tests, zero failures.
The same command passes from an isolated temporary copy with no original service
checkout or Docker dependency. The temporary copy is removed.

The generated website contains **101 guides**, **603 API operations**, **143
documentation pages** and **108 allowed downloadable artifacts**, with landing
content at `/` and documentation at `/docs/`.

Checks cover:

- Every generated guide link/section anchor and every search destination.
- Exact OpenAPI operation coverage, API origin, license URL and schema references.
- Local `/docs/` assets, search index, Swagger assets, specification and downloads.
- Canonical guide URLs and local HTTP serving of the merged paths.
- `www` and legacy `docs` redirects preserving path/query; `/docs` normalization.
- Hidden-file refusal, mutation-method refusal and strict response headers.
- Imported file hashes and an isolated tamper test rejecting changed documentation.
- Operational/degraded status responses, fixed targets and private-body exclusion.

A direct scan of **528 source/generated files** found no actual values of the two
private deployment credentials, personal filesystem paths, private-key blocks,
database dumps, image archives or `.state/` files. No credential values were
printed. `docker compose -f deploy/compose.yaml config --quiet` passes.

The generated `dist/` output was removed after checks for source publication;
`npm run build` recreates it. No copied build caches or installed modules remain.

## Remaining publication and deployment gates

1. Complete source review and organization/repository publication. This directory
   itself does not claim that the intended public repository already exists.
2. Review service/SDK version statements once their split repositories and any
   package releases are published. Replace workspace provenance with exact clean
   upstream commits only after the imported bytes match them.
3. Verify CI on Node 24 and pin/validate a maintained multi-architecture Nginx
   image before publishing a website container. Dockerfiles are prepared; no new
   container image or multi-architecture release was built in this phase.
4. Perform visual desktop/mobile review of the merged-host deployment.
5. Separately validate the populated-state issuer transition, client settings and
   Cloudflare routes before activating `api.proudauth.com` and apex `/docs/`.

The current live hostnames and persisted issuer remain unchanged by this work.
