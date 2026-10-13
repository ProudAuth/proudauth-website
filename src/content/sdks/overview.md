# Choose an SDK

First-party libraries share the same identity contracts across five languages.
Choose the runtime your backend uses. Browser sign-in uses a backend-for-frontend
or your own login interface; backend client secrets never belong in a browser.

| Runtime | Guide | Framework support |
| --- | --- | --- |
| Go | [Go SDK](go.md) | `net/http`, request metadata, multiple issuers |
| Node.js 20.10+ | [Node.js & TypeScript](../../../sdk/node/README.md) | Express/Connect, `node:http`, Fastify |
| Dart | [Dart & Flutter backends](../../../sdk/dart/README.md) | Dart-only core and `dart:io`; no Flutter dependency |
| PHP 8.2+ | [PHP](../../../sdk/php/README.md) | Plain PHP and PSR-15 authentication helpers |
| .NET 8+ | [C# & ASP.NET Core](../../../sdk/dotnet/README.md) | Authentication scheme and middleware |

## Shared capabilities

- Offline JWT verification with a configured issuer and audience.
- Strict-online introspection and audited support-access enforcement.
- Bounded-state verification using the session-event stream.
- Authorization code with PKCE, ID-token validation, serialized refresh and logout.
- Administration clients with cursor pagination, ETags, problem details and
  explicitly revealed one-time secrets.

Sender-constrained DPoP/mTLS token handling differs by SDK. The Go SDK supplies a
request-level sender verifier; token-only methods in the other SDKs reject bound
tokens. Check the [resource-server profile](../../../docs/integrations/resource-servers.md)
before selecting an adapter.

## Installation and maturity

The five independent source repositories are public under
[`proudbase`](https://github.com/proudbase):
[Go](https://github.com/proudbase/proudauth-sdk-go),
[Node](https://github.com/proudbase/proudauth-sdk-node),
[Dart](https://github.com/proudbase/proudauth-sdk-dart),
[PHP](https://github.com/proudbase/proudauth-sdk-php) and
[.NET](https://github.com/proudbase/proudauth-sdk-dotnet).

The libraries retain development version 0.2.0. npm, Pub, Packagist and NuGet
packages remain unpublished; the individual guides explain source installation
and local package creation. Go can install its pinned public module commit.
Independent CI covers each SDK's declared runtime matrix; .NET runs its strict
signature and invalid-key regression vectors on Linux, macOS and Windows.

Read [runtime compatibility](../../../docs/integrations/sdk-compatibility.md) and
[interoperability evidence](../../../docs/integrations/interoperability.md) for
exact tested versions and limitations. A package's minimum runtime is distinct
from a locally tested runtime and from a configured CI runtime.
