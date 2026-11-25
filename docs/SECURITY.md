# Security and distribution

The private 2.2.5 package contains a client credential introduced by the historical API dependency. This snapshot excludes that dependency, the package, captured responses and session data. The recovered regression scripts use synthetic test data only. Static review is limited to this recovery and does not certify a future bundle.

The build has no shipped API provider. Review the provider, its dependencies and the final artifact before building or distributing. User sessions must be issued through an authorized flow; keep TLS validation, DRM and service access controls intact. No tokens, client secrets or account data belong in the source, logs or package.
