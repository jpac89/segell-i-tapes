import {groups, matchesCategory, openingHours, isOpen, distanceBetween, findAddresses} from './catalog.mjs';

const get = id => document.getElementById(id);
const defaultCentre = '612';
const timezone = 'Europe/Madrid';
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const kindNames = {bar: 'Bar', restaurant: 'Restaurant', cafe: 'Cafè'};
const number = new Intl.NumberFormat('ca', {maximumFractionDigits: 1});
const rating = new Intl.NumberFormat('ca', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const timeFormat = new Intl.DateTimeFormat('ca', {hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: timezone});
let centres, places, addressIndex, privateOrigin, locationRequest;
let category = 'all';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(url, text, label) {
  const node = element('a', '', text);
  node.href = url;
  if (label) node.setAttribute('aria-label', label);
  if (url.startsWith('https:')) {
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
  }
  return node;
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function walkLink(place, centre) {
  const params = new URLSearchParams({api: '1', destination: `${place.name}, ${place.address}, Barcelona`, travelmode: 'walking'});
  if (centre) params.set('origin', centre.id === defaultCentre ? 'Carrer de Calàbria, 66, Barcelona' : `${centre.address}, Barcelona`);
  return 'https://www.google.com/maps/dir/?' + params;
}

function mapsLink(place) {
  if (!/^(?:0x[0-9a-f]+|[0-9]+)$/i.test(place.cid ?? '')) return null;
  return 'https://www.google.com/maps?cid=' + BigInt(place.cid).toString();
}

function card(place, day, selectedTime, centre) {
  const article = element('article', 'card');
  const top = element('div', 'card-top');
  const distance = place.meters < 1000 ? `${place.meters} m` : `${number.format(place.meters / 1000)} km`;
  top.append(element('span', 'kind', kindNames[place.type] || 'Establiment'),
    element('span', 'distance', place.minutes === null ? 'Distància desconeguda'
      : centre?.id === defaultCentre && !place.approximate
        ? `${place.minutes} min a peu · ${distance}`
        : `${place.minutes} min a peu aprox.`));
  article.append(top, element('h3', '', place.name), element('p', 'address', place.address));

  const open = isOpen(place, day, selectedTime);
  const pills = element('div', 'pills');
  pills.append(element('span', 'pill ' + (open === null ? 'unconfirmed' : open ? 'open' : 'closed'),
    open === null ? 'Horari pendent de verificar' : `${open ? 'Obert' : 'Tancat'} a les ${selectedTime}`));
  pills.append(element('span', 'pill ' + (place.confirmed ? 'confirmed' : 'unconfirmed'),
    place.confirmed ? 'Pràctica CPNL' : 'VxL · segell pendent de verificar'));
  article.append(pills);

  const googleMaps = mapsLink(place);
  if (open !== null) {
    const hours = openingHours(place, day).map(([from, to]) => `${from}–${to}`).join(' · ') || 'Sense obertura prevista';
    const line = element('p', 'hours', 'Horari habitual · ');
    const source = /^https:\/\//i.test(place.hoursUrl ?? '') ? place.hoursUrl : googleMaps;
    line.append(source ? link(source, hours, `Horari de ${place.name}: ${hours}`) : hours);
    article.append(line);
  }

  const actions = element('div', 'actions');
  actions.append(link(walkLink(place, centre), 'Ruta a peu ↗', `Ruta a peu a ${place.name}`));
  if (googleMaps && Number.isFinite(place.rating) && Number.isFinite(place.reviews)) {
    const reviews = `${rating.format(place.rating)} (${number.format(place.reviews)}) · Google`;
    actions.append(link(googleMaps, reviews, `${reviews}, ressenyes de ${place.name}`));
  }
  if (place.phone) actions.append(link('tel:+34' + place.phone, 'Truca', `Truca a ${place.name}`));
  article.append(actions);
  if (place.verifiedAt) article.append(element('p', 'verified', `Fitxa revisada el ${place.verifiedAt.split('-').reverse().join('/')}`));
  return article;
}

function setCategory(value) {
  category = value;
  for (const button of get('categories').children) {
    button.setAttribute('aria-pressed', String(button.dataset.category === value));
  }
  get('sector').value = Array.from(get('sector').options).some(option => option.value === value) ? value : '';
}

function restoreFilters() {
  const params = new URLSearchParams(location.search);
  for (const id of ['centre', 'day', 'radius', 'sort']) {
    const control = get(id);
    if (Array.from(control.options).some(option => option.value === params.get(id))) control.value = params.get(id);
  }
  if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(params.get('time') || '')) get('time').value = params.get('time');
  for (const id of ['open', 'confirmed']) get(id + '-only').checked = params.get(id) === '1';
  const valid = [...Array.from(get('categories').children, button => button.dataset.category),
    ...Array.from(get('sector').options, option => option.value)].filter(Boolean);
  setCategory(valid.includes(params.get('cat')) ? params.get('cat') : 'all');
}

function saveFilters() {
  const url = new URL(location.href);
  url.search = '';
  const defaults = {centre: defaultCentre, day: 'today', time: '20:00', radius: '20', sort: 'distance'};
  for (const [id, initial] of Object.entries(defaults)) {
    if (get(id).value && get(id).value !== initial) url.searchParams.set(id, get(id).value);
  }
  if (category !== 'all') url.searchParams.set('cat', category);
  for (const id of ['open', 'confirmed']) if (get(id + '-only').checked) url.searchParams.set(id, '1');
  history.replaceState(null, '', url);
}

function render() {
  saveFilters();
  const now = new Date();
  const day = get('day').value === 'today'
    ? weekdays.indexOf(new Intl.DateTimeFormat('en', {weekday: 'long', timeZone: timezone}).format(now))
    : Number(get('day').value);
  const time = get('time').value || '20:00';
  const centre = centres.find(item => item.id === get('centre').value);
  const usePrivate = get('origin-mode').value !== 'centre' && privateOrigin;
  const origin = usePrivate || centre;
  get('search-origin').textContent = `Punt de partida · ${origin.address}`;
  get('visit-date').textContent = get('day').value === 'today'
    ? new Intl.DateTimeFormat('ca', {dateStyle: 'full', timeZone: timezone}).format(now)
    : get('day').selectedOptions[0].textContent;
  const limit = get('radius').value === 'all' ? Infinity : Number(get('radius').value);
  const activeCentre = usePrivate ? null : centre;
  const visible = places.filter(place => matchesCategory(place, category)
    && (!get('open-only').checked || isOpen(place, day, time) === true)
    && (!get('confirmed-only').checked || place.confirmed)).map(place => {
    if (activeCentre?.id === defaultCentre && Number.isFinite(place.minutes)) return place;
    if (!place.coordinates) return {...place, meters: null, minutes: null};
    const meters = Math.round(distanceBetween(origin.coordinates, place.coordinates) * 1.3);
    return {...place, meters, minutes: Math.max(1, Math.ceil(meters / 75)), approximate: true};
  }).filter(place => place.minutes === null ? limit === Infinity : place.minutes <= limit);
  const proximity = (a, b) => (a.meters ?? Infinity) - (b.meters ?? Infinity) || a.name.localeCompare(b.name, 'ca');
  const eligible = visible.filter(place => place.confirmed && isOpen(place, day, time)).sort(proximity)[0];
  visible.sort(get('sort').value === 'rating' ? (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || proximity(a, b) : proximity);

  const headline = eligible ? `A les ${time}, ${eligible.name} consta obert i és a la llista de pràctiques.`
    : `A les ${time}, cap resultat de la llista de pràctiques consta obert.`;
  get('highlight').replaceChildren(element('p', '', headline));
  if (eligible) get('highlight').append(link(walkLink(eligible, activeCentre), 'Com arribar-hi ↗'));
  get('count').textContent = `${visible.length} ${visible.length === 1 ? 'lloc' : 'llocs'}`;
  get('cards').replaceChildren(...visible.map(place => card(place, day, time, activeCentre)));
  if (!visible.length) {
    const empty = element('div', 'empty');
    const reset = element('button', '', 'Mostra tots els locals');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      setCategory('all');
      get('radius').value = 'all';
      get('open-only').checked = get('confirmed-only').checked = false;
      render();
      get('results-title').focus();
    });
    empty.append(element('p', '', 'No hi ha locals amb aquests filtres al catàleg actual.'), reset);
    get('cards').append(empty);
  }
}

function setupOrigins() {
  get('origin-mode').addEventListener('change', () => {
    const mode = get('origin-mode').value;
    for (const key of ['centre', 'location', 'address']) get(key + '-controls').hidden = mode !== key;
    privateOrigin = null;
    locationRequest = null;
    get('locate').disabled = false;
    get('address-matches').replaceChildren();
    get('street').value = get('number').value = '';
    get('origin-status').textContent = mode === 'centre' ? '' : 'Es manté el centre fins que confirmis un altre punt.';
    render();
  });
  get('locate').addEventListener('click', () => {
    const status = get('origin-status');
    if (!navigator.geolocation) {
      status.textContent = 'Aquest navegador no permet obtenir la ubicació. Prova amb una adreça.';
      return;
    }
    const request = Symbol();
    locationRequest = request;
    get('locate').disabled = true;
    status.textContent = 'S’està cercant la ubicació…';
    const finish = message => {
      get('locate').disabled = false;
      status.textContent = message;
    };
    navigator.geolocation.getCurrentPosition(({coords}) => {
      if (locationRequest !== request) return;
      privateOrigin = {address: 'Ubicació aproximada', coordinates: [coords.latitude, coords.longitude].map(x => Number(x.toFixed(3)))};
      finish('Ubicació aplicada només en aquest dispositiu.');
      render();
    }, () => {
      if (locationRequest === request) finish('No s’ha pogut obtenir la ubicació. Prova amb una adreça o un centre.');
    }, {timeout: 10000, maximumAge: 60000, enableHighAccuracy: false});
  });
  get('address-controls').addEventListener('submit', async event => {
    event.preventDefault();
    const status = get('origin-status');
    const output = get('address-matches');
    const submit = event.submitter;
    submit.disabled = true;
    output.replaceChildren();
    const street = get('street').value;
    const portal = get('number').value;
    status.textContent = 'S’està cercant l’adreça…';
    try {
      addressIndex ??= await loadJson('./data/addresses.json');
      if (get('origin-mode').value !== 'address' || street !== get('street').value || portal !== get('number').value) return;
      const matches = findAddresses(addressIndex, street, portal);
      if (!matches.length) {
        status.textContent = 'No s’ha trobat l’adreça. Revisa el carrer i el número.';
      } else if (matches.length === 1) {
        privateOrigin = matches[0];
        status.textContent = 'Adreça aplicada només en aquest dispositiu.';
        render();
      } else {
        status.textContent = matches.length > 8 ? 'Hi ha massa coincidències. Escriu un nom més complet.' : 'Tria una de les adreces.';
        for (const match of matches.length > 8 ? [] : matches) {
          const button = element('button', '', match.address);
          button.type = 'button';
          button.addEventListener('click', () => {
            privateOrigin = match;
            output.replaceChildren();
            status.textContent = 'Adreça aplicada només en aquest dispositiu.';
            get('street').focus();
            render();
          });
          output.append(button);
        }
      }
    } catch {
      if (get('origin-mode').value === 'address') status.textContent = 'No s’ha pogut carregar el cercador d’adreces. Torna-ho a provar.';
    } finally {
      submit.disabled = false;
    }
  });
}

async function initialize() {
  try {
    [centres, places] = await Promise.all([loadJson('./data/centres.json'), loadJson('./data/places.json')]);
  } catch {
    get('count').textContent = 'No s’ha pogut carregar el catàleg. Torna a carregar la pàgina.';
    return;
  }
  const ordered = centres.slice().sort((a, b) => (b.id === defaultCentre) - (a.id === defaultCentre) || a.name.localeCompare(b.name, 'ca'));
  for (const centre of ordered) get('centre').add(new Option(centre.name, centre.id));
  for (const [key, label, sectors] of groups) {
    const group = element('optgroup');
    group.label = label;
    group.append(new Option(`Tot el grup · ${label}`, key));
    for (const [id, name] of sectors) group.append(new Option(name, `sector-${id}`));
    get('sector').append(group);
  }

  restoreFilters();
  get('categories').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    setCategory(button.dataset.category);
    render();
  });
  get('sector').addEventListener('change', () => {
    setCategory(get('sector').value || 'all');
    render();
  });
  for (const id of ['centre', 'day', 'time', 'radius', 'open-only', 'confirmed-only', 'sort']) {
    get(id).addEventListener('change', render);
  }
  get('now').addEventListener('click', () => {
    get('day').value = 'today';
    get('time').value = timeFormat.format(new Date());
    render();
  });
  setupOrigins();
  render();
}

const mobile = matchMedia('(max-width: 740px)');
function filters(open) {
  get('filter-toggle').setAttribute('aria-expanded', String(open));
  get('filters-panel').hidden = !open;
}
filters(!mobile.matches);
mobile.addEventListener('change', event => filters(!event.matches));
get('filter-toggle').addEventListener('click', () => filters(get('filters-panel').hidden));
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const results = get('results-title');
  results.focus();
  results.scrollIntoView();
});
const shareButton = document.querySelector('#share');
const shareStatus = document.querySelector('#share-status');
const shareManual = document.querySelector('#share-manual');
const shareUrl = document.querySelector('#share-url');
shareButton.addEventListener('click', async () => {
  if (shareButton.getAttribute('aria-busy') === 'true') return;
  const url = location.protocol === 'file:'
    ? 'https://jpac89.github.io/segell-i-tapes/'
    : location.href;

  shareButton.setAttribute('aria-busy', 'true');
  shareStatus.textContent = '';
  shareManual.hidden = true;
  try {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({title: document.title, url});
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      shareStatus.textContent = 'Enllaç copiat.';
    } catch {
      shareUrl.value = url;
      shareManual.hidden = false;
      shareUrl.focus();
      shareUrl.select();
    }
  } finally {
    shareButton.removeAttribute('aria-busy');
  }
});

initialize();
