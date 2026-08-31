import test from 'node:test';
import assert from 'node:assert/strict';
import { validationEngine } from '../js/engines/validationEngine.js';

test('ValidationEngine validates email and numbers', () => {
  assert.ok(validationEngine.validateEmail('user@apexflow.io'));
  assert.equal(validationEngine.validateEmail('invalid-email'), false);
  assert.ok(validationEngine.validatePositiveNumber(1500));
  assert.equal(validationEngine.validatePositiveNumber(-20), false);
});

test('ValidationEngine validates entity schema', () => {
  const result = validationEngine.validateEntitySchema_1({ name: 'Nexus Tech' }, { requiredFields: ['name'] });
  assert.ok(result.isValid);

  const invalid = validationEngine.validateEntitySchema_1({}, { requiredFields: ['name'] });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.length > 0);
});
