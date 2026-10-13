# Website split validation — 2026-10-13

This website is independent of the active ProudAuth checkout. Source publication
and Pages deployment are authorized separately from the identity service. This
website work does not modify original service files, databases, containers or
persisted realm issuers. DNS and repository Pages settings belong to the operator.

## Source and publication inputs

- 218 imported inputs are recorded with exact SHA-256 values and source-byte
  provenance in `content.lock.json`.
- Service provenance remains a prepared workspace based on original HEAD
  `5ff6ddb852b572a05d4b1b5e6afdf2ecc1350a11`, with `dirty:true` and
  `commitPinned:false` until a published service commit is selected explicitly.
  All five SDK READMEs are byte-for-byte imports of their exact public commits;
  per-file upstream objects and `sdkSources` record those pins.
- Only selected technical guides, API contracts/schemas, SDK READMEs and already
  publicly selected benchmark artifacts were imported. Private plan/matrix files,
  `.state/`, database dumps, deployment secrets, image archives and seeds were
  excluded. Absolute user/temporary paths are redacted; original and redacted
  hashes are separately recorded.
- Vendored marked/js-yaml licenses and cached Swagger UI 5.33.2 license/notices
  are retained. No package, image or other dependency was downloaded.

## Checks performed

`npm run check` passes on local Node.js **25.9.0**: 11 tests, zero failures.
The same command passes from an isolated temporary copy with no original service
checkout or Docker dependency. The temporary copy is removed.

The generated website contains **104 guides**, **603 API operations**, **146
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
- Pages artifact root, `.nojekyll`, `CNAME`, root 404, static-only publication,
  example-owned API origins, release Compose guide and all 19 environment settings.

A direct scan of **528 source/generated files** found no actual values of the two
private deployment credentials, personal filesystem paths, private-key blocks,
database dumps, image archives or `.state/` files. No credential values were
printed. `docker compose -f deploy/compose.yaml config --quiet` passes.

`dist/` is ignored and regenerated for Pages artifact publication. No installed
modules, source checkout caches or identity secrets are required by the build.

## Publication model and remaining checks

The pinned Pages workflow uploads only the verified static `dist/` artifact.
Its deploy job uses the `github-pages` environment and the required narrowly
scoped Pages/OIDC permissions. The project domain serves landing/docs only;
identity examples use `https://identity.example.com` for an operator's instance.
No project API/status backend, database, hosted login or identity issuer is
published by this workflow. The optional status utility remains separate.

Confirm the current Actions deployment and HTTPS custom-domain certificate after
publication, then visually review desktop/mobile on the public website. Replace
the service workspace provenance with its exact published commit after the
release source is available; SDK pins already match public commits.
The optional container preview still requires a maintained pinned Nginx digest
before any website image publication; GitHub Pages does not use that image.
