export const catalog = [
  { id: 'famas', name: 'FAMAS 2010', type: 'Assault rifle', rarity: 'High-end', score: 82, damage: '27.4k', rpm: '900', tags: ['RPM', 'Crit'] },
  { id: 'acr-e', name: 'ACR-E', type: 'Assault rifle', rarity: 'High-end', score: 78, damage: '35.1k', rpm: '650', tags: ['Stable', 'Crit'] },
  { id: 'm870', name: 'M870', type: 'Shotgun', rarity: 'Superior', score: 61, damage: '180k', rpm: '85', tags: ['Close range'] },
  { id: 'vector', name: 'Vector SBR .45', type: 'SMG', rarity: 'High-end', score: 74, damage: '21.2k', rpm: '1200', tags: ['RPM', 'Status'] },
  { id: 'coyote', name: "Coyote's Mask", type: 'Gear', rarity: 'Exotic', score: 88, damage: '+18%', rpm: '—', tags: ['Crit', 'Group'] },
  { id: 'striker', name: "Striker's Battlegear", type: 'Gear', rarity: 'High-end', score: 79, damage: '+15%', rpm: '—', tags: ['Weapon damage'] }
];

export function filterItems(items, { type = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter(item => (type === 'All' || item.type === type) &&
    (!needle || `${item.name} ${item.type} ${item.tags.join(' ')}`.toLowerCase().includes(needle)));
}

export function calculateBuild(items, loadout) {
  const equipped = Object.values(loadout).map(id => items.find(item => item.id === id)).filter(Boolean);
  return { score: equipped.reduce((sum, item) => sum + item.score, 0), complete: Object.values(loadout).every(Boolean), equipped };
}

if (typeof document !== 'undefined') {
  const state = { type: 'All', query: '', loadout: { primary: 'famas', secondary: 'm870', gear: 'coyote' } };
  const $ = selector => document.querySelector(selector);
  const items = $('#item-list');
  const resultCount = $('#result-count');
  const buildScore = $('#build-score');
  const buildStatus = $('#build-status');

  const label = item => `<span class="tag">${item.rarity}</span><span class="tag ghost">${item.type}</span>`;
  function renderDatabase() {
    const visible = filterItems(catalog, state);
    resultCount.textContent = `${visible.length} records`;
    items.innerHTML = visible.map(item => `<article class="item-card"><div><p class="eyebrow">${label(item)}</p><h3>${item.name}</h3><p class="tags">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</p></div><dl><div><dt>Damage</dt><dd>${item.damage}</dd></div><div><dt>RPM</dt><dd>${item.rpm}</dd></div><div><dt>Rating</dt><dd>${item.score}</dd></div></dl><button class="add" data-item="${item.id}" aria-label="Equip ${item.name}">Equip</button></article>`).join('') || '<p class="empty">No equipment matches this search.</p>';
  }
  function renderBuild() {
    for (const [slot, id] of Object.entries(state.loadout)) {
      const item = catalog.find(entry => entry.id === id);
      $(`[data-slot="${slot}"]`).innerHTML = item ? `<span>${item.name}</span><small>${item.type} · ${item.score} rating</small>` : '<span>Empty slot</span><small>Select an item from the database</small>';
    }
    const summary = calculateBuild(catalog, state.loadout);
    buildScore.textContent = summary.score;
    buildStatus.textContent = summary.complete ? 'Loadout ready' : 'Loadout incomplete';
  }
  $('#search').addEventListener('input', event => { state.query = event.target.value; renderDatabase(); });
  $('#filter-type').addEventListener('change', event => { state.type = event.target.value; renderDatabase(); });
  items.addEventListener('click', event => {
    const id = event.target.dataset.item;
    if (!id) return;
    const item = catalog.find(entry => entry.id === id);
    const slot = item.type === 'Gear' ? 'gear' : !state.loadout.primary ? 'primary' : 'secondary';
    state.loadout[slot] = id;
    renderBuild();
  });
  document.querySelectorAll('.slot').forEach(button => button.addEventListener('click', () => {
    const slot = button.dataset.slot;
    state.loadout[slot] = '';
    renderBuild();
  }));
  renderDatabase(); renderBuild();
}
