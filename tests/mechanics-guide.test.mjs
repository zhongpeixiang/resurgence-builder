import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataUrl = new URL('../data/confirmed-mechanics.js', import.meta.url);

test('UI guidance includes only three corroborated qualitative mechanics, not client balance guesses', async () => {
  assert.ok(fs.existsSync(dataUrl), 'source-checked mechanics dataset is missing');
  const { confirmedMechanics } = await import(dataUrl);
  assert.deepEqual(confirmedMechanics.map(row => row.id), ['armory-proficiency', 'armor-weaknesses', 'specialization-xp']);
  for (const row of confirmedMechanics) {
    assert.equal(row.status, 'source-checked-qualitative');
    assert.equal(row.notForCalculations, true);
    assert.ok(row.sources.length >= 2);
    assert.ok(row.sources.some(source => source.kind === 'official'));
    assert.ok(row.sources.some(source => source.kind === 'community-guide'));
    assert.ok(row.sources.every(source => source.url.startsWith('https://') && source.excerpt && source.title));
  }
  assert.doesNotMatch(confirmedMechanics.map(row => row.body).join(' '), /\d|%|periodically|chance|multiplier/i);
});

test('mechanics guide renders accessible, sourced cards and escapes displayed content', async () => {
  const moduleUrl = new URL('../mechanics-guide.js', import.meta.url);
  assert.ok(fs.existsSync(moduleUrl), 'mechanics guide renderer is missing');
  const { renderMechanicsGuide } = await import(moduleUrl);
  const { confirmedMechanics } = await import(dataUrl);
  const html = renderMechanicsGuide(confirmedMechanics);
  assert.equal((html.match(/class="mechanics-guide__card"/g) ?? []).length, 3);
  assert.match(html, /aria-labelledby="mechanics-guide-title"/);
  assert.match(html, /Source-checked/);
  assert.match(html, /Qualitative guidance only/);
  assert.match(html, /Sources &amp; verification/);
  for (const row of confirmedMechanics) {
    assert.ok(html.includes(row.title));
    for (const source of row.sources) assert.ok(html.includes(source.url));
  }
  const unsafe = structuredClone(confirmedMechanics);
  unsafe[0].title = '<img src=x onerror=alert(1)>';
  unsafe[0].body = '<script>alert(1)</script>';
  unsafe[0].sources[0].url = 'javascript:alert(1)';
  const safe = renderMechanicsGuide(unsafe);
  assert.doesNotMatch(safe, /<script>|<img|href="javascript:/);
  assert.match(safe, /&lt;img/);
});

test('database and Build Lab expose the same guide without changing calculation modules', () => {
  for (const file of ['index.html', 'builder.html']) {
    const html = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /data-mechanics-guide/, `${file} needs a visible guide mount`);
    assert.match(html, /href="mechanics-guide\.css"/);
    assert.match(html, /type="module" src="mechanics-guide\.js"/);
    assert.match(html, /href="#mechanics-guide">Mechanics<\/a>/);
  }
  const builder = fs.readFileSync(new URL('../builder.html', import.meta.url), 'utf8');
  assert.doesNotMatch(builder, /Every entry is checked manually against the live game client/);
  const css = fs.readFileSync(new URL('../mechanics-guide.css', import.meta.url), 'utf8');
  assert.match(css, /@media/);
  assert.match(css, /focus-visible/);
});

test('Build Lab guide navigation scrolls without overwriting the shareable loadout hash', async () => {
  const previousDocument = globalThis.document;
  const previousLocation = globalThis.location;
  let listener;
  const scrolls = [];
  const guide = { scrollIntoView: options => scrolls.push(options) };
  globalThis.document = {
    querySelectorAll: selector => selector === '[data-mechanics-guide]' ? [] : [{ addEventListener: (name, callback) => { assert.equal(name, 'click'); listener = callback; } }],
    getElementById: id => id === 'mechanics-guide' ? guide : null,
  };
  globalThis.location = { pathname: '/resurgence-builder/builder.html', hash: '#s=Vanguard&sc=Commando' };
  try {
    await import(new URL('../mechanics-guide.js?navigation-test', import.meta.url));
    let prevented = false;
    listener({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(scrolls, [{ behavior: 'auto', block: 'start' }]);
    assert.equal(globalThis.location.hash, '#s=Vanguard&sc=Commando');
    listener({ ctrlKey: true, preventDefault: () => assert.fail('modified clicks must keep native behavior') });
    assert.equal(scrolls.length, 1);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousLocation === undefined) delete globalThis.location; else globalThis.location = previousLocation;
  }
});
