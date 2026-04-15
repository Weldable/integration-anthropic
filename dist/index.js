import Anthropic from '@anthropic-ai/sdk';
import { defineIntegration, IntegrationAuthError, IntegrationBillingError, IntegrationValidationError } from '@weldable/integration-core';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const ALLOWED_MODELS = new Set([
    'claude-haiku-4-5',
    'claude-sonnet-4-6',
    'claude-opus-4-6',
]);
/**
 * Recursively inject `additionalProperties: false` into all object schemas.
 * The Anthropic structured output API requires it.
 */
function injectAdditionalProperties(schema) {
    if (schema.type !== 'object')
        return schema;
    const result = {
        ...schema,
    };
    if (!('additionalProperties' in result)) {
        result.additionalProperties = false;
    }
    if (result.properties && typeof result.properties === 'object') {
        const props = result.properties;
        const newProps = {};
        for (const [key, val] of Object.entries(props)) {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                newProps[key] = injectAdditionalProperties(val);
            }
            else {
                newProps[key] = val;
            }
        }
        result.properties = newProps;
    }
    return result;
}
export default defineIntegration({
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Call Claude models as steps in your workflows.',
    icon: 'anthropic',
    version: 1,
    auth: {
        type: 'api_key',
        test: async (_args, ctx) => {
            const { token: apiKey } = ctx.getCredentials();
            const client = new Anthropic({ apiKey });
            try {
                await client.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'hi' }],
                });
            }
            catch (err) {
                if (err instanceof Anthropic.AuthenticationError) {
                    throw new IntegrationAuthError('invalid_api_key');
                }
                throw err;
            }
            return { ok: true };
        },
    },
    // Nango's Anthropic provider template uses connectionConfig.version for the anthropic-version header.
    nangoConnectionParams: { version: '2023-06-01' },
    configSchema: [
        {
            key: 'apiKey',
            label: 'API key',
            type: 'secret',
            required: true,
            placeholder: 'sk-ant-...',
        },
    ],
    billingUrl: 'https://console.anthropic.com/settings/billing',
    exampleUsage: "Summarize this report and highlight the key takeaways",
    actions: [
        {
            actionId: 'llm',
            name: 'Ask Claude',
            description: 'Ask a Claude AI model a question or give it a task. Returns a text response in `textOutput` by default. When `schema` is provided, uses native structured output and returns the schema fields at the top level of the result.',
            intents: [
                'ask AI',
                'use Claude',
                'run AI analysis',
                'ask a language model',
                'generate text with AI',
                'analyze with Claude',
                'summarize using AI',
                'get Claude to write',
                'prompt an AI',
                'classify this text',
                'extract information with AI',
                'translate using AI',
            ],
            preview: '{prompt}',
            inputFields: [
                {
                    name: 'prompt',
                    type: 'string',
                    required: true,
                    description: 'The question or task to send to Claude.',
                },
                {
                    name: 'model',
                    type: 'string',
                    required: false,
                    description: 'Claude model to use. One of: claude-haiku-4-5, claude-sonnet-4-6, claude-opus-4-6.',
                    default: 'claude-sonnet-4-6',
                },
                {
                    name: 'system',
                    type: 'string',
                    required: false,
                    description: 'Optional system prompt to set context or persona.',
                },
                {
                    name: 'max_tokens',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of tokens in the response.',
                    default: 4096,
                },
                {
                    name: 'schema',
                    type: 'object',
                    required: false,
                    description: 'Optional JSON schema the response must conform to. When provided, uses the native structured output API and returns the schema fields at the top level of the result.',
                },
            ],
            outputFields: [
                { name: 'textOutput', type: 'string', description: "Claude's text response. Present when no schema is provided." },
                { name: 'model', type: 'string', description: 'The Claude model that generated the response.' },
                { name: 'stop_reason', type: 'string', description: 'Why the response ended: "end_turn", "max_tokens", or "stop_sequence".' },
            ],
            mockExecute: async (args, _ctx) => {
                const schema = args.schema && typeof args.schema === 'object' && !Array.isArray(args.schema)
                    ? args.schema
                    : undefined;
                const model = typeof args.model === 'string' && args.model ? args.model : 'claude-sonnet-4-6';
                if (schema) {
                    const props = schema.properties;
                    const result = {};
                    if (props && typeof props === 'object') {
                        for (const [key, def] of Object.entries(props)) {
                            const fieldDef = def;
                            const type = fieldDef.type;
                            if (type === 'string')
                                result[key] = `mock-${key}`;
                            else if (type === 'number' || type === 'integer')
                                result[key] = 0;
                            else if (type === 'boolean')
                                result[key] = false;
                            else if (type === 'array')
                                result[key] = [];
                            else if (type === 'object')
                                result[key] = {};
                            else
                                result[key] = null;
                        }
                    }
                    return { ...result, model, stop_reason: 'end_turn' };
                }
                return {
                    textOutput: 'This is a mock LLM response for workflow authoring.',
                    model,
                    stop_reason: 'end_turn',
                };
            },
            execute: async (args, ctx) => {
                const { token: apiKey } = ctx.getCredentials();
                if (!apiKey) {
                    throw new IntegrationAuthError('missing_api_key');
                }
                const prompt = args.prompt;
                if (typeof prompt !== 'string' || !prompt) {
                    throw new IntegrationValidationError('"prompt" is required and must be a string', 'prompt');
                }
                const system = typeof args.system === 'string' ? args.system : '';
                const schema = args.schema && typeof args.schema === 'object' && !Array.isArray(args.schema)
                    ? args.schema
                    : undefined;
                let model = typeof args.model === 'string' ? args.model : DEFAULT_MODEL;
                if (!model)
                    model = DEFAULT_MODEL;
                if (!ALLOWED_MODELS.has(model)) {
                    throw new IntegrationValidationError(`Unknown model "${model}". Allowed: ${[...ALLOWED_MODELS].sort().join(', ')}`, 'model');
                }
                let maxTokens = typeof args.max_tokens === 'number' && args.max_tokens > 0
                    ? args.max_tokens
                    : 4096;
                const client = new Anthropic({ apiKey });
                const createParams = {
                    model,
                    max_tokens: maxTokens,
                    messages: [{ role: 'user', content: prompt }],
                };
                if (system) {
                    createParams.system = system;
                }
                if (schema) {
                    const injectedSchema = injectAdditionalProperties(schema);
                    // @ts-expect-error output_config is a newer API field not yet in SDK types
                    createParams.output_config = { format: { type: 'json_schema', schema: injectedSchema } };
                }
                let message;
                try {
                    message = await client.messages.create(createParams);
                }
                catch (err) {
                    if (err instanceof Anthropic.AuthenticationError) {
                        throw new IntegrationAuthError('invalid_api_key');
                    }
                    if (err instanceof Anthropic.BadRequestError && /credit balance is too low/i.test(err.message)) {
                        throw new IntegrationBillingError('Your Anthropic credit balance is too low. Add credits and resume this run.');
                    }
                    throw err;
                }
                const block = message.content[0];
                if (!block || block.type !== 'text') {
                    throw new Error('llm: unexpected response format from Anthropic API');
                }
                const usage = {
                    inputTokens: message.usage.input_tokens,
                    outputTokens: message.usage.output_tokens,
                };
                if (schema) {
                    const stripped = block.text
                        .trim()
                        .replace(/^```json\s*/m, '')
                        .replace(/^```\s*/m, '')
                        .replace(/\s*```$/m, '')
                        .trim();
                    let parsed;
                    try {
                        parsed = JSON.parse(stripped);
                    }
                    catch (e) {
                        const preview = stripped.slice(0, 200);
                        throw new Error(`llm: model returned invalid JSON: ${e} -- got: ${JSON.stringify(preview)}`);
                    }
                    const jsonOutput = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
                        ? parsed
                        : { result: parsed };
                    return {
                        ...jsonOutput,
                        model,
                        stop_reason: message.stop_reason,
                        usage,
                    };
                }
                return {
                    textOutput: block.text,
                    model,
                    stop_reason: message.stop_reason,
                    usage,
                };
            },
        },
    ],
});
