import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  flattenMessages,
  placeholdersIn,
  placeholdersMatch,
  setByPath,
  type MessageTree
} from './message-tree.ts';

/**
 * These four functions stand between an admin typing in a box and every
 * page on the site rendering. A round trip that loses an array turns the
 * FAQ into nothing; a placeholder check that passes a broken string takes
 * the page down at request time, in production, for the reader rather than
 * the editor. Hence the tests.
 *
 * Run with: npm test
 */

const catalogue: MessageTree = {
  home: {
    heroTitle: 'Обратный лес',
    months: '{count, plural, one {# месяц} other {# месяцев}}'
  },
  register: {
    agreement: 'Я принимаю <terms>условия</terms> и <privacy>политику</privacy>'
  },
  faq: {
    items: [
      { q: 'Первый вопрос', a: 'Первый ответ' },
      { q: 'Второй вопрос', a: 'Второй ответ' }
    ]
  }
};

test('nested objects flatten to dotted keys', () => {
  const flat = flattenMessages(catalogue);
  assert.equal(flat['home.heroTitle'], 'Обратный лес');
  assert.equal(flat['register.agreement'], catalogue.register!['agreement']);
});

test('array items flatten to indexed keys', () => {
  const flat = flattenMessages(catalogue);
  assert.equal(flat['faq.items.0.q'], 'Первый вопрос');
  assert.equal(flat['faq.items.1.a'], 'Второй ответ');
});

test('every leaf is a string and nothing else appears', () => {
  const flat = flattenMessages(catalogue);
  assert.equal(Object.keys(flat).length, 7);
  for (const value of Object.values(flat)) {
    assert.equal(typeof value, 'string');
  }
});

test('setByPath overwrites a plain key', () => {
  const tree = structuredClone(catalogue);
  setByPath(tree, 'home.heroTitle', 'Новый заголовок');
  assert.equal((tree.home as Record<string, string>).heroTitle, 'Новый заголовок');
});

test('setByPath keeps arrays as arrays', () => {
  const tree = structuredClone(catalogue);
  setByPath(tree, 'faq.items.1.q', 'Изменённый вопрос');

  const items = (tree.faq as Record<string, unknown>).items;
  // The FAQ page reads this with t.raw() and iterates it. Turning it into
  // { '1': … } would render an empty list, silently.
  assert.ok(Array.isArray(items), 'faq.items must stay an array');
  assert.equal((items as { q: string }[])[1]!.q, 'Изменённый вопрос');
  assert.equal((items as { q: string }[])[0]!.q, 'Первый вопрос');
});

test('setByPath creates an array when the next segment is numeric', () => {
  const tree: MessageTree = {};
  setByPath(tree, 'a.b.0.c', 'x');
  const b = (tree.a as Record<string, unknown>).b;
  assert.ok(Array.isArray(b));
});

test('a flatten/set round trip reproduces the catalogue', () => {
  const flat = flattenMessages(catalogue);
  const rebuilt: MessageTree = {};
  for (const [key, value] of Object.entries(flat)) setByPath(rebuilt, key, value);
  assert.deepEqual(rebuilt, catalogue);
});

test('ICU placeholders are detected', () => {
  assert.deepEqual(placeholdersIn('{count} of {total}'), ['{count}', '{total}']);
});

test('a plural form is reduced to its variable name', () => {
  assert.deepEqual(
    placeholdersIn('{count, plural, one {# месяц} other {# месяцев}}'),
    ['{count}']
  );
});

test('rich-text tags are detected', () => {
  assert.deepEqual(placeholdersIn('a <terms>b</terms> c <privacy>d</privacy>'), [
    '<privacy>',
    '<terms>'
  ]);
});

test('a translation that keeps its placeholders passes', () => {
  assert.equal(
    placeholdersMatch('Showing {shown} of {total}', 'Из {total} показано {shown}'),
    true
  );
});

test('a translation that drops a placeholder is rejected', () => {
  assert.equal(
    placeholdersMatch('Showing {shown} of {total}', 'Показано несколько'),
    false
  );
});

test('a translation that drops a rich tag is rejected', () => {
  assert.equal(
    placeholdersMatch('I accept the <terms>terms</terms>', 'I accept the terms'),
    false
  );
});

test('editing only the words around a placeholder is allowed', () => {
  assert.equal(placeholdersMatch('{count} месяц', 'всего {count}'), true);
});
