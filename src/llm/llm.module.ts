import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OllamaClient } from './ollama.client';
import { LLM_CLIENT } from './llm.client';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_CLIENT,
      useClass: OllamaClient,
    },
  ],
  exports: [LLM_CLIENT],
})
export class LlmModule {}
