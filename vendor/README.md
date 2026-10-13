# Build-only dependencies

These existing local packages are copied here so documentation builds do not
download dependencies or require npm installation. Neither parser is served to
visitors; generated pages are static HTML.

| Package | Version | License | Upstream |
| --- | --- | --- | --- |
| marked | 13.0.3 | MIT | https://github.com/markedjs/marked |
| js-yaml | 4.3.2 | MIT | https://github.com/nodeca/js-yaml |

License texts accompany the vendored files. Update deliberately and review
generated output before deploying. Markdown inputs are trusted repository
documentation, never visitor input.

Swagger UI 5.33.2 browser assets and bundled notices live in `swagger-ui/`.
They were copied from existing local output with recorded image-digest and
SHA-256 provenance; building the website needs neither Docker nor downloads.
The Apache-2.0 text and bundled third-party notices accompany these assets.
