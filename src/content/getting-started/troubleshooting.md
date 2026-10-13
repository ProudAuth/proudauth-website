# Troubleshooting

Use a discovery or readiness URL when testing the identity hostname. A request to
`/realms/main` alone is not a sign-in page.

## Common responses

| Symptom | Check |
| --- | --- |
| Cloudflare `502` | The local service is running on the port configured in the published application route. Check Docker health and local `curl` first. |
| `421 misdirected_request` | The request's Host matches the configured canonical origin or a verified realm custom domain. |
| `401` | Bearer credentials, token issuer/audience, token kind, expiry and any sender constraint. |
| `403` | Required permission/scope, organization context, MFA freshness and support-access restrictions. |
| `404` for an organization | Existence may intentionally be hidden from callers without authority in that organization. |
| `412` or `428` | Re-read the resource, obtain its ETag and supply `If-Match`. |
| `429` or `503` | Honor `Retry-After`; inspect rate budgets and dependency health privately. |
| Swagger can load but API calls fail | Registered browser-origin CORS policy. Use the CLI examples; do not loosen CORS globally. |

## Refresh failures

Refresh tokens rotate. Reusing a spent token can revoke its family. Serialize
refresh, persist the replacement and sign in again when the SDK returns
`reauthenticate`. Several BFF processes require coordinated refresh or sticky
session ownership.

## Configuration failures

Unknown YAML keys and malformed environment overrides fail startup. Review
changes with `identity-cli config-diff` and restart to apply them. Configuration
is not live-reloaded. Changing the public origin does not rewrite stored issuers.

See [configuration](../../../docs/operations/configuration.md),
[monitoring](../../../docs/operations/monitoring.md),
[incidents](../../../docs/operations/incidents.md) and
[revocation exposure](../../../docs/operations/revocation-exposure.md).
