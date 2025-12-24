import { OllamaClient } from './ollama.client';
import { ConfigService } from '@nestjs/config';

describe('OllamaClient', () => {
  let configService: Partial<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((k: string) => {
        if (k === 'OLLAMA_URL') return 'http://localhost:11434';
        if (k === 'LLM_MODEL') return 'test-model';
        return undefined;
      }),
    };
    (global as any).fetch = undefined;
  });

  it('returns generated text when API returns json.output string', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ output: 'generated text' }),
    });

    const client = new OllamaClient(configService as ConfigService);
    const out = await client.generate('hello');
    expect(out).toBe('generated text');
  });

  it('parses generations field if present', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ generations: [{ text: 'gen text' }] }),
    });

    const client = new OllamaClient(configService as ConfigService);
    const out = await client.generate('hello');
    expect(out).toBe('gen text');
  });
});
