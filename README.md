# HumanAI Demo (RAG) – Next.js

Minimal proof‑of‑concept for Rocketman HumanAi: ingest a few lines of text, then ask questions grounded in that context.

## Tech
- Next.js 14 (App Router) + React 18
- Tailwind CSS for quick styling
- OpenAI API for embeddings + chat
- Simple in‑memory vector store (swap later to Pinecone/Weaviate, or Mongo/SQLite)

## Setup
1. Clone and install
   ```bash
   npm i
   ```
2. Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.
3. Dev server
   ```bash
   npm run dev
   # visit http://localhost:3000
   ```

## API
- `POST /api/ingest`  { "texts": ["line 1", "line 2"] }
- `POST /api/chat`    { "question": "your question" }

## Notes
- This demo keeps vectors in memory; restart clears data.
- For persistence, create a simple `VectorStore` backed by MongoDB or SQLite and reuse the same interface.

## Deploy
- Push to GitHub, import on Vercel, set `OPENAI_API_KEY` in project env.
