# Upstream and modification notices

- Original application: [Crunchyroll WebOS Stream](https://github.com/ediaz23/crunchyroll-webos-stream), by Esteban Díaz. Base branch `webos_4x_3x`, commit `4c3d41dcbe9a1bc79ce932213c23db2f04b559a5`.
- Source reference: private tag `lg35-2.2.5`, commit `32cb69a5b7b16374fb6ea0a174b2815e583ce2a5`.
- Original Luna service: [crunchyroll-webos-service](https://github.com/ediaz23/crunchyroll-webos-service), pinned to `36d3582f0831c83ad06a7823f11c047e999d3fb2`.
- Historical interface: [crunchyroll-js-api](https://github.com/ediaz23/crunchyroll-js-api) 1.5.7, also by Esteban Díaz. Referenced for provenance and interface documentation. The package and its bundle are excluded.

AylaForge Studios changed device activation, error logging, session persistence, TLS handling, and packaging in the protected line. This recovery restores the API wrappers and service, removes disabled captured-data paths, separates provider resolution, restores regressions, and gives the app and service separate identifiers. Existing upstream notices are retained. [File-level change list](MODIFIED-FILES.md) accompanies the inline notices and covers JSON manifests, which do not support comments.

The original Apache-2.0 license is supplied in LICENSE. The recovered service includes its own license. See NOTICE for attribution and THIRD_PARTY_LICENSES.md for separate obligations.
