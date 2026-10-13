# Docker quickstart

Run your own ProudAuth server, worker and PostgreSQL database from the versioned
release installer. No Go compiler or source checkout is required. This project
website hosts documentation; your applications connect to the instance you deploy.

## Requirements

Docker Engine/Desktop, Docker Compose v2 with `--wait`, POSIX `sh`, Python 3.9+
and free local ports. Your application supplies its browser sign-in interface.
The `0.2.0-alpha.1` release is a pre-release.

## Download the release bundle

Download `proudauth-v0.2.0-alpha.1-compose.tar.gz` and `SHA256SUMS` from
[GitHub Releases](https://github.com/proudbase/proudauth/releases/tag/v0.2.0-alpha.1).
Follow the [checksum verification example](../../../docs/operations/docker-compose.md#download-and-verify)
before extracting. With the GitHub CLI installed:

```sh
gh release download v0.2.0-alpha.1 --repo proudbase/proudauth \
  --pattern 'proudauth-v0.2.0-alpha.1-compose.tar.gz' --pattern SHA256SUMS
# Verify the downloaded archive against SHA256SUMS before extracting.
tar -xzf proudauth-v0.2.0-alpha.1-compose.tar.gz
cd proudauth-v0.2.0-alpha.1-compose
```

The bundle supplies `docker-compose.yaml`, environment examples and initialization
scripts. Keep the files together. Put your `.env` beside `docker-compose.yaml`;
[all 19 settings and secret files](../../../docs/operations/environment.md) are documented.

## Pull and start a local evaluation

```sh
docker pull ghcr.io/proudbase/proudauth:0.2.0-alpha.1
./init.sh demo
docker compose config --quiet
docker compose pull
docker compose up -d --wait
PA_ORIGIN=$(python3 -c 'import json; print(json.load(open("config.yaml"))["server"]["public_origin"])')
curl --fail "$PA_ORIGIN/health/ready"
```

The initializer creates `.env`, private file-backed secrets and the configuration.
The demo profile binds the API and operator listener to loopback, with a private
development email sink. Its database has no host port. Choose other ports in
`.env` if needed, update the matching origin, then rerun `./init.sh demo`.

The Docker Hub mirror is
`docker.io/mohamadalialghanem/proudauth:0.2.0-alpha.1`.
Set `PROUDAUTH_IMAGE` in `.env` to that reference before initialization if desired.
Published release digests are the authority for immutable deployment pins.

## Create your realm and administrator

```sh
docker compose exec server /usr/local/bin/identity-cli realm-create -name main
docker compose exec server /usr/local/bin/identity-cli bootstrap \
  -realm main -email admin@example.test -username root-admin
```

The following setup and login commands assume the default host port **8080**.
For another host port, use the checksum-verified released CLI on your host as
shown in [nondefault local ports](../../../docs/operations/docker-compose.md#nondefault-local-ports).
Keep its URL equal to the canonical origin; the server's internal container
port remains 8080.

```sh
docker compose exec server /usr/local/bin/identity-cli setup-account \
  --url "$PA_ORIGIN" --realm main
docker compose exec server /usr/local/bin/identity-cli login \
  --url "$PA_ORIGIN" --realm main
```

Create the realm once. Keep bootstrap's one-time setup token private; there is
no default administrator password. Setup prompts for the token and a password.
Use `root-admin` at the first login-name prompt; the bootstrap email becomes a
sign-in identifier after verification. First sign-in requires TOTP enrollment
and email verification. The demo mailbox
is available only on your host's private operator listener; see the complete
[Compose guide](../../../docs/operations/docker-compose.md#local-evaluation).

```sh
curl --fail "$PA_ORIGIN/realms/main/.well-known/openid-configuration"
curl --fail "$PA_ORIGIN/realms/main/jwks"
```

Configure clients with discovery's exact issuer. A process-origin change does
not rewrite stored realm issuers or application configuration.

## Move to production

Use a fresh installation directory and choose your own HTTPS issuer before
creating the realm. Copy `.env.example` to `.env`, replace the public origin and
SMTP values, supply the SMTP password privately and run `./init.sh production`.
The [production procedure](../../../docs/operations/docker-compose.md#production-configuration)
covers the reverse proxy, separated database roles, backups and first sign-in.
Read the [environment reference](../../../docs/operations/environment.md) before editing settings.

For a full example, your application would discover
`https://identity.example.com/realms/main/.well-known/openid-configuration`,
where `identity.example.com` represents your domain, not a ProudAuth-hosted API.

## Integrate and operate

Register the application's client, exact redirect URI and API audience. Use
[authorization code with PKCE](../../../docs/protocols/oauth-oidc-profile.md)
for users and [client credentials](../../../docs/integrations/machine-clients.md)
for workloads. Supply your own login UI or BFF and choose a deliberate
[SDK validation profile](../sdks/overview.md).

`docker compose down` keeps the database volume. Adding `-v` permanently deletes
that installation's identity data. Review [backup/restore](../../../docs/operations/backup-restore.md),
[key custody](../../../docs/operations/keys.md) and [upgrades](../../../docs/operations/upgrades.md).

Contributors can instead build from source with `make image VERSION=0.2.0-dev`
in the [service repository](https://github.com/proudbase/proudauth).
