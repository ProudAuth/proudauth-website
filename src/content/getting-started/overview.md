# Meet ProudAuth

ProudAuth is a self-hosted identity provider written in Go. It handles identities,
sign-in, tokens, organizations and access decisions while your applications keep
control of their interfaces and business data.

Run the identity server, background worker and PostgreSQL yourself. The worker
delivers notifications and webhooks, processes durable jobs and manages key
lifecycle. PostgreSQL holds durable state; no message broker or object store is
required for the core deployment. Production email requires an SMTP relay.

## Choose your starting point

| Your goal | Start here |
| --- | --- |
| Run your own instance | [Docker quickstart](quickstart.md) |
| Configure production | [Docker Compose installation](../../../docs/operations/docker-compose.md) and [environment variables](../../../docs/operations/environment.md) |
| Add browser sign-in | [Backend-for-frontend](../../../docs/integrations/backend-for-frontend.md) |
| Build your own sign-in UI | [Headless authentication](../../../docs/protocols/headless-authentication.md) |
| Protect an API | [Resource-server integration](../../../docs/integrations/resource-servers.md) |
| Connect services | [Machine clients](../../../docs/integrations/machine-clients.md) |
| Use a first-party SDK | [SDK overview](../sdks/overview.md) |

## The identity model

A **realm** is an identity and issuer boundary. An **organization** is an
application tenant within a realm. A user can belong to several organizations;
an ordinary organization-scoped access token carries one organization's context.

An **OAuth client** represents an application or workload. An **API resource**
defines an audience and its scopes. Roles and permissions describe authority;
membership and ownership describe where that authority applies. Your API must
check the token's audience and the resource's organization before returning data.

## Sign-in is headless

ProudAuth provides OAuth/OIDC protocol endpoints and an authentication transaction
API. There is no built-in hosted browser login or administration console. Supply
your own login interface or integrate a backend-for-frontend. The root of the
identity API is not a login page.

## Know the release status

The service release is **0.2.0-alpha.1**, an explicit pre-release. Download its
versioned image and source-free Compose installer from
[GitHub Releases](https://github.com/proudbase/proudauth/releases/tag/v0.2.0-alpha.1).
The five SDKs have independent public source repositories; npm, Pub, Packagist
and NuGet packages remain unpublished. Use their documented source installation.

`proudauth.com` is the static project website. Your identity API, database,
email relay and application sign-in interface run on your infrastructure.
There is no ProudAuth-operated hosted identity endpoint or availability SLA.
See [compatibility](../../../docs/protocols/compatibility.md),
[interoperability](../../../docs/integrations/interoperability.md) and
[security checks](../../../docs/operations/security-checks.md) for measured scope.
