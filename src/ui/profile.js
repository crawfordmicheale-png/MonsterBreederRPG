// The Kinbeast profile sheet — the field-journal page for one individual.

import { div, span, el, p, button, tag, sheet, toast, labelledMeter, meter, titleCase } from './dom.js';
import { portrait } from './portrait.js';
import {
  affinityTags,
  statGrid,
  appearanceList,
  hiddenList,
  vigorTag,
  stabilityTag,
  xpBar,
  speciesLabel,
} from './components.js';
import { getSpecies } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { STAT_KEYS, STAT_LABELS } from '../genetics/genome.js';
import { personality, STAGE_INFO, availableMoves, upcomingMoves, retireToElder } from '../core/kinbeast.js';
import { FRAGMENTS } from '../data/echoes.js';
import { relatedness, relatednessLabel } from '../genetics/breeding.js';
import { REACTIONS } from '../data/temperaments.js';
import { HAZARDS, HAZARD_IDS, tolerance } from '../data/environment.js';

export function openProfile(app, beast) {
  sheet((close) => renderProfile(app, beast, close));
}

function renderProfile(app, beast, close) {
  const game = app.game;
  const species = getSpecies(beast.speciesId);
  const per = personality(beast);
  const archiveLevel = game.facilities.archive;
  const root = div({ class: 'stack' });

  const rerender = () => {
    const parent = root.parentNode;
    if (!parent) return;
    parent.replaceChild(renderProfile(app, beast, close), root);
  };

  // --- header ---
  root.appendChild(
    div(
      { class: 'row', style: { alignItems: 'flex-start' } },
      portrait(beast, 96, { stage: false }),
      div(
        { style: { flex: '1', minWidth: '0' } },
        el('h2', { style: { marginBottom: '2px' } }, beast.name),
        p(
          { class: 'tiny', style: { marginBottom: '6px' } },
          `${speciesLabel(beast)} · Generation ${beast.generation} · ${STAGE_INFO[beast.stage].name} · ${titleCase(beast.origin)}`
        ),
        div({ class: 'chip-row' }, affinityTags(beast), tag(per.name, 'warn'), vigorTag(beast), stabilityTag(beast))
      )
    )
  );

  root.appendChild(p({ class: 'muted', style: { fontStyle: 'italic' } }, per.note));

  // --- condition ---
  root.appendChild(
    div(
      { class: 'card stack' },
      xpBar(beast),
      labelledMeter('Bond', beast.bond, 100, 'bond', `${Math.round(beast.bond)}%`),
      labelledMeter('Stress', beast.stress, 100, '', `${Math.round(beast.stress)}%`),
      beast.bond >= 50
        ? div({ class: 'tiny' }, `Bond Skill unlocked: ${MOVES[species.bondSkill].name}.`)
        : div({ class: 'tiny' }, `Bond Skill unlocks at 50 bond (${Math.round(beast.bond)}/50).`)
    )
  );

  // --- statistics ---
  root.appendChild(el('h3', {}, 'Statistics'));
  root.appendChild(statGrid(beast));
  root.appendChild(
    p(
      { class: 'tiny' },
      'The gold bar under each figure is how far training has pushed that statistic toward its genetic ceiling.'
    )
  );

  // --- training ---
  if (game.facilities.trainingYard) {
    root.appendChild(el('h3', {}, 'Training Yard'));
    root.appendChild(
      div(
        { class: 'btn-row' },
        STAT_KEYS.map((stat) =>
          button(STAT_LABELS[stat], {
            class: 'btn small',
            onclick: () => {
              const res = game.train(beast.id, stat);
              toast(res.ok ? `${beast.name}: ${STAT_LABELS[stat]} +${res.gain}.` : res.reason);
              app.afterChange();
              rerender();
            },
          })
        )
      )
    );
  }

  // --- moves ---
  root.appendChild(el('h3', {}, 'Moves'));
  const known = availableMoves(beast);
  root.appendChild(
    div(
      { class: 'stack' },
      known.map((id) => {
        const move = MOVES[id];
        const equipped = beast.moves.includes(id);
        const isLegacy = (beast.genome.legacyMoves ?? []).includes(id);
        return el(
          'button',
          {
            type: 'button',
            class: `move-btn${equipped ? ' bond' : ''}`,
            onclick: () => {
              if (equipped) {
                if (beast.moves.length <= 1) return toast('It needs at least one move.');
                beast.moves = beast.moves.filter((m) => m !== id);
              } else {
                if (beast.moves.length >= 4) return toast('Four moves is the limit. Unequip one first.');
                beast.moves.push(id);
              }
              app.afterChange();
              rerender();
            },
          },
          div(
            { class: 'spread' },
            span({ class: 'mn' }, move.name),
            span({ class: 'tiny' }, equipped ? 'equipped' : 'tap to equip')
          ),
          span(
            { class: 'mm' },
            [
              move.affinity ? move.affinity : 'neutral',
              move.power > 0 ? `power ${move.power}` : move.kind,
              `cost ${move.cost}`,
              isLegacy ? 'Legacy Move' : null,
            ]
              .filter(Boolean)
              .join(' · ')
          ),
          span({ class: 'tiny' }, move.desc)
        );
      })
    )
  );
  const soon = upcomingMoves(beast);
  if (soon.length) {
    root.appendChild(
      p({ class: 'tiny' }, `Learns ${soon.map((s) => `${s.move.name} at level ${s.level}`).join(', ')}.`)
    );
  }

  // --- passive & reactions ---
  root.appendChild(el('h3', {}, 'Passive and reactions'));
  root.appendChild(
    div(
      { class: 'card tight' },
      div({ style: { fontWeight: '600' } }, species.passive.name),
      p({ class: 'tiny', style: { margin: '2px 0 8px' } }, species.passive.desc),
      beast.phenotype.temperament.map((t) => {
        const r = REACTIONS[t];
        return r ? div({ class: 'tiny' }, `${r.name} — ${r.desc}`) : null;
      })
    )
  );

  // --- environmental tolerance ---
  // Only surfaced once the player has met a hazard, so the slice's opening
  // hours stay uncluttered.
  if (game.flags.ch2_started) {
    root.appendChild(el('h3', {}, 'Environmental tolerance'));
    root.appendChild(
      div(
        { class: 'card tight' },
        HAZARD_IDS.map((hazardId) => {
          const hazard = HAZARDS[hazardId];
          const t = tolerance(beast, hazardId);
          return div(
            { style: { marginBottom: '8px' } },
            div(
              { class: 'spread' },
              span({ style: { fontWeight: '600', fontSize: '13px' } }, hazard.traitName),
              tag(`${t.score} / ${hazard.threshold}`, t.ok ? 'good' : t.score > hazard.threshold * 0.7 ? 'warn' : 'bad')
            ),
            meter(t.score, hazard.threshold, t.ok ? 'hp' : 'hp low')
          );
        })
      )
    );
  }

  // --- appearance / genetics ---
  root.appendChild(el('h3', {}, 'Inherited appearance'));
  root.appendChild(div({ class: 'card tight' }, appearanceList(beast)));

  root.appendChild(el('h3', {}, 'Carried but not shown'));
  root.appendChild(div({ class: 'card tight' }, hiddenList(beast, archiveLevel)));

  // --- echoes ---
  const fragments = (beast.genome.echoes ?? []).map((id) => FRAGMENTS[id]).filter(Boolean);
  if (fragments.length) {
    root.appendChild(el('h3', {}, 'Echo fragments'));
    root.appendChild(
      div(
        { class: 'stack' },
        fragments.map((f) =>
          div({ class: 'card tight' }, div({ style: { fontWeight: '600' } }, f.name), p({ class: 'tiny', style: { margin: '3px 0 0' } }, f.text))
        )
      )
    );
  }

  // --- pedigree ---
  root.appendChild(el('h3', {}, 'Pedigree'));
  root.appendChild(pedigreeView(game, beast));

  const kin = game.roster
    .filter((b) => b.id !== beast.id)
    .map((b) => ({ b, r: relatedness(beast, b, game.lookup) }))
    .filter((x) => x.r > 0)
    .sort((a, b) => b.r - a.r)
    .slice(0, 4);
  if (kin.length) {
    root.appendChild(
      div(
        { class: 'card tight' },
        kin.map(({ b, r }) =>
          div(
            { class: 'prob-row' },
            span({}, b.name),
            span({ class: 'p' }, `${relatednessLabel(r).text} · ${(r * 100).toFixed(0)}%`)
          )
        )
      )
    );
  }

  // --- lineage ---
  if (game.flags.lineage_naming || game.facilities.archive >= 1) {
    root.appendChild(el('h3', {}, 'Bloodline'));
    if (beast.lineage && game.lineages[beast.lineage]) {
      root.appendChild(
        div(
          { class: 'callout quiet' },
          `${game.lineages[beast.lineage].name} — ${game.lineageMembers(beast.lineage).length} member(s).`
        )
      );
    } else {
      const input = el('input', { type: 'text', placeholder: 'e.g. Briarhold Ember Line', maxlength: '36' });
      root.appendChild(
        div(
          { class: 'stack' },
          input,
          button('Name this bloodline', {
            class: 'btn small',
            onclick: () => {
              const name = input.value.trim();
              if (name.length < 3) return toast('Give the line a proper name.');
              game.nameLineage(beast.id, name);
              app.afterChange();
              rerender();
            },
          })
        )
      );
    }
  }

  // --- notes & retirement ---
  if (beast.notes.length) {
    root.appendChild(div({ class: 'callout quiet' }, beast.notes.map((n) => div({ class: 'tiny' }, n))));
  }

  const actions = div({ class: 'btn-row' });
  if (!beast.retired && beast.level >= 20) {
    actions.appendChild(
      button('Retire as Elder mentor', {
        class: 'btn small',
        onclick: () => {
          retireToElder(beast);
          toast(`${beast.name} takes up mentoring.`);
          app.afterChange();
          rerender();
        },
      })
    );
  }
  actions.appendChild(button('Close', { class: 'btn small ghost', onclick: close }));
  root.appendChild(actions);

  return root;
}

function pedigreeView(game, beast) {
  const tree = game.pedigree(beast.id, 3);
  const columns = [[], [], []];

  const walk = (node, depth) => {
    if (!node || depth > 2) return;
    columns[depth].push(node.beast);
    for (const parent of node.parents) walk(parent, depth + 1);
  };
  walk(tree, 0);

  if (!columns[1].length) {
    return div({ class: 'callout quiet' }, 'Wild-caught. This individual is the founder of whatever comes next.');
  }

  return div(
    { class: 'pedigree' },
    columns.map((col, i) =>
      col.length
        ? div(
            { class: 'ped-col' },
            div({ class: 'tiny', style: { textAlign: 'center' } }, i === 0 ? 'Self' : i === 1 ? 'Parents' : 'Grandparents'),
            col.map((b) =>
              div(
                { class: 'ped-node' },
                portrait(b, 30, { stage: false, shadow: false }),
                div({}, div({ class: 'nm' }, b.name), div({ class: 'tiny' }, getSpecies(b.speciesId).name))
              )
            )
          )
        : null
    )
  );
}
