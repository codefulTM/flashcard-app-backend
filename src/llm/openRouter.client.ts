import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmClient } from './llm.client';

@Injectable()
export class OpenRouterClient implements LlmClient {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OPENROUTER_URL') || "https://openrouter.ai/api/v1/chat/completions";
  }

  async generate(prompt: string, options: Record<string, any> = {}): Promise<string> {
    const model = 'deepseek/deepseek-r1-0528:free';
    // const maxTokens = options.max_tokens || options.maxTokens || 512;
    console.log("Using OpenRouterClient to generate text");

    const body: Record<string, any> = {
      model,
      messages: [
        { 
            role: 'user',
            content: prompt,
        }
      ]
    };

    // const url = `${this.baseUrl.replace(/\/$/, '')}/api/generate`;

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.configService.get<string>('OPENROUTER_API_KEY')}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenRouter generate failed: ${res.status} ${res.statusText} ${txt}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const json = await res.json();
      if(json.choices[0] && typeof json.choices[0].message.content === 'string') {
        return json.choices[0].message.content;
      }
    }

    return res.text();
  }
}
