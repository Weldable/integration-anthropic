# @weldable/integration-anthropic

This is one integration in the Weldable integrations family. Conventions, action authoring patterns, error classes, and the release process are documented canonically in **[integration-core's CLAUDE.md](https://github.com/weldable/integration-core/blob/main/CLAUDE.md)** — read that first for any non-trivial change.

## Local quirks

- Uses `@anthropic-ai/sdk` directly rather than `createRestHandler`. The `execute` handler is a plain async function that calls the SDK with the API key from `ctx.getCredentials()`. Auth type is `api_key` with a `configSchema` for the key field.

## Releasing

Use the `/commit` skill — it handles the version bump, build check, and push to trigger the automated npm publish.
