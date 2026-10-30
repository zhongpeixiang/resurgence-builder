import { confirmedMechanics } from './data/confirmed-mechanics.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const sourceLink = source => {
  let valid = false;
  try { valid = new URL(source.url).protocol === 'https:'; } catch { /* Invalid source URLs are not linked. */ }
  return valid ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a>` : escapeHtml(source.title);
};

export function renderMechanicsGuide(records = confirmedMechanics) {
  return `<section class="mechanics-guide" id="mechanics-guide" aria-labelledby="mechanics-guide-title">
    <header class="mechanics-guide__header"><div><p class="mechanics-guide__eyebrow">BUILD KNOWLEDGE</p><h2 id="mechanics-guide-title">Mechanics worth knowing</h2></div><span class="mechanics-guide__badge">Source-checked</span></header>
    <p class="mechanics-guide__intro">Qualitative guidance only, cross-checked with Ubisoft publications and community guides. No balance formulas or numerical bonuses are inferred from the client.</p>
    <div class="mechanics-guide__grid">${records.map(record => `<article class="mechanics-guide__card" id="mechanic-${escapeHtml(record.id)}">
      <h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.body)}</p>
      <details><summary>Sources &amp; verification</summary><p class="mechanics-guide__meta">Checked ${escapeHtml(record.checkedOn)}. Client ${escapeHtml(record.clientEvidence.version)} text corroborated with published sources; not independently gameplay-tested. Historical sources are dated below. No quantities or formulas verified.</p><ul>${record.sources.map(source => `<li>${sourceLink(source)}</li>`).join('')}</ul></details>
    </article>`).join('')}</div>
  </section>`;
}

if (typeof document !== 'undefined') {
  for (const mount of document.querySelectorAll('[data-mechanics-guide]')) mount.innerHTML = renderMechanicsGuide();
  // The Build Lab stores shared loadouts in the URL hash; anchor navigation must not erase it.
  if (location.pathname.endsWith('/builder.html')) {
    for (const link of document.querySelectorAll('a[href="#mechanics-guide"]')) {
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const guide = document.getElementById('mechanics-guide');
        if (!guide) return;
        event.preventDefault();
        guide.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }
  }
}
