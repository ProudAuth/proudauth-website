# Contributing

Use Node.js 20.10 or newer. Node 24 is the CI target; no npm dependencies are
installed. Run `npm run check` before opening a pull request.

Edit website-owned copy in `src/content/` and layout/assets in `src/assets/`.
Technical service guides and contracts belong in `ProudAuth/proudauth`;
each SDK README belongs in its `ProudAuth/proudauth-sdk-*` repository. Imported
files under `content/snapshot/` are reviewed snapshots: do not edit them silently.

A content update must record the upstream repository and exact revision, import
only approved paths, redact local/private paths, and update each SHA-256 in
`content.lock.json`. For a clean, published source revision, mark provenance as
commit-pinned only after the imported bytes match that commit. The initial
snapshot deliberately records the original workspace's HEAD and dirty state;
that historical HEAD does not identify its uncommitted contents.

Explain user-visible changes, source versions and validation in the pull request.
Keep package-publication statements accurate: a public source repository is not
an npm, Pub, Packagist or NuGet release. Preserve benchmark environment, versions
and caveats. Never replace measurements with numbers from another build.

Sign commits with a Developer Certificate of Origin sign-off when commits are
created (`git commit -s`). Do not submit secret files, deployment state, backups,
private screenshots, benchmark seeds, local caches or generated `dist/` output.
