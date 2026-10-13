# Website split validation — 2026-10-13

This website is independent of the active ProudAuth checkout. Source publication
and Pages deployment are authorized separately from the identity service. This
website work does not modify original service files, databases, containers or
persisted realm issuers. DNS and repository Pages settings belong to the operator.

## Source and publication inputs

- 219 imported inputs are recorded with exact SHA-256 values and source-byte
  provenance in `content.lock.json`.
- Service inputs are read from the exact public Git commit recorded in the
  manifest, with `dirty:false` and `commitPinned:true`; initial workspace input
  hashes remain recorded. All five SDK READMEs are byte-for-byte imports of their
  exact public commits; per-file upstream objects and `sdkSources` record those
  pins. This includes PHP's tested `dev-main` VCS installation example and Go's
  canonical website links. The public SDK evidence JSON is also downloadable.
- Only selected technical guides, API contracts/schemas, SDK READMEs and already
  publicly selected benchmark artifacts were imported. Private plan/matrix files,
  `.state/`, database dumps, deployment secrets, image archives and seeds were
  excluded. Absolute user/temporary paths are redacted; original and redacted
  hashes are separately recorded.
- Vendored marked/js-yaml licenses and cached Swagger UI 5.33.2 license/notices
  are retained. No package, image or other dependency was downloaded.

## Checks performed

`npm run check` passes on local Node.js **25.9.0**: 12 tests, zero failures.
The same command passes from an isolated temporary copy with no original service
checkout or Docker dependency. The temporary copy is removed.

The generated website contains **104 guides**, **603 API operations**, **146
documentation pages** and **109 allowed downloadable artifacts**, with landing
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
- Preservation of SCIM `/Users/{id}` paths and Markdown delimiters during
  filesystem redaction, including the resulting rendered provisioning guides.

A direct scan of **548 source/generated files** found no actual values of the two
private deployment credentials, personal filesystem paths, private-key blocks,
database dumps, image archives or `.state/` files. No credential values were
printed. `docker compose -f deploy/compose.yaml config --quiet` passes.

`dist/` is ignored and regenerated for Pages artifact publication. No installed
modules, source checkout caches or identity secrets are required by the build.

## Publication model and hosted verification

The pinned Pages workflow uploads only the verified static `dist/` artifact.
Its deploy job uses the `github-pages` environment and the required narrowly
scoped Pages/OIDC permissions. The project domain serves landing/docs only;
identity examples use `https://identity.example.com` for an operator's instance.
No project API/status backend, database, hosted login or identity issuer is
published by this workflow. The optional status utility remains separate.

The initial Pages publication passed the
[Node 24 website checks](https://github.com/proudbase/proudauth-website/actions/runs/38457961516)
and [Pages deployment](https://github.com/proudbase/proudauth-website/actions/runs/38457961309).
The public `https://proudauth.com` site was reviewed on desktop and mobile:
navigation, search, copy controls, all 603 explorer operations and the environment
guide passed. Apex and `www` HTTPS certificates and HTTP-to-HTTPS redirects were
verified; repository Pages HTTPS enforcement is enabled. The temporary local
preview was stopped. Subsequent `main` changes run both workflows again.

The optional container preview still requires a maintained pinned Nginx digest
before any website image publication; GitHub Pages does not use that image.
