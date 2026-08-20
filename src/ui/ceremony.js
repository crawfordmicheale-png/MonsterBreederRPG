// Ceremonial hatch and Concord moments — the payoff for the genetics fantasy.

import { div, span, el, p, button, clear, tag } from './dom.js';
import { portrait } from './portrait.js';
import { affinityTags } from './components.js';
import { getSpecies, FEATURE_TAGS } from '../data/species.js';
import { PATTERN_ALLELES, colorName } from '../genetics/genome.js';
import { personality, STAGE_INFO } from '../core/kinbeast.js';
import { playChime } from './audio.js';

/**
 * Show the next pending ceremony, then recurse until the queue is empty.
 * @returns {boolean} true if a ceremony was shown
 */
export function presentCeremonies(app, onDone) {
  const list = app.game?.drainCeremonies?.() ?? [];
  if (!list.length) {
    onDone?.();
    return false;
  }
  let i = 0;
  const next = () => {
    if (i >= list.length) {
      onDone?.();
      return;
    }
    const ceremony = list[i++];
    showCeremony(app, ceremony, next);
  };
  next();
  return true;
}

function showCeremony(app, ceremony, onDone) {
  if (ceremony.kind === 'habitat') {
    app.showScene(ceremony.title, ceremony.lines, onDone);
    return;
  }

  const beast = app.game.lookup(ceremony.beastId);
  if (!beast) {
    onDone?.();
    return;
  }

  playChime(ceremony.kind === 'bond' ? 'bond' : 'hatch');

  const overlay = div({ class: 'ceremony-overlay' });
  const inner = div({ class: 'ceremony-inner' });
  overlay.appendChild(inner);

  const paint = () => {
    clear(inner);
    if (ceremony.kind === 'bond') paintBond(inner, beast, () => {
      overlay.remove();
      onDone?.();
    });
    else paintHatch(inner, app, beast, ceremony, () => {
      overlay.remove();
      onDone?.();
    });
  };
  paint();
  document.body.appendChild(overlay);
}

function paintBond(inner, beast, onClose) {
  const species = getSpecies(beast.speciesId);
  inner.appendChild(div({ class: 'eyebrow' }, 'Concord'));
  inner.appendChild(el('h2', {}, `${beast.name} accepts the Mark`));
  inner.appendChild(
    div({ class: 'ceremony-stage' }, portrait(beast, 148, { stage: false }))
  );
  inner.appendChild(div({ class: 'chip-row' }, affinityTags(beast), tag(species.name)));
  inner.appendChild(
    p({ class: 'muted' }, `A ${personality(beast).name.toLowerCase()} ${species.name}. The Concord settles between you like a held breath.`)
  );
  inner.appendChild(
    button('Welcome them home', { class: 'btn primary full', onclick: onClose })
  );
}

function paintHatch(inner, app, beast, ceremony, onClose) {
  const species = getSpecies(beast.speciesId);
  const parents = (ceremony.parents ?? [])
    .map((id) => app.game.lookup(id))
    .filter(Boolean);

  inner.appendChild(div({ class: 'eyebrow' }, ceremony.title ?? 'A hatching'));
  inner.appendChild(el('h2', {}, `${beast.name} opens its eyes`));

  if (parents.length) {
    inner.appendChild(
      div(
        { class: 'ceremony-parents' },
        parents.map((pBeast) =>
          div(
            { class: 'ceremony-parent' },
            portrait(pBeast, 56, { stage: false }),
            span({ class: 'tiny' }, pBeast.name)
          )
        ),
        span({ class: 'ceremony-arrow' }, '→'),
        div(
          { class: 'ceremony-parent' },
          portrait(beast, 72, { stage: false }),
          span({ class: 'tiny' }, beast.name)
        )
      )
    );
  } else {
    inner.appendChild(
      div({ class: 'ceremony-stage' }, portrait(beast, 148, { stage: false }))
    );
  }

  inner.appendChild(
    div(
      { class: 'chip-row' },
      affinityTags(beast),
      tag(`G${beast.generation ?? 1}`),
      tag(STAGE_INFO[beast.stage]?.name ?? beast.stage),
      tag(personality(beast).name)
    )
  );

  const reveals = traitReveals(beast);
  if (reveals.length) {
    inner.appendChild(el('h3', {}, 'What came through'));
    inner.appendChild(
      div(
        { class: 'stack' },
        reveals.map((line) => div({ class: 'callout quiet' }, line))
      )
    );
  }

  const dormant = dormantHints(beast);
  if (dormant.length) {
    inner.appendChild(
      p({ class: 'tiny' }, `Still sleeping in the blood: ${dormant.join(', ')}.`)
    );
  }

  if (ceremony.mutations?.length) {
    inner.appendChild(
      div(
        { class: 'callout' },
        el('strong', {}, 'Something unexpected — '),
        ceremony.mutations.join(' ')
      )
    );
  }

  inner.appendChild(
    p({ class: 'muted' }, `A ${species.name}. Out of ${(ceremony.parentNames ?? ['unknown', 'unknown']).join(' × ')}.`)
  );
  inner.appendChild(
    button('Into the sanctuary', { class: 'btn primary full', onclick: onClose })
  );
}

function traitReveals(beast) {
  const p = beast.phenotype;
  const lines = [];
  lines.push(`Coat leans ${colorName(p.colors.primary.value)}, with ${colorName(p.colors.accent.value)} markings.`);
  const pattern = PATTERN_ALLELES[p.pattern]?.name;
  if (pattern && p.pattern !== 'none') lines.push(`${pattern} across the hide.`);
  for (const [slot, id] of Object.entries(p.features ?? {})) {
    const feat = FEATURE_TAGS[id];
    if (feat && !id.endsWith('_none')) lines.push(`${feat.name} on the ${slot}.`);
  }
  lines.push(`${p.buildLabel} build · ${p.affinities.join('/')} affinity.`);
  return lines.slice(0, 4);
}

function dormantHints(beast) {
  const hints = [];
  const loci = beast.genome?.loci ?? {};
  for (const [key, pair] of Object.entries(loci)) {
    if (!key.startsWith('feat_') || !Array.isArray(pair)) continue;
    const expressed = beast.phenotype.features?.[key.replace('feat_', '')];
    for (const allele of pair) {
      const id = allele?.v;
      if (!id || id.endsWith('_none')) continue;
      const feat = FEATURE_TAGS[id];
      if (!feat) continue;
      if (expressed !== id && !beast.phenotype.species.featureSlots?.[feat.slot]?.includes(id)) {
        hints.push(feat.name);
      } else if (expressed !== id && allele.dom < (pair.find((a) => a.v === expressed)?.dom ?? 99)) {
        hints.push(`${feat.name} (recessive)`);
      }
    }
  }
  return [...new Set(hints)].slice(0, 3);
}
