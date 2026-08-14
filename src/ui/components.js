// Shared display pieces used across several screens.

import { div, span, el, tag, meter, labelledMeter, titleCase } from './dom.js';
import { portrait } from './portrait.js';
import { AFFINITIES, affinityName } from '../data/affinities.js';
import { getSpecies, FEATURE_TAGS } from '../data/species.js';
import { STAT_KEYS, STAT_LABELS, colorToCss, PATTERN_ALLELES } from '../genetics/genome.js';
import { computeStats, personality, STAGE_INFO, xpForLevel } from '../core/kinbeast.js';

export function affinityTag(id) {
  const a = AFFINITIES[id];
  if (!a) return tag(id);
  return span(
    { class: 'tag affinity', style: { background: a.tint } },
    `${a.glyph} ${a.name}`
  );
}

export function affinityTags(beast) {
  return beast.phenotype.affinities.map(affinityTag);
}

export function vigorTag(beast) {
  const v = beast.vigor;
  const cls = v >= 78 ? 'good' : v >= 50 ? '' : 'bad';
  return tag(`Vigor ${v}`, cls);
}

export function stabilityTag(beast) {
  const s = beast.stability;
  const cls = s >= 75 ? 'good' : s >= 50 ? 'warn' : 'bad';
  return tag(`Stability ${s}`, cls);
}

/** A tappable roster row. */
export function beastRow(beast, opts = {}) {
  const species = getSpecies(beast.speciesId);
  const stats = computeStats(beast);
  const hp = Math.max(0, stats.maxHp - (beast.hpLost ?? 0));
  const per = personality(beast);

  return el(
    'button',
    {
      type: 'button',
      class: `beast-row${opts.selected ? ' selected' : ''}`,
      onclick: opts.onclick,
    },
    portrait(beast, opts.size ?? 58),
    div(
      { class: 'body' },
      div(
        { class: 'nm' },
        beast.name,
        beast.isEchoryx ? tag('Story', 'warn') : null,
        beast.generation > 1 ? tag(`G${beast.generation}`) : null
      ),
      div({ class: 'sp' }, `${species.name} · Lv ${beast.level} · ${STAGE_INFO[beast.stage].name} · ${per.name}`),
      opts.meters === false
        ? null
        : div(
            { style: { marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '3px' } },
            meter(hp, stats.maxHp, `hp${hp / stats.maxHp < 0.35 ? ' low' : ''}`),
            meter(beast.bond, 100, 'bond')
          ),
      opts.detail ?? null
    ),
    opts.trailing ?? null
  );
}

export function statGrid(beast) {
  const stats = computeStats(beast);
  return div(
    { class: 'stat-grid' },
    STAT_KEYS.map((key) => {
      const potential = beast.phenotype.aptitudes[key];
      const trained = beast.training[key] ?? 0;
      const cap = Math.round(potential * 100);
      return div(
        { class: 'stat-cell' },
        div({ class: 'k' }, STAT_LABELS[key]),
        div({ class: 'v' }, stats[key]),
        div({ class: 'pot' }, el('i', { style: { width: `${cap ? (trained / cap) * 100 : 0}%` } })),
        div({ class: 'tiny', style: { marginTop: '2px' } }, `potential ${Math.round(potential * 100)}`)
      );
    })
  );
}

/** The visible, inherited appearance — what the player recognises a beast by. */
export function appearanceList(beast) {
  const p = beast.phenotype;
  const rows = [];
  const colorRow = (label, entry) =>
    div(
      { class: 'prob-row' },
      span({ class: 'row' }, span({ class: 'swatch', style: { background: colorToCss(entry.value) } }), label),
      span(
        { class: 'p' },
        entry.co
          ? 'codominant'
          : entry.mode === 'blend'
          ? 'blended'
          : 'dominant'
      )
    );

  rows.push(colorRow('Primary coat', p.colors.primary));
  rows.push(colorRow('Secondary', p.colors.secondary));
  rows.push(colorRow('Accent', p.colors.accent));
  rows.push(colorRow('Eyes', p.colors.eye));
  rows.push(
    div({ class: 'prob-row' }, span({}, 'Build'), span({ class: 'p' }, p.buildLabel))
  );
  rows.push(
    div(
      { class: 'prob-row' },
      span({}, 'Markings'),
      span({ class: 'p' }, PATTERN_ALLELES[p.pattern]?.name ?? p.pattern)
    )
  );
  for (const [slot, key] of Object.entries(p.features)) {
    rows.push(
      div(
        { class: 'prob-row' },
        span({}, titleCase(slot)),
        span({ class: 'p' }, FEATURE_TAGS[key]?.name ?? key)
      )
    );
  }
  return div({}, rows);
}

export function hiddenList(beast, archiveLevel) {
  const p = beast.phenotype;
  if (archiveLevel < 2) {
    return div(
      { class: 'callout quiet' },
      archiveLevel === 0
        ? 'Without a working Gene Archive you can only guess at what this line is carrying.'
        : 'The Archive can see that recessives are present, but not yet which ones. Extend it to read them.'
    );
  }
  const items = [
    ...p.hidden.map((h) => `${titleCase(h.kind)}: ${titleCase(String(h.label))}`),
    ...p.dormantFeatures.map(
      (f) => `Dormant ${f.slot}: ${FEATURE_TAGS[f.key]?.name ?? f.key}${f.supported ? '' : ' (body cannot express it)'}`
    ),
  ];
  if (!items.length) return div({ class: 'callout quiet' }, 'Nothing hidden. This line breeds true at every locus read so far.');
  return div({}, items.map((t) => div({ class: 'prob-row' }, span({}, t), span({ class: 'p' }, 'carried'))));
}

export function xpBar(beast) {
  return labelledMeter(
    `Level ${beast.level}`,
    beast.xp,
    xpForLevel(beast.level),
    'xp',
    `${beast.xp}/${xpForLevel(beast.level)}`
  );
}

export function sectionHead(eyebrow, title, trailing = null) {
  return div(
    { class: 'spread', style: { marginBottom: '8px', alignItems: 'flex-end' } },
    div({}, eyebrow ? el('p', { class: 'eyebrow' }, eyebrow) : null, el('h2', {}, title)),
    trailing
  );
}

export function emptyState(text) {
  return div({ class: 'empty-state' }, text);
}
