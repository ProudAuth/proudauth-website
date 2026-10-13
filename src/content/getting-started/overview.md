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
| Run a local instance | [Local quickstart](quickstart.md) |
| Deploy for real users | [Production installation](../../../docs/operations/installation.md) |
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

The implementation and SDKs are in development. No official version is tagged,
and the SDK packages are unpublished. Access to a source checkout or a provided
image bundle is required; package-install examples in SDK guides describe the
intended package interface, not a claim of registry availability.

The current public hostname is a demonstration installation on one Mac with
development email. It is not an availability guarantee or a production service.
See [compatibility](../../../docs/protocols/compatibility.md),
[interoperability](../../../docs/integrations/interoperability.md) and
[security checks](../../../docs/operations/security-checks.md) for measured scope.
