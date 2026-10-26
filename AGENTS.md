# Project architecture rules

- Build iOS with Vite's `native` mode: hosted Lovable asset pointers must resolve over the production HTTPS origin instead of the bundled app origin, while website builds retain same-origin paths.
- Resolve database-supplied Lovable media paths with the shared native media resolver; leave signed private URLs and bundled local files unchanged to preserve access controls.
- Keep native social sign-in hidden until a secure external-browser session handoff is implemented and tested; displaying web-only OAuth buttons does not make phone login functional.