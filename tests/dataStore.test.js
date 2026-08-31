import test from 'node:test';
import assert from 'node:assert/strict';
import { dataStore } from '../js/data/dataStore.js';

test('DataStore initializes with valid entities', () => {
  assert.ok(dataStore.getAccounts().length > 0, 'Accounts should not be empty');
  assert.ok(dataStore.getDeals().length > 0, 'Deals should not be empty');
  assert.ok(dataStore.getProjects().length > 0, 'Projects should not be empty');
  assert.ok(dataStore.getTasks().length > 0, 'Tasks should not be empty');
  assert.ok(dataStore.getInvoices().length > 0, 'Invoices should not be empty');
  assert.ok(dataStore.getTickets().length > 0, 'Tickets should not be empty');
});

test('DataStore creates and deletes account record', () => {
  const newAcc = dataStore.saveAccount({
    name: 'Test Innovation Labs',
    industry: 'Artificial Intelligence',
    tier: 'Growth'
  });
  assert.ok(newAcc.id, 'New account must have an ID');
  
  const found = dataStore.getAccountById(newAcc.id);
  assert.equal(found.name, 'Test Innovation Labs');

  dataStore.deleteAccount(newAcc.id);
  const deleted = dataStore.getAccountById(newAcc.id);
  assert.equal(deleted, null);
});

test('DataStore searches across multiple entities', () => {
  const res = dataStore.searchAll('Cloud');
  assert.ok(res.total >= 0, 'Search should return a numeric count');
  assert.ok(Array.isArray(res.results), 'Results should be an array');
});
