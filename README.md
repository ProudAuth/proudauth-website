# ProudAuth website

One home for ProudAuth: a landing page and developer documentation at `/docs/`,
with source-derived guides, a complete API reference and first-party SDK guides.
The website is independent of the identity service checkout and builds offline.

**Status:** public standalone source at
[`proudbase/proudauth-website`](https://github.com/proudbase/proudauth-website).
The landing page and documentation publish to GitHub Pages at
[`proudauth.com`](https://proudauth.com). This is a static project website.
Operators deploy the identity service, database and worker on their own infrastructure.

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
| `https://identity.example.com/` | Reserved example for an operator's self-hosted identity origin |

The website has no hosted identity API, login account, status backend or database.
OpenAPI examples use the reserved operator-owned origin; request execution and
credential persistence are disabled in the explorer.

## GitHub Pages hosting

The public site can use GitHub Pages with GitHub Free for organizations, as
documented in [GitHub's Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
The pinned
[`pages.yml`](.github/workflows/pages.yml) workflow builds and checks the static
publication on Node 24, uploads only `dist/`, then deploys through the
`github-pages` environment. Only deployment receives `pages:write` and
`id-token:write`; no registry, SMTP or identity credentials are needed.

The artifact includes the landing page, `/docs/`, `.nojekyll`, `CNAME`, a root
`404.html`, local assets, search and a sitemap. Configure the repository's Pages
source as GitHub Actions and custom domain as `proudauth.com`; point the domain to
GitHub Pages through your DNS provider and enable HTTPS after certificate issuance.
GitHub Pages serves static files and has no custom Nginx/header configuration.

## Content ownership and provenance

- `src/`: website-owned introduction, layout, styles and interactions.
- `content/snapshot/`: explicitly selected service guides, API contracts, SDK
  READMEs and public benchmark evidence; original relative paths are retained.
- `content.lock.json`: SHA-256 for every imported file, original-byte hash,
  redaction flag, source state and per-repository commit pins; Swagger provenance.
- `scripts/`: independent builder, manifest checks, preview and optional status.
- `tests/`: publication and status tests.
- `vendor/`: licensed parsers and already-cached Swagger assets.
- `deploy/`: hardened static container configuration; never mounts credentials.

The initial service input was a workspace snapshot at baseline `5ff6ddb…`.
Service imports remain explicitly unpinned until a published service commit is
selected. All five SDK READMEs are imported byte-for-byte from their published
commits, including .NET's portable strict signature/key-validation corrections.
Exact upstreams and byte hashes are in the manifest. Builds never fetch a moving
branch or require adjacent repositories.

Refresh content explicitly, inspect the diff, then run all checks:

```sh
node scripts/sync-content.mjs --service=../proudauth --sdk-root=..
# Once that exact service commit is public:
node scripts/sync-content.mjs --service=../proudauth --sdk-root=.. --service-commit=<full-sha>
npm run check
```

The import allowlist includes the complete Docker Compose guide and every one of
the 19 supported `.env` settings. A dirty service snapshot never claims clean
commit provenance; a pinned import reads the exact Git object instead of the
working tree.

Service runbooks, API contracts, benchmarks and its changelog remain owned by the
service repository. SDK documentation remains owned by each SDK repository.
Website updates import approved snapshots in a reviewable change; content is not
silently rewritten by a network fetch during a build.

Absolute user and temporary paths are redacted in snapshots. Public benchmark
copies therefore may differ from original evidence bytes. Their original hashes
and measurement versions are preserved; the manifest pins the sanitized copies.
Numbers remain observations from one laptop, not guarantees or sizing advice.

## Optional local container preview

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

The optional operator-owned status process is `scripts/status.mjs`. It needs three
explicit configured health URLs and the four status assets beside its script;
`deploy/Dockerfile.status` packages these files. It is not started by default.
It checks fixed targets without returning private upstream diagnostics and makes
no historical uptime or independent worker/email claim. It is a utility for your
deployment and is not published or executed by GitHub Pages.

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
