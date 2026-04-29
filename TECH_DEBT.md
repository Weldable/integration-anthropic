# Tech Debt — integration-anthropic

## [2026-04-29] src/index.ts — ALLOWED_MODELS
`ALLOWED_MODELS` is a hardcoded `Set` of model IDs. When Anthropic releases a new model, the integration silently rejects it until someone notices, bumps the set, and publishes a new version. Consider fetching the model list from the Anthropic API at auth-test time (cached) or accepting any string and letting the API return the error.

## [2026-04-29] src/index.ts — @ts-expect-error on output_config
Line suppresses `@ts-expect-error` because `output_config` is not yet typed in `@anthropic-ai/sdk@0.39.0`. Should be removed once the SDK type is updated. Track the SDK changelog and clean this up when types catch up.

## [2026-04-29] README.md line ~31
Code example uses `result.content` but the actual output field is `result.textOutput`. Copy-paste from the README will silently produce `undefined`. Fix the example and add a smoke test that asserts output field names match the README.
