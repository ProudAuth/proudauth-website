# Meet ProudAuth

ProudAuth is a self-hosted identity provider written in Go. It handles identities,
sign-in, tokens, organizations and access decisions while your applications keep
control of their interfaces and business data.

You run one container image, configured by environment variables, next to your
own PostgreSQL and SMTP relay. It runs the identity server and a background
worker; no message broker or object store is needed.

## Choose your starting point

| Your goal | Start here |
| --- | --- |
| Run your own instance | [Docker quickstart](../../../docs/operations/docker-compose.md) |
| Configure production | [Environment variables](../../../docs/operations/environment.md) |
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

## Release status

The service release is **{{VERSION}}**, {{RELEASE_KIND}} with no completed
independent security review. Its image and two-file Compose installer are on
[GitHub Releases]({{RELEASE_URL}}).
The five SDKs are installed from their public source repositories; registry
packages are not published yet. There is no ProudAuth-hosted identity endpoint:
your identity API runs on your infrastructure.
