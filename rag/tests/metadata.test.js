import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDocType, sha1, buildHeadingPath } from '../lib/metadata.js';

test('detectDocType: adr', () => {
  assert.equal(detectDocType('docs/adr/0001-jwt.md'), 'adr');
  assert.equal(detectDocType('docs/adr/adr-001-mongo.md'), 'adr');
});
test('detectDocType: api', () => assert.equal(detectDocType('docs/api/auth.md'), 'api'));
test('detectDocType: feature', () => assert.equal(detectDocType('docs/features/cart.md'), 'feature'));
test('detectDocType: incident', () => assert.equal(detectDocType('docs/incidents/i-001.md'), 'incident'));
test('detectDocType: page', () => assert.equal(detectDocType('docs/pages/cart.md'), 'page'));
test('detectDocType: runbook', () => assert.equal(detectDocType('docs/runbooks/deploy.md'), 'runbook'));
test('detectDocType: reference (root .md)', () => {
  assert.equal(detectDocType('docs/architecture.md'), 'reference');
  assert.equal(detectDocType('docs/glossary.md'), 'reference');
});
test('detectDocType: feature_spec for features.json', () => {
  assert.equal(detectDocType('docs/features.json'), 'feature_spec');
});
test('detectDocType: throws on unknown path', () => {
  // v2 walker: throws on non-.md paths with no known type-dir segment.
  assert.throws(() => detectDocType('random/path.txt'), /unknown/i);
});

test('sha1: deterministic for same input', () => {
  assert.equal(sha1('hello'), sha1('hello'));
});
test('sha1: returns 40-char hex', () => {
  assert.match(sha1('hello'), /^[0-9a-f]{40}$/);
});
test('sha1: different input → different hash', () => {
  assert.notEqual(sha1('hello'), sha1('world'));
});

test('buildHeadingPath: empty stack → []', () => {
  assert.deepEqual(buildHeadingPath([]), []);
});
test('buildHeadingPath: H1 only', () => {
  assert.deepEqual(buildHeadingPath([{ depth: 1, text: 'Deploy' }]), ['Deploy']);
});
test('buildHeadingPath: H1 → H2 → H3', () => {
  assert.deepEqual(
    buildHeadingPath([
      { depth: 1, text: 'Deploy' },
      { depth: 2, text: 'Heroku' },
      { depth: 3, text: 'Buildpacks' }
    ]),
    ['Deploy', 'Heroku', 'Buildpacks']
  );
});

test('detectDocType: works for sample-corpus paths (no docs/ prefix)', () => {
  assert.equal(detectDocType('rag/tests/fixtures/sample-corpus/incidents/i-001.md'), 'incident');
  assert.equal(detectDocType('rag/tests/fixtures/sample-corpus/adr/adr-004.md'), 'adr');
});
test('detectDocType: works for absolute paths', () => {
  assert.equal(detectDocType('/abs/path/docs/runbooks/deploy.md'), 'runbook');
});
