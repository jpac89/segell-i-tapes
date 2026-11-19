import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {distanceBetween, findAddresses, groups, isOpen, matchesCategory, openingHours} from '../catalog.mjs';

test('opening hours support midnight, overnight and unknown values', () => {
  const place = {hoursStatus: 'verified', hours: [[['20:00', '24:00']], [], [], [], [], [], [['22:00', '02:00']]]};
  assert.equal(isOpen(place, 0, '23:59'), true);
  assert.equal(isOpen(place, 0, '00:00'), true);
  assert.equal(isOpen(place, 0, '02:00'), false);
  assert.deepEqual(openingHours(place, 0), [['00:00', '02:00'], ['20:00', '24:00']]);
  assert.equal(isOpen(place, 1, '00:00'), false);
  assert.equal(isOpen({...place, hoursStatus: 'unknown'}, 3, '22:00'), null);
});

test('the approved groups include all 27 raw VxL sectors and both general commerce IDs', () => {
  const ids = groups.flatMap(([, , sectors]) => sectors.flatMap(([id, , alias]) => alias ? [id, alias] : [id]));
  assert.equal(new Set(ids).size, 27);
  assert.equal(matchesCategory({sector: 365}, 'sector-377'), true);
  assert.equal(matchesCategory({sector: 377}, 'shopping'), true);
  assert.equal(matchesCategory({sector: 244}, 'culture'), false);
  assert.equal(matchesCategory({}, 'culture'), false);
});

test('the local index resolves an accented street without accents and respects its number', () => {
  const index = JSON.parse(readFileSync(new URL('../data/addresses.json', import.meta.url)));
  const [result] = findAddresses(index, 'calabria', '0066');
  assert.equal(result.address, 'Carrer de Calàbria, 66');
  assert.equal(distanceBetween(result.coordinates, result.coordinates), 0);
  assert.deepEqual(findAddresses(index, 'inexistent', '66'), []);
});
