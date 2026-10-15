# Troubleshooting

Use a discovery or readiness URL when testing the identity hostname. A request to
`/realms/main` alone is not a sign-in page.

## Common responses

| Symptom | Check |
| --- | --- |
| `required variable ... is missing a value` | Docker Compose names the empty `.env` value; fill it in and start again. |
| Reverse proxy `502` | Your identity service is running on the configured upstream address and port. Check Docker health and local `curl` before inspecting proxy settings. |
| `421 misdirected_request` | The request's Host matches the configured canonical origin or a verified realm custom domain. |
| `401` | Bearer credentials, token issuer/audience, token kind, expiry and any sender constraint. |
| `403` | Required permission/scope, organization context, MFA freshness and support-access restrictions. |
| `404` for an organization | Existence may intentionally be hidden from callers without authority in that organization. |
| `412` or `428` | Re-read the resource, obtain its ETag and supply `If-Match`. |
| `429` or `503` | Honor `Retry-After`; inspect rate budgets and dependency health privately. |
| The documentation explorer cannot execute requests | The project explorer is intentionally read-only. Run the curl/CLI examples against your own instance; do not enter credentials into the documentation website. |

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
