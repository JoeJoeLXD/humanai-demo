export type Doc = { id: string; text: string; embedding: number[] };

class VectorStore {
  private docs: Doc[] = [];

  add(doc: Doc) { this.docs.push(doc); }

  private sim(a: number[], b: number[]) {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0);
    const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const nb = Math.sqrt(b.reduce((s, v) => s + v * v * 1, 0));
    return dot / (na * nb + 1e-9);
  }

  topK(queryEmbedding: number[], k = 4) {
    return this.docs
      .map(d => ({ doc: d, score: this.sim(queryEmbedding, d.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(r => r.doc);
  }
}

export const vectorStore = new VectorStore();
