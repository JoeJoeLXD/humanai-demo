// lib/vectorStore.ts
export type Doc = { id: string; text: string; embedding: number[] };

class VectorStore {
  private docs: Doc[] = [];

  add(doc: Doc) { this.docs.push(doc); }
  size() { return this.docs.length; }

  private cosine(a: number[], b: number[]) {
    const n = Math.min(a.length, b.length);
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < n; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
  }

  private tokenOverlapScore(q: string, t: string) {
    const toks = (s: string) => s.toLowerCase().match(/[a-z0-9\+\=\-\.]+/g) ?? [];
    const A = new Set(toks(q)), B = new Set(toks(t));
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    // Jaccard-ish
    return A.size ? inter / (A.size + B.size - inter || 1) : 0;
  }

  topKWithScores(queryEmbedding: number[], rawQuery: string, k = 4) {
    return this.docs
      .map(d => {
        const cos = this.cosine(queryEmbedding, d.embedding);
        const lex = this.tokenOverlapScore(rawQuery, d.text);
        // hybrid score: embeddings + small lexical boost
        const score = cos + 0.2 * lex;
        return { doc: d, score, cos, lex };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  topK(queryEmbedding: number[], rawQuery: string, k = 4) {
    return this.topKWithScores(queryEmbedding, rawQuery, k).map(r => r.doc);
  }
}

// ---- persist across hot reloads / serverless invocations ----
const g = globalThis as unknown as { __VECTOR_STORE__?: VectorStore };
export const vectorStore = g.__VECTOR_STORE__ ?? (g.__VECTOR_STORE__ = new VectorStore());

