# @weldable/integration-anthropic

Anthropic Claude API actions for Weldable.

Part of the [Weldable](https://weldable.ai/) integration library — see [@weldable/integration-core](https://github.com/weldable/integration-core) for the full catalog.

## Install

```bash
npm install @weldable/integration-anthropic @weldable/integration-core
```

`@weldable/integration-core` is a peer dependency and must be installed alongside this package.

## Usage

```ts
import integration from '@weldable/integration-anthropic'

const action = integration.actions.find(a => a.id === 'anthropic.llm')!

const result = await action.execute(
  {
    prompt: 'Summarize the following in one sentence: Node.js is a JavaScript runtime built on V8.',
    model: 'claude-sonnet-4-6',
    system: 'You are a concise technical writer.',
  },
  ctx, // ActionContext from your Weldable-compatible host
)

console.log(result.content) // "Node.js is a V8-powered JavaScript runtime for server-side execution."
```

## Contributing and releasing

See [CONTRIBUTING.md](https://github.com/weldable/integration-core/blob/main/CONTRIBUTING.md) in `@weldable/integration-core` for the development workflow and release process.

## License

MIT
