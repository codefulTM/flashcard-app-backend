LLM Migration — Ollama (local)

This document explains the environment variables and quick steps to run a local Ollama service and configure the backend to use it.

Environment variables (backend)

- OLLAMA_URL: URL of the local Ollama service (default: http://localhost:11434)
- LLM_MODEL: Model name to request (example: `llama2`, `mistral`, etc.)

Example .env entries

OLLAMA_URL=http://localhost:11434
LLM_MODEL=llama2

Run Ollama locally (example)

If you already have Ollama installed and models available, run the service (example):

# start ollama daemon (example)
ollama serve

Open the Ollama API at:

http://localhost:11434

Quick test with curl

curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama2","prompt":"Hello","max_tokens":32}'

Security & secrets

- Keep `OLLAMA_URL` internal or bound to localhost where possible.
- If you surface the service, protect it with firewall rules or a reverse proxy that enforces authentication.
- Do NOT commit API keys or secrets to the repository.

Notes for migration

- The backend now uses an `LLM_CLIENT` injectable (OllamaClient) in `src/llm`.
- Set `OLLAMA_URL` and `LLM_MODEL` in your environment or `.env`.
- Remove old provider keys (GEMINI_API_KEY) from environment when you are fully migrated.

Testing

- After setting env vars, run the backend and call the flashcard generation endpoint or use the `generate` method in `FlashcardService`.
- If you rely on streaming behavior, verify the Ollama endpoint supports your expected streaming method and adapt the client if necessary.

Rollback plan

- Keep a copy of the old `GEMINI_API_KEY` and the previous implementation until you verify parity.
- Use feature flags or a configuration switch to toggle between providers if you need gradual rollout.
