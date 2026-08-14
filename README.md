# The Broodkeeper's Oath

A monster-taming, breeding and sanctuary-management RPG for mobile browsers.

You inherit a ruined breeding sanctuary, one egg nobody was supposed to find,
and a family name that everyone in Alderreach remembers for the wrong reason.

This repository contains the **vertical slice** described in §21 of the
[Game Bible](docs/GAME_BIBLE.md): Briarhold Sanctuary, Hearthmere Fields, six
Common species, wild bonding, 3v3 combat, the Nursery, same-species breeding
with visible inheritance, one Echo sequence, and the Meadow Trial.

---

## Running it

There is no build step. It is ES modules, one stylesheet and a canvas — serve
the directory over HTTP and open it.

```sh
npm start          # python3 -m http.server 8080
# then open http://localhost:8080 on a phone or in a mobile emulator
```

Any static host works, including GitHub Pages. Progress saves to
`localStorage` on the device.

## Tests

```sh
npm test           # 33 unit tests, zero dependencies
npm run test:browser   # 22 end-to-end checks in a phone-sized Chromium
```

The unit suite covers the genetics engine (Mendelian inheritance, dominance,
dormant genes, prediction maths, relatedness, Vigor and Stability), the combat
engine, save/load fidelity, and a **complete scripted playthrough of the
prologue and Chapter One** so story progression cannot silently soft-lock.

The browser suite boots the real game on a Pixel-7 viewport, plays the opening,
asserts that creature art actually rasterises to the canvas, walks every tab,
and fails on any console error, horizontal overflow or sub-40px touch target.
It needs a local Chromium; set `CHROMIUM_PATH` if yours is somewhere unusual.

---

## What is actually implemented

| Bible section | Status |
| --- | --- |
| §4.1 Every Kinbeast is an individual | Full genome → procedural art. No two look alike. |
| §4.2 Breeding is central | Story objectives gate on bred generations, not levels. |
| §9 Prologue + Chapter One | Playable start to finish, including the Meadow Trial. |
| §10 Core loop | Explore → bond → build → pair → hatch → train → trial. |
| §11 Wild bonding | Temperament-driven approaches. No capture probability. |
| §12.3 Genome categories | Build, 4 colour channels, pattern, 6 feature slots, affinities, 6 aptitudes, temperament, Echoes. |
| §12.4 Trait expression | Dominant, recessive, codominant, incomplete dominance, dormant. |
| §12.5 Mutation | Low natural rate; catalysts raise it and cost Stability. |
| §12.6 Breeding interface | Exact odds, gated behind Gene Archive level. |
| §12.7 Life stages | Hatchling → Juvenile → Adult → Elder (with mentoring). |
| §13 Combat | 3v3, initiative timeline, passives, temperament reactions, Bond Skills, four objective types. |
| §14 Sanctuary | Habitats, projects, six facilities, habitat social simulation. |
| §15 Progression | Rank, training toward genetic ceilings, bloodline naming. |
| §19 UI direction | Field-journal interface, pedigree screen, Echo archive. |
| Chapters Two–Nine, 24 further species, postgame | Not yet — see [ROADMAP](docs/ROADMAP.md). |

---

## Architecture

Vanilla ES modules. No framework, no bundler, no runtime dependencies. The
whole game is roughly 5,000 lines split into a headless simulation and a thin
DOM layer, so the rules can be unit-tested in Node without a browser.

```
index.html
src/
  main.js                 entry point
  styles.css              the entire interface, one file
  data/                   pure data — no logic, safe to extend
    species.js            the six slice species + modular feature slots
    moves.js              moves, anatomy requirements, Bond Skills
    affinities.js         11 affinities + the effectiveness chart
    temperaments.js       12 tendencies → named personalities → reactions
    regions.js            Hearthmere sites, encounter tables, resources
    sanctuary.js          habitats, facilities, restoration projects
    trials.js             Concord Trials with roster entry gates
    echoes.js             memory fragments and the Echoes they assemble into
    story.js              the campaign as scenes and objective predicates
  genetics/
    genome.js             loci, alleles, dominance, expression → phenotype
    breeding.js           pairing rules, inheritance, mutation, prediction
  core/
    rng.js                seeded, serialisable RNG
    kinbeast.js           the entity: stats, growth, moves, naming
    bonding.js            wild encounters and Concord Marks
    state.js              all game state and every operation on it
  battle/
    engine.js             headless 3v3 combat, emits events
  render/
    creature.js           procedural creature art from a phenotype
  ui/                     DOM layer — screens, sheets, portraits
tests/
  genetics.test.js        genetics and entity rules
  game.test.js            combat, bonding, state, full campaign run
  browser/smoke.mjs       Playwright end-to-end
```

### Three ideas worth knowing before you change anything

**1. The genome is the single source of truth.** A Kinbeast's colours,
markings, body parts, aptitudes, affinities, temperament and anatomy tags are
all derived by `expressGenome()`. Saves store the genome and re-derive
everything else, which is why a save round-trip cannot drift. If you want a new
visible trait, add a locus — don't add a field to the creature.

**2. Genes are never destroyed, only unexpressed.** A wing-attack gene in a
Mossbun line stays in the genome and does nothing; if a descendant is ever born
with wings, it works. Same for feature slots a body cannot support and
recessives hiding behind a dominant. This is the mechanism the whole
multi-generational fantasy rests on, so preserve it when adding traits.

**3. Predictions are computed, not estimated.** Each parent contributes one of
two alleles, so a locus has exactly four equally likely outcomes.
`predictOffspring()` enumerates them and returns real probabilities; the Gene
Archive level only decides how precisely those numbers are *shown* to the
player. Never fudge the displayed odds — degrade the wording instead.

### Adding a species

Add an entry to `src/data/species.js` (see §22 of the bible for the required
fields) and a painter to `PAINTERS` in `src/render/creature.js`. Nothing else
needs to change — genetics, combat, breeding and the UI all read from the data.
The species test in `tests/genetics.test.js` will immediately check that every
supported feature slot can be filled and every learnset move is performable.

### Adding a chapter

Append to `CHAPTERS` in `src/data/story.js`. A beat is either a `scene` (lines
of dialogue) or an `objective` (a `done(game)` predicate checked after every
state change). Keep story-critical breeding requirements trait-based rather
than species-based, per §4.2, and guarantee any required Echo fragments through
story rewards so random inheritance can never block progress.

---

## Design notes

- **No timers.** Eggs develop through completed activities — expeditions,
  battles, training, sanctuary projects. Closing the tab never costs progress
  and never earns it.
- **No gacha, no currency.** Kinbeasts are assigned and rehomed, not bought.
- **Rarity is not power.** Common species get higher fertility, wider genetic
  flexibility and easier habitats; rare species get specialised roles. A
  well-bred Mossbun is meant to stay useful.
- **Accessibility.** Colour is never the only carrier of information — every
  affinity has a glyph, every probability has text, every stage has a label.
  The interface honours `prefers-reduced-motion` and `prefers-color-scheme`.
- **The sanctuary forbids** parent-offspring and full-sibling pairings, and
  warns on close kin with a real Vigor penalty rather than a hidden one.

Full design intent lives in [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md).
