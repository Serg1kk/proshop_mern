import { CohereClient } from 'cohere-ai';

/**
 * @param {{apiKey: string, embedModel: string, rerankModel: string}} cfg
 */
export function createCohereClient({ apiKey, embedModel, rerankModel }) {
  if (!apiKey) throw new Error('cohere: apiKey is required');
  if (!embedModel) throw new Error('cohere: embedModel is required');
  if (!rerankModel) throw new Error('cohere: rerankModel is required');
  const client = new CohereClient({ token: apiKey });

  return {
    /**
     * @param {string[]} texts
     * @param {"search_document"|"search_query"} inputType
     * @returns {Promise<{embeddings: number[][], usage: {tokens: number}}>}
     */
    async embed(texts, inputType) {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('cohere.embed: texts must be a non-empty array');
      }
      const res = await client.v2.embed({
        texts,
        model: embedModel,
        inputType,
        embeddingTypes: ['float']
      });
      return {
        embeddings: res.embeddings.float,
        usage: { tokens: res.meta?.billedUnits?.inputTokens ?? 0 }
      };
    },

    /**
     * @param {string} query
     * @param {string[]} documents
     * @param {number} topN
     * @returns {Promise<{results: Array<{index: number, relevance_score: number}>}>}
     */
    async rerank(query, documents, topN) {
      const res = await client.v2.rerank({
        model: rerankModel,
        query,
        documents,
        topN
      });
      return {
        results: res.results.map(r => ({
          index: r.index,
          relevance_score: r.relevanceScore
        }))
      };
    }
  };
}
