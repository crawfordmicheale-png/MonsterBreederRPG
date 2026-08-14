// The five main screens.

import {
  div, span, el, p, button, tag, sheet, toast, clear,
  labelledMeter, meter, titleCase, confirmSheet,
} from './dom.js';
import { portrait, eggPortrait } from './portrait.js';
import { beastRow, sectionHead, emptyState, affinityTags, vigorTag, stabilityTag } from './components.js';
import { openProfile } from './profile.js';
import { getSpecies, BROOD_FAMILIES, FEATURE_TAGS } from '../data/species.js';
import { RESOURCES, REGIONS } from '../data/regions.js';
import { HAZARDS } from '../data/environment.js';
import { HABITATS, FACILITIES, INCUBATION } from '../data/sanctuary.js';
import { STAGE_INFO, personality, computeStats } from '../core/kinbeast.js';
import { predictOffspring, relatedness, relatednessLabel, socialCompatibility } from '../genetics/breeding.js';
import { colorToCss, STAT_KEYS, STAT_LABELS, PATTERN_ALLELES } from '../genetics/genome.js';
import { ECHOES, FRAGMENTS } from '../data/echoes.js';
import { availableTrials, trialById } from '../data/trials.js';
import { MOVES } from '../data/moves.js';

// ===========================================================================
// Sanctuary
// ===========================================================================

export function sanctuaryScreen(app) {
  const game = app.game;
  const root = div({ class: 'stack' });

  // --- current objective ---
  const beat = game.beat;
  if (beat?.kind === 'objective') {
    root.appendChild(
      div(
        { class: 'card' },
        el('p', { class: 'eyebrow' }, `${game.chapter.title} — current objective`),
        div({ class: 'objective' }, div({ class: 'pip' }), div({}, el('h3', {}, beat.title), p({ class: 'muted', style: { margin: '2px 0 0' } }, beat.objective))),
        beat.hint ? p({ class: 'tiny', style: { marginTop: '7px' } }, beat.hint) : null
      )
    );
  } else if (!game.chapter) {
    root.appendChild(
      div({ class: 'card' }, el('h3', {}, 'The road goes on'),
        p({ class: 'muted' }, 'Greenmantle Fen is next, and it is not built yet. Everything you have raised carries forward — keep breeding; the sanctuary is yours.'))
    );
  }

  // --- eggs ---
  if (game.eggs.length) {
    root.appendChild(sectionHead(null, 'In the Nursery'));
    root.appendChild(
      div(
        { class: 'stack' },
        game.eggs.map((egg) =>
          div(
            { class: 'beast-row' },
            eggPortrait(egg, 58),
            div(
              { class: 'body' },
              div({ class: 'nm' }, `Egg — generation ${egg.generation}`),
              div({ class: 'sp' }, `${egg.parentNames[0]} × ${egg.parentNames[1]}`),
              div({ style: { marginTop: '5px' } }, meter(egg.progress, egg.needed, 'egg')),
              div({ class: 'tiny' }, `${Math.max(0, Math.ceil(egg.needed - egg.progress))} more activity to hatching`),
              egg.condition && egg.condition !== 'neutral'
                ? div({ class: 'chip-row' },
                    tag(INCUBATION[egg.condition].name, egg.incubation?.matched ? 'good' : 'warn'),
                    egg.catalyst ? tag('Catalysed', 'bad') : null)
                : egg.catalyst
                ? div({ class: 'chip-row' }, tag('Catalysed', 'bad'))
                : null
            )
          )
        )
      )
    );
  }

  // --- habitats ---
  root.appendChild(sectionHead('Briarhold', 'Habitats'));
  root.appendChild(
    div(
      { class: 'stack' },
      game.habitatsUnlocked.map((id) => {
        const habitat = game.habitat(id);
        const occupants = game.occupantsOf(id);
        const crowded = game.isCrowded(id);
        return div(
          { class: 'card tight' },
          div(
            { class: 'spread' },
            div({}, el('h3', { style: { margin: 0 } }, habitat.name), div({ class: 'tiny' }, `${occupants.length}/${habitat.capacity} · ${habitat.affinities.join(', ')}`)),
            div({ class: 'row' },
              crowded ? tag('Crowded', 'bad') : null,
              span({ class: 'swatch', style: { background: habitat.tone, width: '18px', height: '18px' } })
            )
          ),
          crowded
            ? div({ class: 'tiny', style: { color: 'var(--danger)', marginTop: '4px' } }, 'Over capacity — nobody here is settling. Build more space.')
            : null,
          occupants.length
            ? div(
                { class: 'row wrap', style: { marginTop: '8px' } },
                occupants.map((b) =>
                  el(
                    'button',
                    { type: 'button', class: 'btn ghost small', style: { padding: '2px', minHeight: '0', border: 'none' }, onclick: () => openProfile(app, b) },
                    portrait(b, 44, { shadow: false })
                  )
                )
              )
            : div({ class: 'tiny', style: { marginTop: '6px', fontStyle: 'italic' } }, 'Empty. For now.')
        );
      })
    )
  );

  // --- habitat life ---
  const gossip = habitatGossip(game);
  if (gossip) root.appendChild(div({ class: 'callout quiet' }, gossip));

  // --- projects ---
  const projects = game.availableProjects();
  root.appendChild(sectionHead(null, 'Projects'));
  if (!projects.length) {
    root.appendChild(emptyState('Nothing left to build with what you have. Bring back more from the field.'));
  } else {
    root.appendChild(
      div(
        { class: 'stack' },
        projects.map((project) => {
          const affordable = game.canAfford(project.cost);
          const costText = Object.entries(project.cost).length
            ? Object.entries(project.cost).map(([k, v]) => `${v}× ${RESOURCES[k].name}`).join(', ')
            : 'no materials needed';
          return div(
            { class: 'card tight' },
            div({ class: 'spread' }, el('h3', { style: { margin: 0 } }, project.name), tag(affordable ? 'ready' : 'short', affordable ? 'good' : 'bad')),
            p({ class: 'tiny', style: { margin: '3px 0 6px' } }, project.desc),
            div({ class: 'spread' },
              span({ class: 'tiny' }, costText),
              button('Build', {
                class: 'btn small primary',
                disabled: !affordable,
                onclick: () => {
                  const res = game.runProject(project.id);
                  toast(res.ok ? `${project.name} complete.` : res.reason);
                  app.afterChange();
                },
              })
            )
          );
        })
      )
    );
  }

  // --- facilities ---
  const built = Object.entries(game.facilities).filter(([, lvl]) => lvl > 0);
  if (built.length) {
    root.appendChild(sectionHead(null, 'Facilities'));
    root.appendChild(
      div({ class: 'chip-row' }, built.map(([id, lvl]) => tag(`${FACILITIES[id].name}${lvl > 1 ? ` ${lvl}` : ''}`, 'good')))
    );
  }

  // --- trials ---
  const trials = availableTrials(game);
  if (trials.length) {
    root.appendChild(sectionHead(null, 'Concord Trials'));
    root.appendChild(
      div(
        { class: 'stack' },
        trials.map((trial) => {
          const gate = trial.entry(game);
          return div(
            { class: 'card tight' },
            el('h3', { style: { margin: 0 } }, trial.name),
            p({ class: 'tiny', style: { margin: '3px 0' } }, trial.blurb),
            div({ class: 'callout quiet', style: { margin: '6px 0' } }, trial.rule),
            div({ class: 'spread' },
              span({ class: 'tiny' }, gate.ok ? 'Entry conditions met.' : gate.reason),
              button('Enter', {
                class: 'btn small primary',
                disabled: !gate.ok,
                onclick: () => app.startTrial(trial.id),
              })
            )
          );
        })
      )
    );
  }

  if (game.seals.length) {
    root.appendChild(div({ class: 'chip-row' }, game.seals.map((s) => tag(`${titleCase(s)} Seal`, 'warn'))));
  }

  // --- rest ---
  root.appendChild(
    button(game.facilities.clinic ? 'Rest the sanctuary (Clinic)' : 'Rest the sanctuary', {
      class: 'btn full',
      onclick: () => {
        game.restAll();
        toast('Everyone is back on their feet.');
        app.afterChange();
      },
    })
  );

  return root;
}

function habitatGossip(game) {
  const pairs = [];
  for (const beast of game.roster) {
    for (const [otherId, score] of Object.entries(beast.relationships ?? {})) {
      if (score >= 25) pairs.push({ a: beast, b: game.lookup(otherId), score, kind: 'friend' });
      else if (score <= -12) pairs.push({ a: beast, b: game.lookup(otherId), score, kind: 'rival' });
    }
  }
  const pick = pairs.filter((x) => x.b).sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];
  if (!pick) return null;
  const where = game.habitat(pick.a.habitat).name.toLowerCase();
  return pick.kind === 'friend'
    ? `${pick.a.name} and ${pick.b.name} have taken to sleeping in the same corner of the ${where}.`
    : `${pick.a.name} and ${pick.b.name} will not settle in the same part of the ${where}.`;
}

// ===========================================================================
// Explore
// ===========================================================================

export function exploreScreen(app) {
  const game = app.game;
  const root = div({ class: 'stack' });

  if (!game.flags.exploration_unlocked) {
    root.appendChild(emptyState('The countryside can wait. There is work at the sanctuary first.'));
    return root;
  }

  const regions = game.regions();
  const region = REGIONS[game.region] ?? regions[0];

  if (regions.length > 1) {
    root.appendChild(
      div(
        { class: 'btn-row' },
        regions.map((r) =>
          button(r.name, {
            class: `btn small${r.id === region.id ? ' primary' : ''}`,
            onclick: () => {
              game.setRegion(r.id);
              app.afterChange();
            },
          })
        )
      )
    );
  }

  root.appendChild(sectionHead('Region', region.name));
  root.appendChild(p({ class: 'muted' }, region.blurb));

  const party = game.activeTeam.slice(0, 3);
  root.appendChild(
    div(
      { class: 'card tight' },
      div({ class: 'tiny' }, 'Expedition party'),
      party.length
        ? div({ class: 'row wrap', style: { marginTop: '6px' } }, party.map((b) => portrait(b, 42, { shadow: false })))
        : div({ class: 'tiny', style: { fontStyle: 'italic' } }, 'Nobody is coming with you. Set a team in the Roster.')
    )
  );

  root.appendChild(
    div(
      { class: 'stack' },
      game.sitesIn(region.id).map((site) => siteCard(app, site))
    )
  );

  return root;
}

function siteCard(app, site) {
  const game = app.game;
  const hazard = site.hazard ? HAZARDS[site.hazard] : null;
  const party = hazard ? game.partyFor(site.hazard) : null;
  const passable = !hazard || party.ok;

  const card = div(
    { class: 'card tight' },
    div(
      { class: 'spread' },
      el('h3', { style: { margin: 0 } }, site.name),
      hazard ? tag(hazard.name, passable ? 'good' : 'bad') : null
    ),
    p({ class: 'tiny', style: { margin: '3px 0 8px' } }, site.blurb)
  );

  // A hazardous site explains itself in full: the threshold, every member of
  // the party that would go in, and the terms that make up each score. The
  // breeding puzzle is only fair if the player can read the sum.
  if (hazard) {
    card.appendChild(
      div(
        { class: passable ? 'callout' : 'callout quiet' },
        div({ style: { marginBottom: '6px' } }, hazard.blurb),
        div({ class: 'tiny', style: { marginBottom: '6px' } },
          `The crews go in threes. All three need ${hazard.traitName} tolerance ${hazard.threshold}.`),
        party.shortHanded
          ? div({ class: 'tiny', style: { color: 'var(--danger)' } },
              `Only ${party.members.length} adult${party.members.length === 1 ? '' : 's'} on your active team. You need ${party.needed}.`)
          : null,
        div(
          { class: 'stack', style: { gap: '7px' } },
          party.members.map(({ beast, tolerance: t }) =>
            div(
              {},
              div(
                { class: 'spread' },
                span({ class: 'row' }, portrait(beast, 30, { stage: false, shadow: false }), beast.name),
                tag(`${t.score} / ${t.threshold}`, t.ok ? 'good' : 'bad')
              ),
              meter(t.score, t.threshold, t.ok ? 'hp' : 'hp low')
            )
          )
        ),
        party.weakest && !party.ok
          ? div(
              { style: { marginTop: '8px' } },
              div({ class: 'tiny', style: { marginBottom: '3px' } },
                `${party.weakest.beast.name} is the one holding you back — short by ${party.weakest.tolerance.shortfall}:`),
              party.weakest.tolerance.parts.map((part) =>
                div(
                  { class: 'prob-row' },
                  span({}, titleCase(part.label)),
                  span({ class: 'p', style: { color: part.value < 0 ? 'var(--danger)' : 'var(--good)' } },
                    `${part.value > 0 ? '+' : ''}${part.value}`)
                )
              ),
              div({ class: 'tiny', style: { marginTop: '6px' } },
                `Breed the ${hazard.traitName} trait into a body that suits it. Two copies of the allele beat one, and a matching affinity or plating adds to the same total.`)
            )
          : null
      )
    );
  }

  card.appendChild(
    div(
      { class: 'spread' },
      span({ class: 'tiny' }, site.resources.map((r) => RESOURCES[r].name).join(' · ')),
      button(passable ? 'Set out' : 'Too dangerous', {
        class: `btn small${passable ? ' primary' : ''}`,
        disabled: !passable,
        onclick: () => runExpedition(app, site),
      })
    )
  );
  return card;
}

function runExpedition(app, site) {
  const game = app.game;
  const result = game.explore(game.region, site.id);
  if (!result) return;
  if (result.blocked) {
    toast(`${result.hazard.name} turns the team back.`);
    return;
  }
  app.afterChange();

  sheet((close) => {
    const body = div({ class: 'stack' });
    body.appendChild(el('h3', {}, site.name));
    if (result.found.length) {
      body.appendChild(
        div({ class: 'chip-row' }, result.found.map((r) => tag(`+1 ${r.name}`, 'good')))
      );
    } else {
      body.appendChild(p({ class: 'tiny' }, 'You come back with nothing but wet boots.'));
    }
    for (const { beast, res } of result.growth) {
      if (res.levels.length) body.appendChild(p({ class: 'tiny' }, `${beast.name} reached level ${beast.level}.`));
      if (res.staged) body.appendChild(p({ class: 'tiny' }, `${beast.name} is now a ${STAGE_INFO[res.staged].name}.`));
    }

    const wild = result.wild;
    body.appendChild(
      div(
        { class: 'card tight row' },
        portrait(wild, 62, { stage: false }),
        div({ style: { flex: 1 } },
          div({ style: { fontWeight: 600 } }, `A wild ${getSpecies(wild.speciesId).name}`),
          div({ class: 'chip-row' }, affinityTags(wild), tag(`Lv ${wild.level}`))
        )
      )
    );
    body.appendChild(
      button('Approach it', {
        class: 'btn primary full',
        onclick: () => {
          close();
          app.startEncounter(wild);
        },
      })
    );
    body.appendChild(button('Head home', { class: 'btn ghost full', onclick: close }));
    return body;
  });
}

// ===========================================================================
// Roster
// ===========================================================================

export function rosterScreen(app) {
  const game = app.game;
  const root = div({ class: 'stack' });

  root.appendChild(
    sectionHead('Briarhold', `${game.roster.length} Kinbeast${game.roster.length === 1 ? '' : 's'}`,
      button('Team', { class: 'btn small', onclick: () => openTeamEditor(app) }))
  );

  if (!game.roster.length) {
    root.appendChild(emptyState('No Kinbeasts yet.'));
    return root;
  }

  const team = new Set(game.team);
  const ordered = [...game.roster].sort((a, b) => {
    const at = team.has(a.id) ? 0 : 1;
    const bt = team.has(b.id) ? 0 : 1;
    return at - bt || b.level - a.level;
  });

  // Once a hazard is in play, the roster is also the shortlist for it.
  const hazardId = game.beat?.id === 'ch2_heatproof' ? 'heat' : null;

  root.appendChild(
    div(
      { class: 'list' },
      ordered.map((beast) =>
        beastRow(beast, {
          onclick: () => openProfile(app, beast),
          trailing: hazardId
            ? (() => {
                const t = game.tolerance(beast, hazardId);
                return tag(`${HAZARDS[hazardId].traitName} ${t.score}`, t.ok ? 'good' : 'bad');
              })()
            : team.has(beast.id)
            ? tag('Team', 'good')
            : null,
        })
      )
    )
  );

  return root;
}

function openTeamEditor(app) {
  const game = app.game;
  sheet((close) => {
    const body = div({ class: 'stack' });
    const rerender = () => {
      clear(body);
      body.appendChild(el('h3', {}, 'Active team'));
      body.appendChild(p({ class: 'tiny' }, 'The first three take the field; the rest are reserves. Hatchlings cannot be selected.'));
      const eligible = game.roster.filter((b) => b.stage !== 'hatchling');
      for (const beast of eligible) {
        const index = game.team.indexOf(beast.id);
        body.appendChild(
          beastRow(beast, {
            selected: index >= 0,
            meters: false,
            onclick: () => {
              if (index >= 0) game.setTeam(game.team.filter((id) => id !== beast.id));
              else if (game.team.length >= 6) toast('Six is the limit.');
              else game.setTeam([...game.team, beast.id]);
              app.afterChange();
              rerender();
            },
            trailing: index >= 0 ? tag(index < 3 ? `Active ${index + 1}` : 'Reserve', index < 3 ? 'good' : '') : null,
          })
        );
      }
      body.appendChild(button('Done', { class: 'btn primary full', onclick: close }));
    };
    rerender();
    return body;
  });
}

// ===========================================================================
// Breeding
// ===========================================================================

export function breedScreen(app) {
  const game = app.game;
  const root = div({ class: 'stack' });

  if (!game.flags.breeding_unlocked) {
    root.appendChild(emptyState('Orren has not walked you through pairing yet.'));
    return root;
  }
  if (!game.facilities.nursery) {
    root.appendChild(
      div({ class: 'card' }, el('h3', {}, 'No Nursery'),
        p({ class: 'muted' }, 'Nothing can be paired until the Nursery is rebuilt. Sanctuary → Projects.'))
    );
    return root;
  }

  const state = app.breedState ?? (app.breedState = { form: null, trait: null });
  state.condition ??= 'neutral';
  state.catalyst ??= false;
  const pool = game.breedable;

  root.appendChild(sectionHead('Nursery', 'Pairing'));
  root.appendChild(
    p({ class: 'tiny' },
      'The Form Parent decides the species body the offspring is born with. Both parents contribute equally to everything else.')
  );

  root.appendChild(parentSlot(app, 'Form Parent', state.form, pool, (b) => { state.form = b; app.render(); }));
  root.appendChild(parentSlot(app, 'Trait Parent', state.trait, pool, (b) => { state.trait = b; app.render(); }));

  const form = state.form && game.lookup(state.form.id);
  const trait = state.trait && game.lookup(state.trait.id);

  if (!form || !trait) {
    root.appendChild(emptyState('Choose two parents to see what they might produce.'));
    return root;
  }

  const compat = game.compatibility(form, trait);
  const r = relatedness(form, trait, game.lookup);
  const rl = relatednessLabel(r);
  const social = socialCompatibility(form, trait);

  root.appendChild(
    div(
      { class: 'card tight stack' },
      div({ class: 'chip-row' },
        tag(rl.text, rl.tone === 'block' ? 'bad' : rl.tone === 'warn' ? 'warn' : 'good'),
        tag(`Shared: ${compat.families.map((f) => BROOD_FAMILIES[f].name).join(', ') || 'none'}`, compat.families.length ? 'good' : 'bad'),
        tag(`Social ${Math.round(social * 100)}%`, social >= 0.6 ? 'good' : social >= 0.35 ? 'warn' : 'bad')
      ),
      compat.issues.map((i) => div({ class: 'tiny', style: { color: 'var(--danger)' } }, `• ${i}`)),
      compat.notes.map((n) => div({ class: 'tiny' }, `• ${n}`))
    )
  );

  if (compat.ok) {
    root.appendChild(predictionView(game, form, trait));
    root.appendChild(clutchOptions(app, state));
    root.appendChild(
      button('Pair them', {
        class: 'btn primary full',
        onclick: () => {
          const res = game.breed(form.id, trait.id, {
            catalyst: state.catalyst,
            condition: state.condition,
          });
          if (!res.ok) return toast(res.reason);
          toast('An egg.');
          app.breedState = { form: null, trait: null, condition: state.condition, catalyst: false };
          app.afterChange();
          if (res.mutations.length) {
            sheet(() => div({ class: 'stack' },
              el('h3', {}, 'Something unexpected'),
              res.mutations.map((m) => p({ class: 'muted' }, m)),
              p({ class: 'tiny' }, 'Mutations raise Instability. Sometimes it is worth it.')
            ));
          }
        },
      })
    );
  }

  // --- Echo Hall ---
  if (game.facilities.echoHall) {
    root.appendChild(el('hr', { class: 'rule' }));
    root.appendChild(sectionHead('Briarhold', 'Echo Hall'));
    const statuses = game.echoStatus();
    root.appendChild(
      div(
        { class: 'stack' },
        statuses.map((s) =>
          div(
            { class: 'card tight' },
            div({ class: 'spread' }, el('h3', { style: { margin: 0 } }, s.echo.name), tag(s.done ? 'reconstructed' : s.ready ? 'ready' : `${s.have.length}/${s.echo.requires.length}`, s.done ? 'good' : s.ready ? 'warn' : '')),
            p({ class: 'tiny', style: { margin: '4px 0' } }, s.echo.summary),
            div({ class: 'chip-row' },
              s.echo.requires.map((f) => tag(FRAGMENTS[f].name, s.have.includes(f) ? 'good' : 'bad'))
            ),
            s.ready
              ? button('Reconstruct', {
                  class: 'btn small primary',
                  style: { marginTop: '8px' },
                  onclick: () => {
                    const res = game.reconstructEcho(s.echo.id);
                    if (res.ok) app.showScene(res.echo.name, res.echo.scene.map((t) => ({ who: 'narration', text: t })), () => app.afterChange());
                  },
                })
              : null
          )
        )
      )
    );
  }

  return root;
}

/** Catalyst and incubation choices — everything decided at the moment of laying. */
function clutchOptions(app, state) {
  const game = app.game;
  const root = div({ class: 'stack' });

  if (game.flags.catalysts_unlocked) {
    const salt = game.resources.thermal_salt ?? 0;
    root.appendChild(
      el(
        'button',
        {
          type: 'button',
          class: `aptitude-card${state.catalyst ? ' selected' : ''}`,
          disabled: salt < 1,
          onclick: () => {
            state.catalyst = !state.catalyst;
            app.render();
          },
        },
        div({ class: 'spread' },
          div({ style: { fontWeight: '600' } }, 'Use a trait catalyst'),
          tag(`${salt} Thermal Salt`, salt ? '' : 'bad')
        ),
        p({ class: 'tiny', style: { margin: '2px 0 0' } },
          'Roughly six times the mutation rate, and a real Stability cost. Worth it when a line has gone predictable and dull.')
      )
    );
  }

  if (game.facilities.hatchery >= 2) {
    root.appendChild(el('p', { class: 'eyebrow' }, 'Incubation bed'));
    root.appendChild(
      div(
        { class: 'btn-row' },
        game.incubationOptions().map((condition) => {
          const affordable = !condition.cost || game.canAfford(condition.cost);
          return button(condition.name, {
            class: `btn small${state.condition === condition.id ? ' primary' : ''}`,
            disabled: !affordable,
            onclick: () => {
              state.condition = condition.id;
              app.render();
            },
          });
        })
      )
    );
    const chosen = INCUBATION[state.condition] ?? INCUBATION.neutral;
    root.appendChild(
      div({ class: 'callout quiet' },
        div({}, chosen.desc),
        chosen.affinities.length
          ? div({ class: 'tiny', style: { marginTop: '4px' } },
              `Matches ${chosen.affinities.join(', ')}. A mismatch still hatches, just less settled.`)
          : null)
    );
  }

  return root;
}

function parentSlot(app, label, chosen, pool, onPick) {
  const beast = chosen && app.game.lookup(chosen.id);
  return div(
    {},
    el('p', { class: 'eyebrow' }, label),
    beast
      ? beastRow(beast, { onclick: () => openParentPicker(app, pool, onPick), meters: false, trailing: tag('change') })
      : button(`Choose ${label}`, { class: 'btn full', onclick: () => openParentPicker(app, pool, onPick) })
  );
}

function openParentPicker(app, pool, onPick) {
  sheet((close) =>
    div(
      { class: 'stack' },
      el('h3', {}, 'Choose a Kinbeast'),
      pool.length
        ? pool.map((b) => beastRow(b, { meters: false, onclick: () => { close(); onPick(b); } }))
        : emptyState('No adults are available to pair.'),
      button('Cancel', { class: 'btn ghost full', onclick: close })
    )
  );
}

function predictionView(game, form, trait) {
  const level = game.facilities.archive;
  const pred = predictOffspring(form, trait, level);
  const rows = (title, list) =>
    list?.length
      ? div(
          { class: 'card tight' },
          el('h3', { style: { margin: '0 0 4px' } }, title),
          list.slice(0, 4).map((row) =>
            div({ class: 'prob-row' }, span({}, titleCase(String(row.label))), span({ class: 'p' }, row.text))
          )
        )
      : null;

  const aptitudeRows = div(
    { class: 'card tight' },
    el('h3', { style: { margin: '0 0 4px' } }, 'Aptitude ranges'),
    STAT_KEYS.map((stat) => {
      const r = pred.aptitudes[stat];
      return div(
        { class: 'prob-row' },
        span({}, STAT_LABELS[stat]),
        span({ class: 'p' }, level >= 1 ? `${Math.round(r.min * 100)}–${Math.round(r.max * 100)}` : describeAptitude(r.avg))
      );
    })
  );

  return div(
    { class: 'stack' },
    div(
      { class: 'callout quiet' },
      level === 0
        ? 'Without the Gene Archive these are guesses. Restore it to see numbers.'
        : level === 1
        ? 'The Archive gives bracketed odds. Extend it for exact percentages and carried recessives.'
        : 'Full Archive. Exact odds, carried alleles and all.'
    ),
    div({ class: 'card tight' },
      el('h3', { style: { margin: '0 0 4px' } }, 'Offspring species'),
      div({ class: 'prob-row' }, span({}, pred.speciesName), span({ class: 'p' }, 'certain — from the Form Parent'))
    ),
    rows('Build', pred.build),
    rows('Markings', pred.pattern),
    rows('Primary coat', pred.colors.colorPrimary),
    rows('Eyes', pred.colors.colorEye),
    ...Object.entries(pred.features).map(([slot, list]) => rows(titleCase(slot), list)),
    ...Object.entries(pred.resistances ?? {}).map(([hazardId, list]) =>
      rows(`${HAZARDS[hazardId].traitName} resistance`, list)
    ),
    rows('Temperament (first)', pred.temperament.first.map((r) => ({ ...r, label: titleCase(r.label) }))),
    rows('Temperament (second)', pred.temperament.second.map((r) => ({ ...r, label: titleCase(r.label) }))),
    aptitudeRows,
    pred.legacyMoves.length
      ? div(
          { class: 'card tight' },
          el('h3', { style: { margin: '0 0 4px' } }, 'Legacy Moves in play'),
          pred.legacyMoves.map((m) =>
            div({ class: 'prob-row' }, span({}, m.name), span({ class: 'p' }, m.possible ? 'can be inherited' : `dormant — ${m.reason}`))
          )
        )
      : null,
    pred.echoes.length
      ? div(
          { class: 'card tight' },
          el('h3', { style: { margin: '0 0 4px' } }, 'Echo fragments in the line'),
          pred.echoes.map((f) => div({ class: 'prob-row' }, span({}, FRAGMENTS[f]?.name ?? f), span({ class: 'p' }, 'may pass down')))
        )
      : null
  );
}

function describeAptitude(v) {
  if (v > 0.72) return 'exceptional';
  if (v > 0.58) return 'strong';
  if (v > 0.42) return 'ordinary';
  if (v > 0.28) return 'weak';
  return 'poor';
}

// ===========================================================================
// Journal
// ===========================================================================

export function journalScreen(app) {
  const game = app.game;
  const root = div({ class: 'stack' });

  root.appendChild(sectionHead('Broodkeeper', game.keeper.name));
  root.appendChild(
    div({ class: 'chip-row' },
      tag(`Rank ${game.keeper.rank}`, 'warn'),
      tag(titleCase(game.keeper.aptitude)),
      tag(`${game.stats.bondsFormed} Concords`),
      tag(`${game.stats.eggsHatched} hatched`),
      tag(`${game.stats.battlesWon} wins`)
    )
  );

  // Story progress.
  if (game.chapter) {
    root.appendChild(
      div({ class: 'card tight' },
        el('p', { class: 'eyebrow' }, `Chapter ${game.chapter.number}`),
        el('h3', { style: { margin: 0 } }, game.chapter.title),
        p({ class: 'tiny', style: { margin: '3px 0 0' } }, game.chapter.location))
    );
  }

  // Reconstructed echoes.
  const done = game.completedEchoes.map((id) => ECHOES[id]).filter(Boolean);
  if (done.length) {
    root.appendChild(sectionHead(null, 'Echo Archive'));
    root.appendChild(
      div({ class: 'stack' },
        done.map((echo) =>
          el('button', {
            type: 'button', class: 'card tight', style: { textAlign: 'left', width: '100%' },
            onclick: () => app.showScene(echo.name, echo.scene.map((t) => ({ who: 'narration', text: t })), () => {}),
          },
            el('h3', { style: { margin: 0 } }, echo.name),
            p({ class: 'tiny', style: { margin: '3px 0 0' } }, echo.summary))
        ))
    );
  }

  // Bloodlines.
  const lineages = Object.values(game.lineages);
  if (lineages.length) {
    root.appendChild(sectionHead(null, 'Hall of Lineages'));
    root.appendChild(
      div({ class: 'stack' },
        lineages.map((l) => {
          const members = game.lineageMembers(l.id);
          return div({ class: 'card tight' },
            el('h3', { style: { margin: 0 } }, l.name),
            div({ class: 'tiny' }, `${members.length} member(s) · founded by ${game.lookup(l.founder)?.name ?? 'unknown'}`),
            div({ class: 'row wrap', style: { marginTop: '6px' } }, members.slice(0, 8).map((b) => portrait(b, 36, { shadow: false })))
          );
        }))
    );
  }

  // Journal log.
  root.appendChild(sectionHead(null, 'Field notes'));
  root.appendChild(
    game.journal.length
      ? div({ class: 'card tight' }, game.journal.slice(0, 26).map((n) => div({ class: 'tiny', style: { padding: '2px 0' } }, n.text)))
      : emptyState('Nothing written down yet.')
  );

  // Save controls.
  root.appendChild(el('hr', { class: 'rule' }));
  root.appendChild(
    div({ class: 'btn-row' },
      button('Save now', { class: 'btn small', onclick: () => toast(game.save() ? 'Saved.' : 'Could not save.') }),
      button('Abandon this run', {
        class: 'btn small ghost',
        onclick: () =>
          confirmSheet('Abandon Briarhold?', 'The save is deleted and the sanctuary goes back to ruin. This cannot be undone.', 'Abandon', () => app.hardReset()),
      })
    )
  );
  root.appendChild(p({ class: 'tiny' }, 'The game saves automatically after anything that matters.'));

  return root;
}
