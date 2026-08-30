import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import {
  collectSignatureValues,
  parseWebhookBody,
  signPayload,
  verifySignature
} from './allpay.ts';

/**
 * Signature tests.
 *
 * The webhook signature is the whole of the trust boundary with Allpay: if
 * it is wrong in the permissive direction we accept forged payments, and
 * if it is wrong in the strict direction every real payment is rejected
 * and no student is ever let into a channel. Neither failure is visible
 * until money is moving, so the algorithm is pinned here.
 *
 * Run with: npm test
 *
 * NOTE: the vectors below are constructed from the documented algorithm,
 * not captured from Allpay. Before going live, capture one real Test-mode
 * delivery and add it as a fixture — that is the only thing that proves
 * our reading of the documentation matches their implementation.
 */

const SECRET = 'test-webhook-secret';

test('values are collected in alphabetical key order', () => {
  const values = collectSignatureValues({ b: '2', a: '1', c: '3' });
  assert.deepEqual(values, ['1', '2', '3']);
});

test('empty values are excluded rather than signed as blanks', () => {
  const values = collectSignatureValues({ a: '1', b: '', c: null, d: '4' });
  assert.deepEqual(values, ['1', '4']);
});

test('keys inside array items are sorted too', () => {
  const values = collectSignatureValues({
    items: [{ qty: 1, name: 'Course', price: 250 }],
    order_id: 'abc'
  });
  // items sorts before order_id; within an item: name, price, qty.
  assert.deepEqual(values, ['Course', '250', '1', 'abc']);
});

test('array order is preserved while object keys are sorted', () => {
  const values = collectSignatureValues({
    items: [{ name: 'First' }, { name: 'Second' }]
  });
  assert.deepEqual(values, ['First', 'Second']);
});

test('signPayload matches the documented construction', () => {
  const payload = { order_id: 'enr-1', amount: '250', status: '1' };
  // amount, order_id, status — alphabetical — then the secret.
  const expected = createHash('sha256')
    .update(`250:enr-1:1:${SECRET}`, 'utf8')
    .digest('hex');
  assert.equal(signPayload(payload, SECRET), expected);
});

test('the sign field itself is never part of what is signed', () => {
  const base = { order_id: 'enr-1', amount: '250' };
  assert.equal(
    signPayload(base, SECRET),
    signPayload({ ...base, sign: 'anything' }, SECRET)
  );
});

test('a correctly signed payload verifies', () => {
  const payload: Record<string, unknown> = {
    order_id: 'enr-1',
    amount: '250',
    status: '1'
  };
  payload.sign = signPayload(payload, SECRET);
  assert.equal(verifySignature(payload, SECRET), true);
});

test('a tampered amount is rejected', () => {
  const payload: Record<string, unknown> = {
    order_id: 'enr-1',
    amount: '250',
    status: '1'
  };
  payload.sign = signPayload(payload, SECRET);
  payload.amount = '1';
  assert.equal(verifySignature(payload, SECRET), false);
});

test('a payload signed with a different secret is rejected', () => {
  const payload: Record<string, unknown> = { order_id: 'enr-1', amount: '250' };
  payload.sign = signPayload(payload, 'someone-elses-secret');
  assert.equal(verifySignature(payload, SECRET), false);
});

test('a missing signature is rejected', () => {
  assert.equal(verifySignature({ order_id: 'enr-1' }, SECRET), false);
});

test('numeric formatting is tolerated in both directions', () => {
  // Signed as 250.00 by the provider, parsed back as the number 250 by us.
  const asSent = { order_id: 'enr-1', amount: '250.00' };
  const signature = signPayload(asSent, SECRET);
  const asParsed: Record<string, unknown> = {
    order_id: 'enr-1',
    amount: 250,
    sign: signature
  };
  assert.equal(verifySignature(asParsed, SECRET), true);
});

test('form-encoded and JSON bodies parse to the same shape', () => {
  const form = parseWebhookBody(
    'order_id=enr-1&amount=250&status=1',
    'application/x-www-form-urlencoded'
  );
  assert.equal(form.order_id, 'enr-1');
  assert.equal(form.amount, '250');

  const json = parseWebhookBody(
    '{"order_id":"enr-1","amount":"250","status":"1"}',
    'application/json'
  );
  assert.equal(json.order_id, 'enr-1');
});

test('an unparseable body yields no fields rather than throwing', () => {
  assert.deepEqual(parseWebhookBody('not json', 'application/json'), {});
});
