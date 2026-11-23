import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeTelegramContact as norm } from './telegram-contact.ts';

/**
 * The Telegram field is the fallback when an invite link goes astray: the
 * admin finds the person by it and adds them by hand. Accepting junk here
 * means discovering, after payment, that the one way to reach someone is
 * unusable. Run with: npm test
 */

test('a username is accepted with or without @', () => {
  assert.equal(norm('galileantales'), '@galileantales');
  assert.equal(norm('@galileantales'), '@galileantales');
  assert.equal(norm('  @Some_Name1 '), '@Some_Name1');
});

test('a profile link becomes the username', () => {
  assert.equal(norm('https://t.me/galileantales'), '@galileantales');
  assert.equal(norm('t.me/galileantales/'), '@galileantales');
});

test('usernames Telegram would not allow are rejected', () => {
  assert.equal(norm('@abc'), null); // shorter than 5
  assert.equal(norm('@1abcde'), null); // starts with a digit
  assert.equal(norm('@имя_пользователя'), null);
  assert.equal(norm('t.me/+invitehash'), null);
});

test('Israeli numbers are normalised to +972', () => {
  assert.equal(norm('054-981-1838'), '+972549811838');
  assert.equal(norm('+972 54 981 1838'), '+972549811838');
  assert.equal(norm('972549811838'), '+972549811838');
  assert.equal(norm('(054) 981.1838'), '+972549811838');
});

test('foreign numbers with a plus keep their country code', () => {
  assert.equal(norm('+7 912 345-67-89'), '+79123456789');
});

test('empty and nonsense are rejected', () => {
  assert.equal(norm(''), null);
  assert.equal(norm('   '), null);
  assert.equal(norm('12345'), null);
  assert.equal(norm('call me'), null);
});
