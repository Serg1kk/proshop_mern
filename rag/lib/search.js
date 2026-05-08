import * as wv from './weaviate.js';

const RETRIEVAL_LIMIT = 25;
const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;

/**
 * @param {object} args
 * @param {object} args.cohere — Cohere client (real or stub)
 * @param {object} args.weaviateClient
 * @param {string} args.query
 * @param {number} [args.topK]
 * @param {object} [args.filters]   — { doc_type?: string[], source_file?: string }
 * @param {boolean} [args.rerank]
 */
export async function search({ cohere, weaviateClient, query, topK = DEFAULT_TOP_K, filters = {}, rerank = true }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    const err = new Error('query required');
    err.code = 'QUERY_REQUIRED';
    throw err;
  }
  const clamped = Math.min(Math.max(1, topK | 0), MAX_TOP_K);
  const top_k_clamped = clamped !== topK;

  const t0 = Date.now();

  // 1. Embed query
  const embedRes = await cohere.embed([query], 'search_query');
  const queryVector = embedRes.embeddings[0];

  // 2. Hybrid retrieval
  const col = weaviateClient.collections.get(wv.CLASS);
  const filterNode = buildFilters(col, filters);
  const t1 = Date.now();
  const hybridRes = await col.query.hybrid(query, {
    vector: queryVector,
    alpha: 0.5,
    fusionType: 'rankedFusion',
    limit: RETRIEVAL_LIMIT,
    filters: filterNode,
    returnMetadata: ['score']
  });
  const retrievalMs = Date.now() - t1;

  let candidates = hybridRes.objects.map(o => ({
    content:      o.properties.content,
    source_file:  o.properties.source_file,
    section:      o.properties.section,
    heading_path: o.properties.heading_path,
    chunk_index:  o.properties.chunk_index,
    total_chunks: o.properties.total_chunks,
    score_hybrid: o.metadata?.score ?? null,
    score_rerank: null
  }));

  // 3. Optional rerank
  let rerankMs = 0;
  let rerankFailed = false;
  if (rerank && candidates.length > 0) {
    const t2 = Date.now();
    try {
      const rerankRes = await cohere.rerank(query, candidates.map(c => c.content), clamped);
      const reordered = rerankRes.results.map(r => ({
        ...candidates[r.index],
        score_rerank: r.relevance_score
      }));
      candidates = reordered;
      rerankMs = Date.now() - t2;
    } catch (_e) {
      rerankFailed = true;
      // Graceful degradation: keep hybrid order, slice to clamped
    }
  }

  const sliced = candidates.slice(0, clamped);
  const totalMs = Date.now() - t0;

  return {
    query,
    results: sliced,
    stats: {
      retrieval_ms: retrievalMs,
      rerank_ms: rerankMs,
      total_ms: totalMs,
      candidates_retrieved: hybridRes.objects.length,
      candidates_returned: sliced.length,
      ...(top_k_clamped ? { top_k_clamped: true } : {}),
      ...(rerankFailed ? { rerank_failed: true } : {})
    }
  };
}

function buildFilters(col, filters) {
  const clauses = [];
  if (filters.source_file) {
    clauses.push(col.filter.byProperty('source_file').equal(filters.source_file));
  }
  if (filters.doc_type && Array.isArray(filters.doc_type) && filters.doc_type.length > 0) {
    const docTypeClauses = filters.doc_type.map(t =>
      col.filter.byProperty('doc_type').equal(t)
    );
    if (docTypeClauses.length === 1) clauses.push(docTypeClauses[0]);
    else clauses.push(col.filter.any(docTypeClauses));
  }
  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return col.filter.all(clauses);
}
