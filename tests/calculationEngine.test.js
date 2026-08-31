import test from 'node:test';
import assert from 'node:assert/strict';

test('Financial Calculations: Weighted pipeline and margin calculations', () => {
  const amount = 100000;
  const probability = 75;
  const weighted = Math.round((amount * probability) / 100);
  assert.equal(weighted, 75000);

  const subtotal = 50000;
  const taxRate = 8.5;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  assert.equal(total, 54250);
});

test('Time Tracking duration formatting', () => {
  const seconds = 3665;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const formatted = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  assert.equal(formatted, '01:01:05');
});
