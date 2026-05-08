// Deterministic Cohere client stub — same contract as createCohereClient.
// Used by integration tests where we want to bypass real API.

const DIM = 1024; // matches embed-multilingual-v3.0

const hashToFloats = (text, dim = DIM) => {
  // Simple deterministic mapping: char codes → repeating float pattern.
  const out = new Array(dim);
  for (let i = 0; i < dim; i++) {
    out[i] = ((text.charCodeAt(i % text.length) || 0) / 255 - 0.5);
  }
  return out;
};

export function createCohereStub() {
  return {
    async embed(texts, _inputType) {
      return {
        embeddings: texts.map(t => hashToFloats(t)),
        usage: { tokens: texts.reduce((s, t) => s + t.length, 0) / 4 | 0 }
      };
    },
    async rerank(query, documents, topN) {
      // Score = lexical overlap with query; deterministic.
      const qWords = new Set(query.toLowerCase().split(/\s+/));
      const scored = documents.map((doc, index) => {
        const dWords = new Set(doc.toLowerCase().split(/\s+/));
        let overlap = 0;
        for (const w of qWords) if (dWords.has(w)) overlap++;
        return { index, relevance_score: overlap / Math.max(qWords.size, 1) };
      });
      scored.sort((a, b) => b.relevance_score - a.relevance_score);
      return { results: scored.slice(0, topN) };
    }
  };
}
