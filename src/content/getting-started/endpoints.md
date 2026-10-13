# Your instance endpoints

`https://proudauth.com/` is the project website, hosted as static files on GitHub
Pages. `https://proudauth.com/docs/` contains guides, SDKs, the API reference and
downloadable contracts. Neither address hosts an identity API or stores your
users, credentials or sessions.

You deploy the service on your own infrastructure and choose its canonical
origin before creating a realm. The examples below use
`https://identity.example.com`; replace it with your HTTPS identity origin.

## Main realm example

| Endpoint | Your instance address |
| --- | --- |
| Issuer | `https://identity.example.com/realms/main` |
| OIDC discovery | `https://identity.example.com/realms/main/.well-known/openid-configuration` |
| JWKS | `https://identity.example.com/realms/main/jwks` |
| Token endpoint | `https://identity.example.com/realms/main/oauth/token` |
| Introspection | `https://identity.example.com/realms/main/oauth/introspect` |
| Admin API base | `https://identity.example.com/api/v1/realms/main` |
| Readiness | `https://identity.example.com/health/ready` |

Always discover protocol metadata and validate its exact issuer. Do not infer
endpoints from an untrusted token. Register OAuth clients and API audiences in
your own realm; use your application domain for callbacks and sign-in UI.

The documentation [API explorer](/api/explorer/) is read-only and uses a reserved
example domain. Its [OpenAPI download](/api/openapi.yaml) is an integration
contract, not a connection to a ProudAuth-operated service. Execute API requests
from your trusted backend or CLI against your own instance.

## Operator-only endpoints

Metrics, detailed operator status and the development email inbox belong to your
private operator listener. The release installer binds it to `127.0.0.1` and does
not publish PostgreSQL. Keep these endpoints out of public DNS and tunnels.
Webhooks are outbound deliveries to registered consumers; SMTP uses your relay.

## Operating your deployment

Availability and monitoring belong to your deployment. The project website has
no status API, hosted login or account administration endpoint. Configure your
own health checks, backups and incident procedures from the
[monitoring](../../../docs/operations/monitoring.md) and
[Compose installation](../../../docs/operations/docker-compose.md) guides.
