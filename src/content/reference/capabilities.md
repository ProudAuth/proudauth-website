# Capabilities and boundaries

The guides and API contract describe the implementation. They also document
unsupported profiles and features without effect; check these boundaries before
building a dependency on a feature.

## Identity and tenancy

Realms, organizations, users, groups, invitations, projects, applications and API
resources provide separate identity and application boundaries. Organization
membership is not automatically realm-wide authority. Use the organization
context from verified claims and trusted resource data.

## Authentication and protocols

Authorization code with PKCE, client credentials, headless authentication,
passkeys, password and MFA flows, device authorization, upstream federation and
declared SAML profiles are documented in the protocol and integration guides.
No OAuth password grant, implicit grant or embedded browser login console is
provided. Inspect discovery metadata and the compatibility profile for precise
support, algorithms and excluded features.

## Authorization and extensions

Role/permission decisions, relationship authorization, access reviews, temporary
elevation and audited support access are available through their APIs. Hooks,
signed webhooks, workflows and plugins use bounded, versioned contracts. Plugins
do not execute arbitrary code inside the identity process.

## Operations

Backups, restore reconciliation, key rotation, audit retention, migration,
exports and resource limits have operator runbooks. Laptop benchmarks are
published with their configuration and pass criteria. They are reference
measurements, not sizing advice or performance guarantees.

## Release and assurance

The service version **0.2.0-alpha.1** is a pre-release with versioned container
images and a Docker Compose installer. The service, website and five SDKs have
separate public source repositories. SDK registry packages remain unpublished.
The service is not independently security reviewed or certified.
Protocol conformance and third-party interoperability are
limited to the specific profiles and versions recorded in the guides.

This page does not turn planned requirements into availability claims. See
[compatibility](../../../docs/protocols/compatibility.md),
[interoperability](../../../docs/integrations/interoperability.md),
[configuration](../../../docs/operations/configuration.md) and
[security checks](../../../docs/operations/security-checks.md).
