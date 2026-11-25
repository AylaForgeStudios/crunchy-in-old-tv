# Crunchy in Old TV

[![Support on Ko-fi](https://img.shields.io/badge/Support_on_Ko--fi-7139A8?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/aylaforge)

Crunchy in Old TV is an unofficial community adaptation for older LG webOS televisions, maintained by **AylaForge Studios**. It builds on Esteban Díaz's [Crunchyroll WebOS Stream](https://github.com/ediaz23/crunchyroll-webos-stream) and targets webOS 3.5 and Chromium 38.

## What has been verified

The protected private **2.2.5** milestone completed QR sign-in, profile selection, catalog browsing and episode playback on an **LG 55UJ6510-SA running webOS 3.5**. Aoashi played with Spanish subtitles. These results belong to the protected milestone.

## Recovery branch status

This source snapshot contains the recovered application, API wrappers, Luna service, and regression scripts. It preserves QR polling, expiry, cancellation, server backoff and HTTP 204 handling. The service retains HTTPS certificate validation. Playback still uses the original DASH and DRM flow.

Compilation is blocked until a reviewed API provider is available. The build configuration has an explicit provider entry and does not install the previous API package. Sign-in, profiles, the live catalog, playback, subtitles and the separate app and service IDs have yet to be validated in this snapshot. No installable package is included.

See [build requirements](docs/BUILD.md), [security](docs/SECURITY.md), [upstream and modifications](docs/UPSTREAM.md), [license](LICENSE), [attribution](NOTICE), and [third-party licensing](THIRD_PARTY_LICENSES.md).

## Voluntary support

[Support AylaForge Studios on Ko-fi](https://ko-fi.com/aylaforge) if you would like to support independent development. Contributions are optional and do not purchase Crunchyroll access, replace a subscription or unlock app features.
