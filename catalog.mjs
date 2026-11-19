export const groups = [
  ['food', 'Menjar i beure', [[67, 'Alimentació'], [244, 'Restauració i hoteleria']]],
  ['shopping', 'Compres', [[377, 'Comerç generalista', 365], [367, 'Equipament de la llar'], [250, 'Roba i complements']]],
  ['culture', 'Cultura, lleure i aprenentatge', [[229, 'Cultura i oci (museus, teatre, cinema, música, viatges...)'], [42, 'Educació i formació'], [219, 'Associacions culturals'], [265, 'Associacions d’ensenyament (AMPA, etc.)'], [103, 'Entitats i clubs esportius'], [41, 'Mitjans de comunicació']]],
  ['health', 'Salut i benestar', [[248, 'Estètica i salut'], [131, 'Sanitat']]],
  ['mobility', 'Mobilitat', [[371, 'Automoció'], [399, 'Transports']]],
  ['services', 'Serveis i tràmits', [[3, 'Administracions'], [16, 'Altres comerços i empreses de serveis'], [395, 'Bancs, assegurances i mútues'], [356, 'Construcció i indústria'], [393, 'Informàtica i internet']]],
  ['community', 'Entitats i comunitat', [[19, 'Altres associacions'], [266, 'Associacions cíviques i socials'], [271, 'Associacions econòmiques i professionals'], [128, 'Entitats i centres religiosos i confessionals'], [274, 'Entitats LGBTIQ+'], [74, 'Fundacions']]],
];

export function matchesCategory(place, category) {
  if (category === 'all') return true;
  return groups.some(([key, , sectors]) => sectors.some(([id, , alias]) =>
    (category === key || category === `sector-${id}`)
    && (place.sector === id || (alias !== undefined && place.sector === alias))
  ));
}

export function openingHours(place, day) {
  if (place.hoursStatus !== 'verified') return null;
  const overnight = place.hours[(day + 6) % 7]
    .filter(([start, end]) => start > end && end !== '00:00')
    .map(([, end]) => ['00:00', end]);
  return [...overnight, ...place.hours[day]];
}

export function isOpen(place, day, time) {
  const hours = openingHours(place, day);
  if (!hours) return null;
  return hours.some(([start, end]) => start <= time && (start > end || time < end));
}

export function distanceBetween([latA, lngA], [latB, lngB]) {
  const radians = degrees => degrees * Math.PI / 180;
  const a = Math.sin(radians(latB - latA) / 2) ** 2
    + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(radians(lngB - lngA) / 2) ** 2;
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function normalize(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function findAddresses(index, street, number) {
  const query = normalize(street);
  const portal = number.trim().toLowerCase().replace(/\s+/g, '').replace(/^0+(?=\d)/, '');
  if (!query || !/^\d+[a-z]?$/.test(portal)) return [];
  const matches = index.filter(([label, name, portals]) =>
    Object.hasOwn(portals, portal)
    && (normalize(label).includes(query) || normalize(name).includes(query))
  );
  const exact = matches.filter(([label, name]) => [label, name].some(value => normalize(value) === query));
  return (exact.length ? exact : matches).map(([label, , portals]) => ({
    address: `${label}, ${portal}`, coordinates: portals[portal],
  }));
}
