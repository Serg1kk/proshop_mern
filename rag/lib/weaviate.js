import weaviate from 'weaviate-client';

const CLASS_NAME = 'ProshopDoc';

const SCHEMA = {
  class: CLASS_NAME,
  description: 'Chunks of proshop_mern documentation',
  vectorizer: 'none',
  vectorIndexType: 'hnsw',
  vectorIndexConfig: { distance: 'cosine' },
  invertedIndexConfig: { bm25: { b: 0.75, k1: 1.2 } },
  properties: [
    { name: 'content',      dataType: ['text'],   tokenization: 'word' },
    { name: 'source_file',  dataType: ['text'],   tokenization: 'field' },
    { name: 'doc_type',     dataType: ['text'],   tokenization: 'field' },
    { name: 'heading_path', dataType: ['text[]'] },
    { name: 'section',      dataType: ['text'] },
    { name: 'chunk_index',  dataType: ['int'] },
    { name: 'total_chunks', dataType: ['int'] },
    { name: 'sha1',         dataType: ['text'],   tokenization: 'field' },
    { name: 'char_count',   dataType: ['int'] },
    { name: 'token_count',  dataType: ['int'] },
    { name: 'ingested_at',  dataType: ['date'] }
  ]
};

export async function connect({ host, httpPort, grpcPort }) {
  return weaviate.connectToLocal({
    host,
    port: httpPort,
    grpcPort
  });
}

export async function ensureSchema(client) {
  const exists = await client.collections.exists(CLASS_NAME);
  if (exists) return { created: false };
  await client.collections.createFromSchema(SCHEMA);
  return { created: true };
}

export async function deleteBySource(client, sourceFile) {
  const col = client.collections.get(CLASS_NAME);
  await col.data.deleteMany(col.filter.byProperty('source_file').equal(sourceFile));
}

export async function listShasBySource(client, sourceFile) {
  const col = client.collections.get(CLASS_NAME);
  const res = await col.query.fetchObjects({
    filters: col.filter.byProperty('source_file').equal(sourceFile),
    returnProperties: ['sha1'],
    limit: 1000
  });
  return new Set(res.objects.map(o => o.properties.sha1));
}

export async function batchInsert(client, items) {
  const col = client.collections.get(CLASS_NAME);
  const result = await col.data.insertMany(items.map(it => ({
    properties: {
      content:      it.content,
      source_file:  it.source_file,
      doc_type:     it.doc_type,
      heading_path: it.heading_path,
      section:      it.section,
      chunk_index:  it.chunk_index,
      total_chunks: it.total_chunks,
      sha1:         it.sha1,
      char_count:   it.char_count,
      token_count:  it.token_count,
      ingested_at:  it.ingested_at
    },
    vectors: it.vector
  })));
  return result;
}

export async function countAll(client) {
  const col = client.collections.get(CLASS_NAME);
  const agg = await col.aggregate.overAll();
  return agg.totalCount;
}

export async function dropClass(client) {
  await client.collections.delete(CLASS_NAME);
}

export const CLASS = CLASS_NAME;
