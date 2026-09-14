import { databaseCatalog, slots, itemsForSlot, calculateBuild } from './app.js';
import { brandCatalog } from './data/brands.js';

const $ = s => document.querySelector(s);
const state = { name: '', query: '', loadout: Object.fromEntries(slots.map(slot => [slot, ''])) };
const gearSlots = new Set(['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask']);
const optionLabel = item => item ? `${item.name} — ${item.type === 'Gear' ? item.tier : item.type === 'Weapon' ? item.weaponClass : item.type === 'OS Protocol' ? item.core : item.type}` : 'Empty';
const itemFor = slot => databaseCatalog.find(x => x.id === state.loadout[slot]);
const firstSlotFor = item => item.type === 'Weapon' ? (!state.loadout['Primary Weapon'] ? 'Primary Weapon' : 'Secondary Weapon') : item.type === 'Specialization' ? 'Specialization' : item.type === 'OS Protocol' ? 'OS Protocol' : item.type === 'Gear' ? item.slot : null;

function renderSlots() {
  const out = slots.map(slot => {
    const current = itemFor(slot); const available = itemsForSlot(slot, state.loadout);
    const locked = slot.includes('Talent') && !available.length;
    return `<div class="local-slot ${current ? 'is-set' : ''}"><label>${slot}</label><b>${optionLabel(current)}</b><select data-slot="${slot}" ${locked ? 'disabled' : ''}><option value="">${locked ? 'Equip weapon first' : 'Select sourced record…'}</option>${available.map(x => `<option value="${x.id}" ${x.id === state.loadout[slot] ? 'selected' : ''}>${x.name}</option>`).join('')}</select></div>`;
  }).join('');
  $('#slots').innerHTML = out;
  $('#slots').querySelectorAll('select').forEach(el => el.addEventListener('change', event => { state.loadout[event.target.dataset.slot] = event.target.value; clearDependentTalents(event.target.dataset.slot); renderAll(); }));
}
function clearDependentTalents(slot) { if (slot === 'Primary Weapon' || slot === 'Secondary Weapon') for (const candidate of slots) if (candidate.startsWith(slot)) state.loadout[candidate] = ''; }
function renderPicker() {
  const needle = state.query.trim().toLowerCase();
  const shown = databaseCatalog.filter(x => !needle || [x.name, x.type, x.slot, x.weaponClass, x.core, x.talent, ...(x.brands ?? [])].join(' ').toLowerCase().includes(needle)).slice(0, 60);
  $('#picker-results').innerHTML = shown.map(x => `<button class="picker-item" data-id="${x.id}"><b>${x.name}</b><small>${x.type} · ${x.slot ?? x.weaponClass ?? x.core ?? ''}</small></button>`).join('') || '<p class="empty">No local records match.</p>';
  $('#picker-results').querySelectorAll('button').forEach(button => button.addEventListener('click', () => equipFromPicker(button.dataset.id)));
}
function equipFromPicker(id) { const item = databaseCatalog.find(x => x.id === id); const slot = firstSlotFor(item); if (!slot) return; state.loadout[slot] = id; clearDependentTalents(slot); renderAll(); }
function renderAnalysis() {
  const summary = calculateBuild(databaseCatalog, state.loadout); const count = summary.equipped.length; const gear = summary.equipped.filter(x => x.type === 'Gear'); const weapons = summary.equipped.filter(x => x.type === 'Weapon'); const percent = Math.round(count / slots.length * 100);
  $('#equipped-count').textContent = `${count} / ${slots.length} EQUIPPED`; $('#score').textContent = count ? percent : '—'; $('#meter').style.width = `${percent}%`;
  const grade = percent >= 85 ? 'LOADOUT READY' : percent >= 55 ? 'OPERATIONAL' : 'INCOMPLETE LOADOUT'; $('#grade').textContent = grade;
  $('#analysis').textContent = count ? `${gear.length} gear pieces, ${weapons.length} weapons, and ${count - gear.length - weapons.length} supporting records selected from this project’s local database.` : 'Select sourced records from the local project database to begin diagnostics.';
  const messages = []; if (!state.loadout.Specialization) messages.push(['warn', 'Select a specialization to establish a build focus.']); if (weapons.length && !state.loadout['Primary Weapon Talent 1']) messages.push(['warn', 'Choose compatible talent pools for the equipped primary weapon.']); if (!messages.length && count) messages.push(['ok', 'All selected records resolve from the local catalog.']);
  $('#diagnostics').innerHTML = messages.map(([kind, text]) => `<div class="diag ${kind}">${text}</div>`).join('');
}
function renderBonuses() {
  const counts = {}; for (const gear of slots.map(itemFor).filter(x => x?.type === 'Gear')) for (const brand of gear.brands) counts[brand] = (counts[brand] ?? 0) + 1;
  const active = Object.entries(counts).filter(([, count]) => count >= 2).map(([name, count]) => [brandCatalog.find(x => x.name === name), count]).filter(([brand]) => brand);
  $('#bonuses').innerHTML = active.length ? active.map(([brand, count]) => `<div class="bonus"><b>${brand.name} · ${count} pieces</b>${brand.bonuses.filter(x => Number(x.label.match(/\d+/)?.[0]) <= count).map(x => `<span>${x.label}: ${x.value}</span>`).join('')}</div>`).join('') : '<p class="empty">Equip 2+ pieces sharing a source brand to activate a detected bonus.</p>';
}
function saveHash() { const values = Object.fromEntries(Object.entries(state.loadout).filter(([, id]) => id)); history.replaceState(null, '', `#${encodeURIComponent(JSON.stringify({ n: state.name, l: values }))}`); }
function renderAll() { renderSlots(); renderPicker(); renderAnalysis(); renderBonuses(); saveHash(); }
function loadHash() { try { const saved = JSON.parse(decodeURIComponent(location.hash.slice(1))); state.name = saved.n ?? ''; Object.assign(state.loadout, saved.l ?? {}); } catch {} const equip = new URLSearchParams(location.search).get('equip'); if (equip) equipFromPicker(equip); }
$('#search').addEventListener('input', e => { state.query = e.target.value; renderPicker(); });
$('#build-name').addEventListener('input', e => { state.name = e.target.value; saveHash(); });
$('#reset').addEventListener('click', () => { state.name = ''; state.loadout = Object.fromEntries(slots.map(slot => [slot, ''])); $('#build-name').value = ''; renderAll(); });
$('#share').addEventListener('click', async () => { saveHash(); try { await navigator.clipboard.writeText(location.href); $('#share').textContent = 'Copied'; setTimeout(() => $('#share').textContent = 'Copy build link', 1200); } catch { location.hash = location.hash; } });
loadHash(); $('#build-name').value = state.name; renderAll();
