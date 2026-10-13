# Security policy

This repository builds a static website. It holds documentation snapshots and
public contracts, not an identity database or runtime credentials. The identity
service's security policy remains authoritative for authentication behavior.

Do not report vulnerabilities by including credentials, tokens, user exports,
private keys or operator responses in public issues. Use
[GitHub private vulnerability reporting](https://github.com/proudbase/proudauth-website/security/advisories/new).
If that channel is unavailable, arrange a private channel with the ProudBase
maintainers before sending sensitive details.

All inputs to the Markdown renderer are trusted, reviewed repository files.
Embedded active HTML is escaped. Downloads use an explicit allowlist. The API
explorer has request execution and credential persistence disabled. Optional
status checks use configured fixed targets and never return upstream bodies.

Changes to import policy, rendering, headers, redirects, status targets or
vendored JavaScript require maintainer review and the complete publication checks.
Publishing a repository does not imply a security audit or production approval.
