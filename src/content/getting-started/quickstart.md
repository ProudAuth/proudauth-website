# Docker quickstart

ProudAuth is one container image configured by environment variables. The
release installer is two files, `docker-compose.yaml` and `.env`. Your
PostgreSQL, HTTPS reverse proxy and SMTP relay stay yours; this website only
hosts documentation, and your applications connect to the instance you deploy.

## 1. Download

```sh
VERSION=v0.2.0-alpha.2
gh release download "$VERSION" --repo proudbase/proudauth \
  --pattern "proudauth-$VERSION-compose.tar.gz" --pattern SHA256SUMS
grep " proudauth-$VERSION-compose.tar.gz\$" SHA256SUMS | sha256sum -c -
tar -xzf "proudauth-$VERSION-compose.tar.gz" && cd "proudauth-$VERSION-compose"
```

## 2. Fill in `.env`

| Variable | Value |
| --- | --- |
| `PROUDAUTH_PUBLIC_ORIGIN` | Your HTTPS origin, for example `https://identity.example.com` |
| `PROUDAUTH_DATABASE_URL` | `postgres://USER:PASSWORD@HOST:5432/DB?sslmode=require` |
| `PROUDAUTH_ROOT_KEY` | `openssl rand -hex 32`; back it up with the database |
| `PROUDAUTH_SMTP_HOST`, `PROUDAUTH_SMTP_USERNAME`, `PROUDAUTH_SMTP_PASSWORD`, `PROUDAUTH_EMAIL_FROM` | Your SMTP relay |

[Every variable](../../../docs/operations/environment.md) is documented.

## 3. Start

```sh
chmod 600 .env
docker compose up -d --wait
```

Migrations run and the `main` realm is created on the first start. Point your
reverse proxy at `127.0.0.1:8080`, then check discovery:

```sh
curl --fail https://identity.example.com/realms/main/.well-known/openid-configuration
```

## 4. Create the first administrator

```sh
docker compose exec server identity-cli bootstrap -realm main -email you@example.com -username admin
docker compose exec server identity-cli setup-account --url https://identity.example.com --realm main
docker compose exec server identity-cli login --url https://identity.example.com --realm main
```

The first sign-in enrolls an authenticator app (TOTP) and verifies the email
address.

## Try it on your machine first

The service repository's `deploy/dev` adds PostgreSQL and a mail catcher, with
nothing to fill in:

```sh
git clone https://github.com/proudbase/proudauth.git
cd proudauth/deploy/dev
docker compose up -d --build --wait
```

The API is at `http://localhost:8080` and every email at `http://localhost:8025`.

## Next steps

- [Compose installation guide](../../../docs/operations/docker-compose.md): reverse proxy, upgrades and limits.
- [Authorization code with PKCE](../../../docs/protocols/oauth-oidc-profile.md) for users,
  [client credentials](../../../docs/integrations/machine-clients.md) for workloads.
- [SDKs](../sdks/overview.md) for Go, Node.js, Dart, PHP and .NET.
