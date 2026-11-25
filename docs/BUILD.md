# Build requirements and recovery status

The recovered source snapshot has two manifests and lockfiles, one for the Enact application and one for the Luna service. They were reconstructed from pinned metadata without installing or resolving packages. The application manifest and lockfile omit the historical API package. Lockfile consistency with npm and a successful build remain unverified.

## Provider required

Webpack maps the historical runtime import name `crunchyroll-js-api` to `integration/provider.js` and fails explicitly when that file is absent. No provider is included, fetched, or generated. The entry is reserved for a separately reviewed integration that exports the real `api`, `localStore`, `config`, `utils`, `logger`, and `CrunchyrollError` interfaces used by the recovered wrappers. The provider must honor activation response handling, propagate errors and session state, and use an authorized mechanism without embedding private client credentials. Its dependencies and bundled output must be reviewed before any build or distribution. A local integration path does not make embedded credentials private or authorize use of an API.

The QR scheduler, 204 handling, account/profile and catalog calls, and DRM wrappers remain in the source. Captured mock-data branches were removed from the recovery tree; they were disabled in the protected reference. No replacement demo provider was added.

## Packaging and validation

- Application ID: `org.aylaforge.crunchyinoldtv`. Luna service ID: `org.aylaforge.crunchyinoldtv.service`. The application manifest, service manifest, runtime constant, and Luna URL use these identifiers.
- The service source was recovered from upstream `36d3582f0831c83ad06a7823f11c047e999d3fb2`. The 2.2.5 patch was applied and keeps certificate validation and transport cancellation. The archived patch remains as provenance. Its changes are already present in the recovered service files.
- The icons and about-panel logo were derived from the AylaForge artwork in the private workspace. Neutral in-app image fallbacks were generated for missing upstream assets. Their inclusion does not grant rights to upstream media.
- The player no longer imports the excluded placeholder MP4. DASH still attaches to the video element and supplies the real source. Validate first-frame behavior and controls on Chromium 38 before a release. If the device requires a bootstrap clip, provide an original or licensed one after confirming the need.
- The two regression scripts were recovered. The activation fixture exercises the production HTTP 204 handling and auth wrapper with a synthetic response parser. Coverage of the future provider's real parser remains pending. The script fixtures are local test data.
- Requirements for eventual validation include the locked application and service dependencies, compatible Node and webOS CLI, and a review of Chromium 38 bundle output. Also verify packaging, identifiers, real QR sign-in, profiles, catalog, playback, and subtitles after approval. No installation, build or test was performed for this recovery.
- The private reference IPK, credentials, captured responses, browser binaries and old reports stay outside this tree.
