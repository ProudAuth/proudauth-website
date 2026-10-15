# Go SDK

The Go SDK is a separate public module,
[`github.com/proudauth/proudauth-sdk-go`](https://github.com/proudauth/proudauth-sdk-go).
No tagged SDK release is available yet. Install the reviewed source commit:

```sh
go get github.com/proudauth/proudauth-sdk-go@116f9fa19d0b0174a0c270763e2ef6abf872233b
```

| Package | Purpose |
| --- | --- |
| `github.com/proudauth/proudauth-sdk-go/verifier` | Offline verification, introspection, support guard, bounded state, sender constraints and HTTP middleware |
| `github.com/proudauth/proudauth-sdk-go/oidcclient` | OIDC backend-for-frontend client |
| `github.com/proudauth/proudauth-sdk-go/admin` | Typed administration API client |

## Protect an HTTP endpoint

```go
package main

import (
    "log"
    "net/http"
    "github.com/proudauth/proudauth-sdk-go/verifier"
)

func main() {
    v, err := verifier.New(verifier.Config{
        Issuer: "https://identity.example.com/realms/main", // your instance
        Audience: "https://api.example.com/billing",
        Algorithms: []string{"RS256"},
    })
    if err != nil { log.Fatal(err) }
    protected := verifier.Middleware(v, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        claims := verifier.FromContext(r.Context())
        if err := claims.RequireScope("billing:read"); err != nil {
            http.Error(w, "Forbidden", http.StatusForbidden)
            return
        }
        // Resolve the row's organization from trusted application data, then
        // claims.RequireOrganization(row.OrgID) before returning the row.
        w.WriteHeader(http.StatusNoContent)
    }))
    http.Handle("/billing", protected)
    log.Fatal(http.ListenAndServe("127.0.0.1:8088", nil))
}
```

Match the configured algorithm to the realm's actual signing algorithm. Offline
verification observes revocation only at token expiry. Sensitive APIs should use
strict-online introspection; support tokens must pass the support contract.

## Configure a BFF

```go
client, err := oidcclient.New(oidcclient.Config{
    Issuer: "https://identity.example.com/realms/main", // your instance
    ClientID: "customer-web-bff",
    ClientSecret: os.Getenv("BFF_CLIENT_SECRET"),
    RedirectURI: "https://app.example.com/callback",
    Scopes: []string{"openid", "orders:read"},
    Resource: "https://api.example.com/orders",
})
```

Supply a confidential client registered with that exact redirect URI. Keep the
client secret and all tokens server-side. Store login state once, validate the
callback, and preserve serialized refresh ownership across BFF instances.

## Complete implementations

The source checkout includes runnable examples:

| Example | What it demonstrates |
| --- | --- |
| `examples/protected-billing-api` | Offline verification |
| `examples/protected-orders-api` | Introspection, support policy and access decisions |
| `examples/backend-for-frontend` | Sign-in, callback, server-side sessions and logout |
| `examples/machine-client` | Service client credentials |

Continue with [resource servers](../../../docs/integrations/resource-servers.md),
[BFF integration](../../../docs/integrations/backend-for-frontend.md),
[integration patterns](../../../docs/integrations/patterns.md) and
[SDK compatibility](../../../docs/integrations/sdk-compatibility.md).
