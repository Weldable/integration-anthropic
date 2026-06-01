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

## Prompt caching

Pass `prompt` (or `system`) as an array of blocks to cache stable prefix content across repeated calls within the same run:

```yaml
- uses: anthropic.llm
  with:
    system: "You are a career advisor..."
    prompt:
      - text: "{{ steps.read_resume.output.markdown }}"
        cache: true
      - text: "Evaluate this job: {{ job.title }} at {{ job.company }}"
```

Mark stable blocks with `cache: true`; the last block (variable per-call content) should not be marked. On the first call within a 5-minute window, the marked blocks are written to cache (1.25× the normal input price). Subsequent calls within that window that share the same prefix read from cache at 0.1× the normal price — a 10× discount.

Check `usage.cacheCreationInputTokens` (> 0 on write) and `usage.cacheReadInputTokens` (> 0 on hit) in the step output to verify caching is active. Note: Sonnet 4.6 requires at least 1,024 tokens in the cached prefix; below that threshold the `cache: true` marker is silently ignored.

## Contributing and releasing

See [CONTRIBUTING.md](https://github.com/weldable/integration-core/blob/main/CONTRIBUTING.md) in `@weldable/integration-core` for the development workflow and release process.

## License

MIT
