# Roadmap

The prologue, Chapter One and Chapter Two are complete and playable. This is
what comes next, in the order it is worth building.

## Next up — Chapter Three: The Blighted Brood

Greenmantle is where cross-species breeding stops being a locked flag and
becomes the chapter's subject. Chapter Two already switches
`flags.cross_species_unlocked` on at its close, and Hybrid Vigor is computed
and tested, so this is mostly content plus the systems around outcrossing.

- **Greenmantle Fen region** — three or four sites, Grove/Tide encounter
  tables, a blighted grove that recovers visibly as the chapter progresses.
- **Wild bloodline registration** — Mara's unregistered relatives need to be a
  distinct source of stock from the House lines, with genuinely different
  allele pools. This is the mechanic that makes the outcross *matter* rather
  than being a reskinned pairing.
- **A blight that reads as low diversity** — the Fen's farmed lines should be
  visibly homozygous in the Gene Archive, so the player can see the problem in
  the pedigree before it is explained to them.
- **Species 13–17** (`Ironhorn`, `Reedstalker`, `Sunplume`, `Thornmantis`,
  `Volcaram`) — data plus one painter each.
- **Trial Master Rowan Greenmantle** and the Green Seal.

## Then

**Chapter Four — inherited passives.** Offspring inherit moves, appearance,
aptitudes, temperament, resistances and Echoes. The *inheritable passive slot*
from §12.3 is still specified-but-unbuilt, and Tideglass is where it belongs.
The `toxin` hazard already exists in `environment.js`, unused, waiting for it.

**Chapter Five — the pedigree at depth.** Relatedness, dormant tracking and
Elder mentors exist but are lightly used. Stormcrown should make
multi-generational planning the actual puzzle, and add lineage Stability. The
`chill` hazard is likewise already defined and unused.

**Chapters Six to Nine** — Echo reconstruction at scale, Primal Marks, the
three Legacy Marks, the First Wild, and the three-stage finale.

## System work that is not tied to a chapter

- **Sanctuary map view** (§19) — done: habitats as plots with moving portraits.
- **Richer habitat events** — friendship/rivalry moments surface as short scenes.
- **Audio** (§20) — sanctuary bed is in; region themes and battle motifs still open.
- **Combat objectives beyond `defeat`** — Furnace Road uses `calm`; `survive` /
  `protect` still wait for later chapters.
- **Elder mentorship UI** — `Game.mentor()` works; there is no screen for it,
  and nothing in the campaign yet reaches the level-20 retirement threshold.
- **Restoration contracts** (§17) — good mid-game direction, not just postgame.

## Known gaps

- Four Echoes exist; only two are reachable in normal play.
- The Gene Archive has two levels; the bible implies a longer upgrade path.
- Trait catalysts are the only use for Thermal Salt, and Ember Ash and Iron
  Scrap are only spent on two projects each. The Emberbreak economy is thin.
- The `heat` hazard is the only one wired into a site. `toxin` and `chill` are
  defined and tested but do not gate anything yet.

## Presence work (done)

- Echoryx has its own species, silhouette painter, and Bond Skill.
- Sanctuary map view with Kinbeasts on habitat plots; ash→recovery theming.
- Ceremonial hatch and Concord reveals; habitat friendship/rivalry scenes.
- Furnace Road calm fight; louder temperament reaction banners.
- Procedural sanctuary audio bed; title-screen egg; labelled roster meters.
