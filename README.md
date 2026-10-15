<p align="center">
  <a href="https://proudauth.com"><img src="https://raw.githubusercontent.com/ProudAuth/.github/main/assets/banner-proudauth-website.png" alt="ProudAuth website and documentation" width="100%"></a>
</p>

<p align="center">
  <a href="https://github.com/ProudAuth/proudauth-website/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/ProudAuth/proudauth-website/ci.yml?branch=main&label=checks&style=for-the-badge&labelColor=06120e"></a>
  <a href="https://github.com/ProudAuth/proudauth-website/actions/workflows/pages.yml"><img alt="Deploy" src="https://img.shields.io/github/actions/workflow/status/ProudAuth/proudauth-website/pages.yml?branch=main&label=deploy&style=for-the-badge&labelColor=06120e"></a>
  <a href="https://proudauth.com"><img alt="Website" src="https://img.shields.io/badge/web-proudauth.com-3ee6b0?style=for-the-badge&labelColor=06120e"></a>
</p>

# ProudAuth website

One home for ProudAuth: a landing page and developer documentation at `/docs/`,
with source-derived guides, a complete API reference and first-party SDK guides.
The website is independent of the identity service checkout and builds offline.

**Status:** public standalone source at
[`ProudAuth/proudauth-website`](https://github.com/proudauth/proudauth-website).
The landing page and documentation publish to GitHub Pages at
[`proudauth.com`](https://proudauth.com). This is a static project website.
Operators deploy the identity service, database and worker on their own infrastructure.

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

## Always the latest release

The published site follows the latest ProudAuth release on its own. Every run of
[`pages.yml`](.github/workflows/pages.yml) asks GitHub for the newest
[ProudAuth/proudauth release](https://github.com/proudauth/proudauth/releases),
syncs the documentation from that release tag (`sync-content.mjs --release`),
builds, checks and deploys. Nothing in this repository carries a version number:
the landing page, the sidebar, the overview and the quickstart all take it from
the synced release, and the [Docker quickstart](https://proudauth.com/docs/getting-started/quickstart/)
is ProudAuth's own install guide (`docs/operations/docker-compose.md`) at that tag.

| Trigger | When |
| --- | --- |
| New ProudAuth release | Within the hour (hourly check); immediately when ProudAuth's release workflow has a dispatch token |
| Push to `main` | Website changes deploy with the latest release's content |
| Manual | Actions → Deploy GitHub Pages → Run workflow |

The hourly check deploys only when the live site shows an older release. The
pages use GitHub Pages with the `github-pages` environment; only deployment
receives `pages:write` and `id-token:write`. Configure the repository's Pages
source as GitHub Actions and the custom domain as `proudauth.com`.

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

Service inputs now come from the exact public commit recorded in
`content.lock.json`. The manifest also preserves the initial workspace input
hashes. All five SDK READMEs are imported byte-for-byte from their published
commits, including .NET's portable strict signature/key-validation corrections
and PHP's tested public VCS installation example.
Exact upstreams and byte hashes are in the manifest. Builds never fetch a moving
branch or require adjacent repositories.

To preview a release locally, sync it into the committed snapshot and check:

```sh
node scripts/sync-content.mjs --service=../proudauth --sdk-root=.. --release=v0.2.0-alpha.2
npm run check
```

Service runbooks, API contracts, benchmarks and its changelog remain owned by the
service repository. SDK documentation remains owned by each SDK repository.
The build itself never fetches: deployment syncs an exact, immutable release tag
first, and pull requests check the committed snapshot.

Absolute user paths and temporary paths in benchmark evidence are redacted in
snapshots. Protocol routes such as `/Users/{id}` and operator command examples
are preserved. Public benchmark copies therefore may differ from original
evidence bytes. Their original hashes
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

Twelve publication, content and status checks are automated. See
[validation](VALIDATION.md), [contributing](CONTRIBUTING.md)
and [security reporting](SECURITY.md). Source is Apache-2.0; retain the component
licenses and [notices](NOTICE) when redistributing.
