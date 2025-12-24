import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmClient } from './llm.client';

@Injectable()
export class OllamaClient implements LlmClient {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434';
  }

  async generate(prompt: string, options: Record<string, any> = {}): Promise<string> {
    const model = options.model || this.configService.get<string>('LLM_MODEL') || 'llama2';
    const maxTokens = options.max_tokens || options.maxTokens || 512;

    const body: Record<string, any> = {
      model,
      prompt,
      max_tokens: maxTokens,
      think: false,
      ...options,
    };

    // If caller explicitly requests non-streaming, pass it through.
    // Do not change default behavior unless `stream` is provided in options.
    if (Object.prototype.hasOwnProperty.call(options, 'stream')) {
      body.stream = options.stream;
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}/api/generate`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Ollama generate failed: ${res.status} ${res.statusText} ${txt}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const json = await res.json();
      if(json.response && typeof json.response === 'string') {
        return json.response;
      }
    }

    return res.text();
  }
}
