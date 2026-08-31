import test from 'node:test';
import assert from 'node:assert/strict';
import { searchEngine } from '../js/engines/searchEngine.js';

test('SearchEngine tokenizes and indexes documents', () => {
  const tokens = searchEngine.tokenize('Enterprise Cloud Architecture 2025');
  assert.ok(tokens.includes('enterprise'));
  assert.ok(tokens.includes('cloud'));
  assert.ok(tokens.includes('architecture'));
});

test('SearchEngine fuzzy filters records', () => {
  const items = [
    { id: '1', title: 'Kubernetes Cluster Deployment' },
    { id: '2', title: 'PostgreSQL Database Optimization' }
  ];
  const matched = searchEngine.executeFuzzyFilter_1(items, 'kubernetes', ['title']);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, '1');
});
