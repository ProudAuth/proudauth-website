# Service endpoints

These are the intended canonical destinations for the repository split. This
standalone staging build does not change DNS, tunnel routes or persisted issuers.


Each hostname has one job. Applications use the identity origin; developers use
the documentation site; the status page reports a small public health summary.

| Hostname | Purpose |
| --- | --- |
| `proudauth.com` | Service overview and links to documentation |
| `proudauth.com/docs` | Guides, SDKs, API reference and downloadable contracts |
| `api.proudauth.com` | Identity API and OAuth/OIDC endpoints |
| `status.proudauth.com` | Live public readiness and documentation checks |

## Main realm

| Endpoint | Address |
| --- | --- |
| Issuer | `https://api.proudauth.com/realms/main` |
| OIDC discovery | `https://api.proudauth.com/realms/main/.well-known/openid-configuration` |
| JWKS | `https://api.proudauth.com/realms/main/jwks` |
| Token endpoint | `https://api.proudauth.com/realms/main/oauth/token` |
| Introspection | `https://api.proudauth.com/realms/main/oauth/introspect` |
| Admin API base | `https://api.proudauth.com/api/v1/realms/main` |
| Readiness | `https://api.proudauth.com/health/ready` |

Always discover protocol metadata and validate its issuer. Do not infer endpoints
from an untrusted token. The API explorer is on the documentation site at
[/api/explorer/](/api/explorer/); the OpenAPI file is at
[/api/openapi.yaml](/api/openapi.yaml).

## Operator-only endpoints

Metrics, detailed operator status and the development email inbox remain on the
private operator listener. They have no public subdomains. Webhooks are outbound
deliveries to registered consumers; a generic public `hook` hostname is not needed.
SMTP delivery uses a configured relay, not a public email-inbox website.

## Availability

This is a demonstration deployment on one Mac behind Cloudflare Tunnel. The
computer, Docker and the connector must stay running. The status page is a live
point-in-time check; it does not claim historical uptime, an SLA or independent
monitoring. It shares the deployment's failure domain.
