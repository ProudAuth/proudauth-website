# ProudAuth website

One home for ProudAuth: a landing page and developer documentation at `/docs/`,
with source-derived guides, a complete API reference and first-party SDK guides.
The website is independent of the identity service checkout and builds offline.

**Status:** public standalone source at
[`proudbase/proudauth-website`](https://github.com/proudbase/proudauth-website).
No website image release, DNS route or issuer migration is claimed by this
repository. The existing live deployment remains separate from this source split.

[![Website checks](https://github.com/proudbase/proudauth-website/actions/workflows/ci.yml/badge.svg)](https://github.com/proudbase/proudauth-website/actions/workflows/ci.yml)

## Build, check and preview

Requires Node.js 20.10+. Node 24 is the CI target. No dependency installation,
Docker daemon, PostgreSQL instance, adjacent source checkout or network access is
required to build or test.

```sh
npm run check
npm run preview                 # http://127.0.0.1:3000
```

`npm run build` verifies the content manifest and writes the complete static
website to ignored `dist/`. `npm test` verifies guide links/anchors, assets,
API coverage, schema dependencies, canonical URLs, search/download paths,
content hashes and sanitized operational/degraded status behavior. Preview binds
only to loopback; choose another free port with `PORT=3001 npm run preview`.

## Public URL layout

| Address | Purpose |
| --- | --- |
| `https://proudauth.com/` | Landing page |
| `https://proudauth.com/docs/` | Guides, SDKs and API reference |
| `https://api.proudauth.com/` | Identity service and OAuth/OIDC endpoints |
| `https://status.proudauth.com/` | Optional sanitized status summary |
| `https://www.proudauth.com/*` | Permanent redirect to the apex, preserving path/query |
| `https://docs.proudauth.com/*` | Compatibility redirect to `/docs/*` |

These are the **planned** destinations. Changing this static site's configuration
does not migrate an existing OIDC issuer, stored audiences or application
settings. Keep the current live deployment intact until the service transition
and Cloudflare changes are separately validated.

## Content ownership and provenance

- `src/`: website-owned introduction, layout, styles and interactions.
- `content/snapshot/`: explicitly selected service guides, API contracts, SDK
  READMEs and public benchmark evidence; original relative paths are retained.
- `content.lock.json`: SHA-256 for every imported file, original-byte hash,
  redaction flag, original HEAD and dirty state; Swagger asset provenance.
- `scripts/`: independent builder, manifest checks, preview and optional status.
- `tests/`: publication and status tests.
- `vendor/`: licensed parsers and already-cached Swagger assets.
- `deploy/`: hardened static container configuration; never mounts credentials.

The initial input was a dirty private workspace at recorded HEAD `5ff6ddb…`,
not a clean source release. Its exact imported bytes are pinned by per-file
hashes. `commitPinned:false` is deliberate. Future updates should identify exact
commits in the split service and SDK repositories and pass the same import and
publication checks. Builds never fetch a moving branch or require adjacent repos.

Service runbooks, API contracts, benchmarks and its changelog remain owned by the
service repository. SDK documentation remains owned by each SDK repository.
Website updates import approved snapshots in a reviewable change; content is not
silently rewritten by a network fetch during a build.

Absolute user and temporary paths are redacted in snapshots. Public benchmark
copies therefore may differ from original evidence bytes. Their original hashes
and measurement versions are preserved; the manifest pins the sanitized copies.
Numbers remain observations from one laptop, not guarantees or sizing advice.

## Containers

Builds use only existing local images when the operator requests an offline run:

```sh
make image                      # build/check first; docker build --pull=false
make serve                      # loopback http://127.0.0.1:8096
make stop                       # removes only this Compose project's containers
```

The static image uses a non-root Nginx process, read-only filesystem, dropped
capabilities, strict response headers and no service network dependency. The
initial container base is the existing `nginx:1.27-alpine` tag. Validate and pin a
maintained multi-architecture digest before public image publication; no
multi-architecture image/release is claimed by this staging snapshot.

The optional sanitized status process is `scripts/status.mjs`. It needs three
explicit configured health URLs and the four status assets beside its script;
`deploy/Dockerfile.status` packages these files. It is not started by default.
It checks fixed targets without returning private upstream diagnostics and makes
no historical uptime or independent worker/email claim.

## Publication boundaries

The repository contains no `.env`, root keys, database password, database dump,
image archive, private `.state/`, benchmark seed, source checkout cache or
operator response. Only approved contracts and previously published measurement
artifacts become downloads. Embedded Markdown HTML is escaped; the Swagger
explorer disables request execution and credential persistence.

Six established content/status checks and additional standalone/base-path checks
are automated. See [validation](VALIDATION.md), [contributing](CONTRIBUTING.md)
and [security reporting](SECURITY.md). Source is Apache-2.0; retain the component
licenses and [notices](NOTICE) when redistributing.
