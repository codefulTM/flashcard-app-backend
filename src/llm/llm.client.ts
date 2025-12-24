export interface LlmClient {
  /**
   * Generate text from a prompt.
   * Returns the generated string to be used as flashcard back content.
   */
  generate(prompt: string, options?: Record<string, any>): Promise<string>;
}

export const LLM_CLIENT = 'LLM_CLIENT';
