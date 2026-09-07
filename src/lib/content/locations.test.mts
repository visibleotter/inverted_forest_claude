import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { contentPlaces, groupKeys, placeFor, resolvePath } from './locations.ts';
import { flattenMessages } from './message-tree.ts';

/**
 * The site map is hand-written, and the catalogue it describes is not.
 *
 * That is a drift risk with a quiet failure mode: rename a key and its
 * section silently empties, while the key itself reappears at the bottom
 * under "everything else" — still editable, but no longer next to the
 * strings it shares a page with. Nobody would notice for months.
 *
 * So the tests here compare the map against the real catalogue rather
 * than against a fixture.
 *
 * Run with: npm test
 */

const require = createRequire(import.meta.url);
const ru = require('../../messages/ru.json') as Record<string, unknown>;

const flat = flattenMessages(ru);
const allKeys = Object.keys(flat);

const labelsOf = (namespace: string) =>
  allKeys
    .filter((key) => key.startsWith(`${namespace}.`))
    .map((key) => key.slice(namespace.length + 1));

test('every mapped namespace still exists in the catalogue', () => {
  for (const place of contentPlaces) {
    assert.ok(
      labelsOf(place.namespace).length > 0,
      `${place.namespace} is on the map but has no strings`
    );
  }
});

test('no key is lost or duplicated by grouping', () => {
  for (const place of contentPlaces) {
    const labels = labelsOf(place.namespace);
    const grouped = groupKeys(place.namespace, labels).flatMap((g) => g.keys);
    assert.deepEqual(
      [...grouped].sort(),
      [...labels].sort(),
      `${place.namespace} lost or duplicated keys`
    );
  }
});

test('an unmapped namespace still yields every one of its keys', () => {
  const groups = groupKeys('nonexistent', ['a', 'b']);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0]!.keys, ['a', 'b']);
});

test('every section matches at least one key', () => {
  // An empty section means a key was renamed and the map was not told.
  for (const place of contentPlaces) {
    const grouped = groupKeys(place.namespace, labelsOf(place.namespace));
    for (const section of place.sections) {
      assert.ok(
        grouped.some((group) => group.id === section.id),
        `${place.namespace}/${section.id} matches nothing`
      );
    }
  }
});

test('nothing falls through to "everything else"', () => {
  // Not a correctness requirement — the fallback exists precisely so new
  // strings stay editable. It is a nudge: when this fails, a string was
  // added and deserves a place on the map.
  const stray = contentPlaces.flatMap((place) =>
    groupKeys(place.namespace, labelsOf(place.namespace))
      .filter((group) => group.id === 'other')
      .flatMap((group) => group.keys.map((key) => `${place.namespace}.${key}`))
  );
  assert.deepEqual(stray, [], 'unplaced strings');
});

test('sections come back in map order', () => {
  const place = placeFor('home')!;
  const ids = groupKeys('home', labelsOf('home')).map((group) => group.id);
  assert.deepEqual(ids, place.sections.map((section) => section.id));
});

test('a path with no course to fill it in yields no link', () => {
  const course = placeFor('course');
  assert.equal(resolvePath(course, {}), undefined);
  assert.equal(resolvePath(course, { slug: 'ancient-greece' }), '/courses/ancient-greece');
  assert.equal(resolvePath(placeFor('about'), {}), '/about');
  assert.equal(resolvePath(placeFor('meta'), {}), undefined);
});
