# Local quickstart

Build and run ProudAuth from the service source checkout. The repository split
is being prepared; a public source repository does not imply a published image
or SDK package. This guide keeps the development inbox and operator endpoints
private.

## Requirements

- Docker with Compose v2.
- Go at the version declared by the service's `go.mod` for the host CLI.
- The ProudAuth service source checkout.
- Your own application sign-in interface for browser login.

## Build the image and start development

From the service checkout:

```sh
make image                      # build the identity container from source
make dev                        # initialize private secrets and start Compose
```

The development stack runs PostgreSQL 18, schema migrations, the identity server
and worker. It listens only on loopback: public API `http://localhost:8080`,
private operator listener `http://localhost:9090`. Development email uses a
private sink. Its database volume survives an ordinary shutdown.

Development uses plain HTTP and insecure development cookies. Keep this profile
local. Public HTTPS deployments need the production runbook or a deliberately
configured HTTPS demonstration profile; publishing a DNS route is not enough.

## Create the realm and first administrator

In another terminal, use the trusted local operator channel:

```sh
docker compose -f deploy/compose/compose.yaml exec server \
  /usr/local/bin/identity-cli realm-create \
  -config /etc/proudauth/config.yaml -name main

docker compose -f deploy/compose/compose.yaml exec server \
  /usr/local/bin/identity-cli bootstrap \
  -config /etc/proudauth/config.yaml \
  -realm main -email admin@example.test -username root-admin
```

Create the realm once. Treat bootstrap's one-time setup output as a credential;
it is not appropriate for a public issue or screenshot. Build the host CLI,
complete account setup and sign in:

```sh
go build -o bin/identity-cli ./cmd/identity-cli
./bin/identity-cli setup-account --url http://localhost:8080 --realm main
./bin/identity-cli login --url http://localhost:8080 --realm main
```

Setup prompts for the one-time token and password. First administrator sign-in
requires TOTP enrollment and email verification. Follow the complete
[bootstrap runbook](../../../docs/operations/installation.md#7-bootstrap-the-first-administrator)
and [headless authentication guide](../../../docs/protocols/headless-authentication.md).
Administrator API calls need a valid MFA-backed session.

## Check your instance

```sh
curl --fail http://localhost:8080/health/ready
curl --fail http://localhost:8080/realms/main/.well-known/openid-configuration
curl --fail http://localhost:8080/realms/main/jwks
```

Configure clients from discovery's exact `issuer`. Changing process configuration
or moving from `auth` to `api` does not migrate an existing realm's stored issuer,
audiences or application settings. The [endpoint guide](endpoints.md) describes
the intended website/API topology separately from this local quickstart.

## Connect an application

1. Register its OAuth client, exact redirect URIs and allowed browser origins.
2. Register the API audience and scopes it needs.
3. Use authorization code with PKCE S256 for user sign-in, or client credentials
   for services. ProudAuth does not provide the OAuth password grant.
4. Validate issuer, audience, token type and organization in your API.
5. Choose offline, strict-online or bounded-state revocation behavior deliberately.

Continue with [OAuth and OIDC](../../../docs/protocols/oauth-oidc-profile.md),
[SDKs](../sdks/overview.md) and the [API reference](/api/).

## Before production

Use the [production installation runbook](../../../docs/operations/installation.md):
real SMTP, production mode, separated database roles, HTTPS, secret references,
private operator access, backups and restore drills. Keep the root key separately
from database backups. The local development profile is not a production profile.

```sh
docker compose -f deploy/compose/compose.yaml down
```

This stops the local instance while preserving its database volume. Adding `-v`
deletes that volume and its identity data.
