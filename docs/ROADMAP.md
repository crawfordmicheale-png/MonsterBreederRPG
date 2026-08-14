# Roadmap

The vertical slice (Game Bible §21) is complete and playable. This is what
comes next, in the order it is worth building.

## Next up — Chapter Two: The Trial of Embers

The slice deliberately ships the systems Chapter Two needs to demonstrate, so
this is mostly content plus one new mechanic.

- **Emberbreak Range region** — three sites, Flame/Stone encounter tables, a
  furnace-tunnel area gated on heat resistance.
- **Environmental trait gating** — the first place breeding unlocks *terrain*
  rather than power. Needs a `Heatproof`-style inheritable resistance trait and
  an area check against it. Per §4.2 the gate must accept several trait
  combinations, not one species.
- **Trait catalysts** — the consumable that raises mutation rate at the cost of
  Stability. The genetics engine already accepts `{ catalyst: true }`; it needs
  an item, a cost and a place in the breeding screen.
- **Species 7–12** (`Brambletusk`, `Mudsprig`, `Sparkmidge`, `Duskmew`,
  `Shellip`, `Embermole`) — data plus one painter each.
- **Trial Master Maeve Embervale** and the Ember Seal.

## Then

**Chapter Three — cross-species breeding.** The compatibility system already
gates outcrossing behind `flags.cross_species_unlocked` and already computes
Hybrid Vigor; Greenmantle turns both on. Needs Brood Family bridging content,
wild bloodline registration, and the Sacred Grove restoration.

**Chapter Four — inherited passives.** Offspring currently inherit moves,
appearance, aptitudes, temperament and Echoes. The `inheritable passive slot`
from §12.3 is specified but not yet implemented; Tideglass is where it belongs.

**Chapter Five — the pedigree at depth.** Relatedness, dormant tracking and
Elder mentors exist but are only lightly used. Stormcrown should make
multi-generational planning the actual puzzle, and add lineage Stability.

**Chapters Six to Nine** — Echo reconstruction at scale, Primal Marks, the
three Legacy Marks, the First Wild, and the three-stage finale.

## System work that is not tied to a chapter

- **Sanctuary map view** (§19) — Kinbeasts physically moving between habitats
  rather than a portrait row per habitat. The social simulation already
  produces friendships and rivalries worth watching.
- **Richer habitat events** — the simulation currently ticks relationships
  quietly. It should surface small scenes.
- **Audio** (§20) — nothing is implemented. Region themes and the sanctuary
  motif first; the Pale Sovereign's converging-themes trick last.
- **Combat objectives beyond `defeat`** — `survive`, `calm` and `protect` are
  implemented in the engine and tested, but no encounter uses them yet.
- **Elder mentorship UI** — `Game.mentor()` works; there is no screen for it.
- **Restoration contracts** (§17) — a good source of mid-game direction, not
  just postgame.

## Known gaps in the slice

- Echoryx uses the Mossbun body template. Its adaptive form is a Chapter Eight
  system, but it should get its own painter before then.
- Only two Echoes exist, and only one is reachable in normal play.
- The Gene Archive has two levels; the bible implies a longer upgrade path.
- No Elder is reachable in the slice — retirement needs level 20, which is past
  where Chapter One ends.
