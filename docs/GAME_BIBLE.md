# The Broodkeeper's Oath — Game Bible

**Version 1.0** — the design source of truth for this repository. Code should
be checked against this document; where the two disagree, this document wins
unless a deliberate decision is recorded in `docs/DECISIONS.md`.

---

## 1. Project Overview

**Genre.** Single-player monster-taming, breeding, battling and
sanctuary-management role-playing game.

**Core format**

- Linear story campaign
- Top-down exploration
- Turn-based three-versus-three Kinbeast battles
- Multi-generational breeding and inheritance
- A central sanctuary that grows throughout the story
- Optional side quests and postgame breeding challenges

**Target length**

- Main story: 25–35 hours
- Main story plus side content: 45–60 hours
- Open-ended postgame breeding and battling

**Intended platforms.** Mobile browser optimised.

**Business model.** A complete premium game. Future expansions can add new
regions, Kinbeasts, breeding traits and story chapters without requiring
randomised purchases or real-time breeding timers.

---

## 2. Elevator Pitch

The Broodkeeper's Oath is a story-driven monster-taming RPG in which the player
inherits a ruined breeding sanctuary and a mysterious Kinbeast egg.

To protect the creature that hatches from it, the player must restore the
sanctuary, earn five regional Concord Seals, breed new generations of
Kinbeasts, and investigate a crisis causing monster bloodlines throughout the
kingdom to collapse.

Kinbeasts inherit more than statistics. They inherit colours, markings, body
features, abilities, temperaments, mutations, and fragments of ancestral memory
called Echoes.

By breeding multiple generations, the player reconstructs the forgotten events
that destroyed their family and uncovers a royal project intended to place
every Kinbeast under human control.

---

## 3. Core Player Fantasy

The player should feel like all of the following:

- A monster tamer forming meaningful bonds with wild creatures
- A breeder developing unique, recognisable family lines
- A trainer building strategically specialised battle teams
- A sanctuary keeper creating habitats where Kinbeasts live and interact
- A detective reconstructing history through inherited memories
- The founder of a new philosophy governing the relationship between humans
  and Kinbeasts

The player's greatest achievement is not simply defeating the final opponent.
It is building a living lineage that did not exist when the game began.

---

## 4. Design Pillars

### 4.1 Every Kinbeast Is an Individual

Two members of the same species can differ in coloration, markings, size,
horns/ears/crests/tails/wings/armour, statistical aptitudes, elemental
affinity, inherited moves, passive abilities, temperament, ancestral memories,
and relationships with other Kinbeasts.

The player should be able to recognise important Kinbeasts without reading
their names.

### 4.2 Breeding Is Central to Progression

Breeding is not optional background content. It is used to create stronger or
more specialised battle teams, produce Kinbeasts capable of surviving new
environments, preserve rare bloodlines, recover dormant traits, reconstruct
Echo memories, complete story objectives, restore species affected by the
Quieting, and prepare the final team needed to finish the campaign.

Story-critical breeding objectives are based on **traits rather than exact
species**, allowing several valid solutions.

### 4.3 Common Species Remain Valuable

Rarity measures how difficult a species is to find and breed. It does not
automatically determine combat power. A carefully bred Mossbun should remain
useful beside a Tempest Roc.

| | Common | Rare |
| --- | --- | --- |
| Fertility | Higher | Lower |
| Genetic flexibility | Greater | Narrower |
| Habitat needs | Easier | More demanding |
| Traits | Strong foundational | Unusual, specialised |
| Combat role | Broadly useful | Specialised, not universally superior |

### 4.4 The Story Is Linear

One fixed sequence of regions, one central mystery, one primary antagonist, one
final confrontation, one canonical ending.

Dialogue choices let the player express a compassionate, scholarly, humorous,
cautious or competitive personality, but they do not create faction locks or
alternate endings. Side quests can be completed in different orders; main
chapters always progress in the same sequence.

### 4.5 The Sanctuary Is Home

The player does not place unused Kinbeasts into abstract storage boxes. Every
owned Kinbeast lives somewhere within the sanctuary, where it can sleep, play,
train, form friendships, develop rivalries, bond with potential mates, raise
offspring, mentor juveniles, react to visitors and take part in small habitat
events.

The sanctuary becomes a physical history of the player's campaign.

---

## 5. The World

### The Kingdom of Alderreach

Alderreach was built through cooperation between humans and Kinbeasts.
Kinbeasts heat settlements, purify water, transport people and goods, pollinate
crops, produce medicine, locate minerals, carry messages and protect
settlements from wild monsters. Human civilisation cannot function without
them.

For hundreds of years the strongest bloodlines have been managed by four
regional Breeding Houses and the royal Crown Menagerie. That system is now
failing.

### The Quieting

Across Alderreach, Kinbeasts are producing fewer viable eggs. Some bloodlines
have stopped reproducing completely. Others produce offspring that are sickly,
unstable, or unable to use abilities their species once possessed. The
phenomenon is known as the Quieting because affected nests become unnaturally
still.

The Crown claims the Quieting is a natural cycle. The real cause is generations
of aggressive selective breeding, reduced genetic diversity, and experiments
conducted through the secret Sovereign Project.

### The Four Regional Houses

The Houses are major story locations and trial institutions rather than
competing player factions. Each guards one Concord Seal, awarded by defeating
its appointed Trial Master. A fifth seal is earned from the local Hearthmere
Trial.

- **House Embervale** — Flame, Stone and Metal Kinbeasts; mines, furnaces,
  mountain settlements.
- **House Greenmantle** — Grove, Tide and Chitin Kinbeasts; agriculture,
  medicine, environmental restoration.
- **House Tideborne** — aquatic Kinbeasts; shipping, fishing, water
  purification.
- **House Stormcrown** — flying, Frost, Gale and Spark Kinbeasts; transport and
  communication.

---

## 6. Important Terms

| Term | Meaning |
| --- | --- |
| **Kinbeast** | A magical creature capable of forming a Concord bond with humans and other Kinbeasts. |
| **Broodkeeper** | A licensed tamer, breeder, trainer and sanctuary manager. |
| **Concord** | The voluntary magical bond between a person and a Kinbeast. |
| **Echo** | A fragment of ancestral memory carried through a Kinbeast's bloodline. |
| **Primal Mark** | An ancient genetic trait preserved in a wild or previously isolated lineage. |
| **Legacy Mark** | A powerful inherited trait representing Vigor, Empathy or Memory. Central to the final chapters. |
| **The Quieting** | The widespread decline of Kinbeast fertility and genetic stability. |
| **The Night of Ash** | The disaster that destroyed the player's family sanctuary and ruined the Briarhold name. |
| **The Sovereign Project** | A secret Crown programme attempting to create a Kinbeast capable of controlling all other Kinbeasts. |
| **The First Wild** | The oldest known Kinbeast habitat, hidden beyond the Stormcrown Peaks. |

---

## 7. Player Character

The player is the final surviving heir of the Briarhold Sanctuary. As a child
they were sent away after the Night of Ash; their parents were blamed for
breeding an illegal monster that allegedly destroyed a nearby settlement. Years
later a letter arrives from the sanctuary's former caretaker, Master Orren
Hale, asking them to return.

Customisable: name, appearance, gender, clothing, dialogue personality, Keeper
Aptitude.

### Keeper Aptitudes

The selected aptitude provides a modest early advantage but does not change the
story. All three can eventually unlock every feature.

- **Handler** — wild Kinbeasts gain trust more quickly; temperaments are
  identified earlier; Bond Skills unlock slightly faster.
- **Breeder** — more inheritance information is visible before pairing;
  recessive traits are discovered earlier; nursery upgrades cost fewer
  resources.
- **Warden** — better tracking during exploration; more environmental resources
  gathered; rare wild encounters are easier to locate.

---

## 8. Main Characters

### Echoryx

A mysterious Kinbeast that hatches from an egg hidden beneath Briarhold's
ruined nursery. Small, physically unimpressive, and unable to breed during most
of the story. Its body subtly changes as it bonds with new species.

It is eventually revealed to be the only naturally stable result of the
Sovereign Project, and it carries pieces of the Night of Ash within its Echoes.

*Story function:* fixed story companion; source of major Echo visions;
universal breeding bridge after the late-game awakening; emotional centre of
the narrative. Echoryx does not have to remain in the player's active battle
team outside important story encounters.

### Master Orren Hale

The elderly former assistant to the player's parents, who remained at Briarhold
after the disaster and has kept the ruins from being reclaimed by the
wilderness. He teaches the player the basic breeding systems.

Orren eventually confesses that he secretly gave the Crown access to
Briarhold's research, believing it could solve the Quieting. His decision
allowed Director Veyra to create the first Sovereign. His arc is fixed: he
confesses, helps repair the damage, and remains at Briarhold as its senior
keeper.

### Aster Vale

A talented young breeder serving as the Crown Menagerie's official champion.
Aster believes careful optimisation and centralised breeding are the only ways
to prevent civilisation from collapsing, and repeatedly challenges the player
with new generations bred to counter the player's team. After witnessing the
truth of the Sovereign Project, Aster becomes an ally.

*Story function:* main recurring rival; demonstrates advanced breeding
strategies; represents optimisation without cruelty; joins the assault on the
Crown Menagerie; helps defend the sanctuary in the finale.

### Mara Thorn

A Warden who protects wild Kinbeast habitats outside House control. Mara
initially distrusts all institutional breeders, including the player, and
teaches them how to bond with territorial and rare Kinbeasts without forcibly
removing them from their habitats. She becomes the group's guide through the
First Wild.

### Director Selene Veyra

Head of the Crown Menagerie and primary human antagonist. Veyra believes
Kinbeasts are too important to civilisation to be allowed true independence.
Her goal is a stable Sovereign capable of regulating breeding, migration,
aggression, elemental abilities and human-Kinbeast bonds. She considers the
pain caused by the project unfortunate but necessary.

### The Pale Sovereign

The first major result of the Sovereign Project, created from hundreds of
incompatible bloodlines and carrying thousands of conflicting Echoes. It caused
the Night of Ash after escaping from the Crown laboratory beneath Briarhold.

It is not naturally evil. It is frightened, unstable and in constant pain. The
final objective is to defeat and calm it rather than kill it.

---

## 9. Linear Campaign Structure

### Prologue: Ashes at Briarhold

*Briarhold Sanctuary and the surrounding Hearthmere countryside.*

The player returns to the abandoned family sanctuary after receiving Orren's
letter. While clearing the collapsed nursery they discover a sealed chamber
containing a single egg. Echoryx hatches from it.

Director Veyra arrives and declares Echoryx Crown property — Briarhold's
licence was revoked after the Night of Ash, so the player legally has no right
to maintain a sanctuary. Orren invokes an old Concord law: any keeper who earns
all five regional Concord Seals may restore a revoked licence. Veyra allows the
challenge, believing the inexperienced player will fail.

*Introduces:* exploration, wild bonding, basic combat, sanctuary habitats,
Kinbeast care, Echoryx's first ability.

*Ending beat:* Echoryx produces its first Echo — a brief image of the player's
mother hiding the egg beneath the nursery.

### Chapter One: The Meadow Seal

*Hearthmere Fields. Objective: earn the first Concord Seal from the local
Meadow Trial.*

The Hearthmere Trial requires every candidate to raise at least one
second-generation Kinbeast. The player restores Briarhold's nursery, bonds with
several common species, produces their first egg, raises the offspring to the
juvenile stage, then enters and wins the Meadow Trial.

*Breeding requirement:* hatch any same-species offspring. The player is given
guaranteed access to compatible common Kinbeasts so progression never depends
on random encounters.

*Systems unlocked:* same-species breeding, basic physical inheritance, egg
incubation, Kinbeast family trees, naming bloodlines.

*Story reveal:* Echoryx's Echo shows the player's parents arguing with a Crown
official shortly before the Night of Ash.

### Chapter Two: The Trial of Embers

*The Emberbreak Range. Objective: solve a crisis in Embervale's furnace tunnels
and earn the Ember Seal.*

The Flame Kinbeasts powering Emberbreak's furnaces have become aggressive and
increasingly infertile. The Crown has been distributing a treatment that
temporarily increases power but damages long-term stability. The deepest
tunnels are too hot for the player's current team, so the player must breed the
Heatproof trait into a compatible Kinbeast. Inside, records connect the
treatment to the Crown Menagerie. The chapter ends with a formal battle against
Trial Master Maeve Embervale.

*Breeding requirement:* produce any Kinbeast capable of inheriting Heatproof or
an equivalent Flame-resistance trait. Several combinations satisfy it.

*Systems unlocked:* dominant and recessive alleles, breeding prediction,
specialised incubation habitats, environmental trait inheritance, limited trait
catalysts.

*Story reveal:* the Crown has known about the Quieting for years and has been
concealing the effects of its treatments.

### Chapter Three: The Blighted Brood

*Greenmantle Fen. Objective: restore a failing pollinator bloodline and earn
the Green Seal.*

Greenmantle's farms depend on a narrow group of closely managed bloodlines that
have become genetically uniform and vulnerable to a spreading blight. Mara
Thorn introduces the player to unregistered wild Greenmantle relatives. The
player must outcross compatible species and produce an offspring carrying
Hybrid Vigor, which helps restore the Sacred Grove, then defeat Trial Master
Rowan Greenmantle.

*Breeding requirement:* produce a cross-species offspring with the Hybrid Vigor
condition. The offspring retains the species form of the selected Form Parent
while inheriting transferable traits from both.

*Systems unlocked:* cross-species breeding, Brood Families, Hybrid Vigor,
advanced temperament inheritance, dormant physical traits, wild bloodline
registration.

*Story reveal:* Echoryx remembers Crown agents stealing copies of Briarhold's
breeding records.

### Chapter Four: The Drowned Hatchery

*Tideglass Coast. Objective: purify the Tideborne hatchery and earn the Tide
Seal.*

Coastal water-purification Kinbeasts have begun absorbing a strange chemical
residue originating from an abandoned Crown laboratory beneath the cliffs. The
player must breed a cleansing ability into a Tide-compatible Kinbeast to safely
navigate the flooded sections, where they discover the first surviving records
of the Sovereign Project. The chapter ends with a battle against Trial Master
Neris Tideborne.

*Breeding requirement:* produce a Tide-compatible Kinbeast carrying a
cleansing, filtering or poison-resistant inherited ability.

*Systems unlocked:* inherited combat moves, transferable passive abilities,
dual-affinity inheritance, dormant gene tracking, advanced Bond Skills.

*Story reveal:* the Crown was attempting to combine every major Kinbeast family
into a single controllable creature.

### Chapter Five: The Stormcrown Trial

*Stormcrown Peaks. Objective: disable a mysterious signal and earn the final
regional seal.*

Kinbeasts throughout the mountains are migrating toward an ancient sealed pass.
A Crown relay station is broadcasting a weak version of the Sovereign control
signal. The route to the station can only be located by an offspring carrying
the Echo-Sensitive trait. Aster Vale confronts the player at the summit and
defends the Crown's actions; the player defeats Aster in the Stormcrown Trial.
The damaged relay causes Echoryx's clearest memory yet.

*Breeding requirement:* produce or raise a Kinbeast capable of detecting Echo
residue.

*Systems unlocked:* full pedigree records, multi-generational trait tracking,
lineage stability, relatedness warnings, elder mentors, advanced battle
inheritance.

*Story reveal:* the Pale Sovereign — not the player's family — caused the Night
of Ash. Aster sees the memory and begins questioning Veyra.

### Chapter Six: Blood Remembers

*Briarhold Sanctuary and the ruins beneath it. Objective: reconstruct the
complete Echo of the Night of Ash.*

The player has all five Seals, but Veyra refuses to restore the licence without
proof of Crown involvement. Orren reveals an Echo chamber beneath the
sanctuary. Combining fragments carried by several related bloodlines
reconstructs the night, revealing that Orren gave Briarhold's research to
Veyra; Veyra created the Pale Sovereign; the Sovereign escaped beneath
Briarhold; the player's parents died containing it; and Veyra altered the
official records and blamed the sanctuary. Orren confesses.

*Breeding requirement:* reconstruct the Night of Ash Echo by raising
descendants carrying three guaranteed memory fragments. The fragments are
guaranteed through story rewards so random inheritance cannot block
progression.

*Systems unlocked:* Echo Hall, Echo reconstruction, Legacy Skills, ancestral
location memories, memory-based exploration.

*Story reveal:* Echoryx was created by the player's parents using a naturally
stable adaptation discovered within the Sovereign research. They hid it because
it was proof that Kinbeasts could achieve harmony without being controlled.

### Chapter Seven: The Crown Menagerie

*Highcourt and the royal Crown Menagerie. Objective: enter the Grand Concord
Tournament, expose Veyra, and recover the Sovereign records.*

The only legal way into the protected Menagerie is through the Tournament. The
player battles elite breeders while Aster and Mara investigate the laboratories
below. After winning, the player publicly presents the Night of Ash Echo. Veyra
responds by activating the Pale Sovereign, which breaks free, overwhelms the
Menagerie, and broadcasts a powerful call across Alderreach. Kinbeasts begin
migrating toward the First Wild.

*Breeding requirement:* stabilise at least one Primal Mark through two
generations. This trait weakens the Sovereign's control signal during battle.

*Systems unlocked:* Primal Mark restoration, rare-species breeding, controlled
trait stabilisation, Primal Conservatory, elite breeding contracts.

*Story reveal:* the Pale Sovereign is not calling Kinbeasts to conquer
Alderreach. It is calling them home.

### Chapter Eight: The First Wild

*The First Wild. Objective: reach the Pale Sovereign before Veyra's forces
recapture it.*

Mara guides the player, Orren and Aster through the ancient homeland of the
Kinbeasts. Three living gates protect the centre, each responding to a
different Legacy Mark:

- **Vigor** — a stable and diverse bloodline
- **Empathy** — a Kinbeast raised through strong bonds and healthy social
  relationships
- **Memory** — a lineage carrying a completed Echo

Any eligible species may satisfy these conditions. Within the First Wild,
Echoryx fully awakens and gains access to its adaptive genome. The player
learns that ancient Kinbeasts once shared memories freely, and that the Pale
Sovereign suffers because the Crown forced thousands of incompatible Echoes
into one body.

*Breeding requirement:* raise a roster collectively carrying Vigor, Empathy and
Memory. These do not have to exist in the same Kinbeast.

*Systems unlocked:* Very Rare species habitats, Echoryx breeding, universal
family compatibility, Legacy Mark transfer, final-tier sanctuary upgrades.

*Story reveal:* the Sovereign can be saved, but only if the player's inherited
lineages can separate its memories from the Crown's control signal.

### Chapter Nine: The Broodkeeper's Oath

*The Heart of the First Wild. Objective: defeat and calm the Pale Sovereign.*

**Stage One: The Gathering.** The player battles regional alpha Kinbeasts
affected by the Sovereign signal. The player's Primal Marks weaken the control
effect.

**Stage Two: The Pale Sovereign.** A direct fight. Its form, affinities and
abilities shift throughout the battle as different bloodlines surface.

**Stage Three: The Echo Storm.** The battle moves into a shared memory space.
The player's Vigor, Empathy and Memory lineages stabilise Echoryx, allowing it
to separate the Pale Sovereign's natural mind from the Crown control signal.
Director Veyra attempts to regain control and is overwhelmed by the same signal
she created. The player calms the Sovereign.

**Canonical ending.** The Sovereign Project is exposed. Veyra is removed from
power. The Crown Menagerie loses exclusive ownership of regional bloodlines.
The Houses are required to share genetic records. Protected wild populations
are established. Briarhold becomes Alderreach's first independent public
sanctuary. Orren remains as senior keeper. Mara oversees the First Wild
preserve. Aster establishes a new competitive league focused on healthy,
diverse bloodlines. The Pale Sovereign remains in the First Wild as its
guardian. The player takes the Broodkeeper's Oath and becomes Briarhold's new
master.

---

## 10. Core Gameplay Loop

1. Explore a region.
2. Discover wild Kinbeasts and environmental resources.
3. Build trust and form Concord bonds.
4. Return to Briarhold.
5. Improve habitats and facilities.
6. Train, socialise and pair Kinbeasts.
7. Hatch and raise a new generation.
8. Build a battle team around inherited traits.
9. Complete regional quests and trials.
10. Unlock the next story chapter.

Breeding continues while the player explores. **There are no real-world
timers.** Egg development advances through completed activities: expeditions,
battles, training sessions, sanctuary projects and story quests.

---

## 11. Wild Bonding

Kinbeasts are not captured inside objects. A wild Kinbeast joins the player by
accepting a Concord Mark.

During or after an encounter the player responds to the Kinbeast's temperament.
Possible approaches include offering food, healing an injury, matching a
playful challenge, demonstrating strength, remaining still, protecting its
nest, returning a lost offspring, or defeating it honourably.

Aggressive Kinbeasts may respect victory. Curious Kinbeasts may follow the
player after an environmental puzzle. Protective Kinbeasts may only join after
their family is made safe.

Rare and Very Rare Kinbeasts require multi-stage quests rather than
probability-based capture attempts.

---

## 12. Breeding and Genetics

### 12.1 Breeding Philosophy

Kinbeast reproduction is magical rather than strictly biological. Any two
compatible adult Kinbeasts may produce an egg if they share at least one Brood
Family, have sufficient social compatibility, are housed in an appropriate
habitat, neither is under severe stress, and the player has constructed the
required nursery.

The player selects a **Form Parent** (determines the offspring's base species)
and a **Trait Parent** (contributes physical, combat, temperament and Echo
traits). Both parents contribute equally to the genome; the Form Parent only
determines which species body template the offspring uses.

### 12.2 Brood Families

| Family | Description |
| --- | --- |
| **Feral** | Mammalian and warm-blooded terrestrial Kinbeasts. |
| **Wing** | Birdlike, feathered or naturally flying Kinbeasts. |
| **Scale** | Reptilian, draconic, armoured and shell-bearing Kinbeasts. |
| **Tide** | Aquatic and amphibious Kinbeasts. |
| **Bloom** | Plant-symbiotic and fungal Kinbeasts. |
| **Chitin** | Insectoid and exoskeletal Kinbeasts. |
| **Wisp** | Spectral, dreamlike and Echo-sensitive Kinbeasts. |

Many species belong to two families and act as breeding bridges. Echoryx
becomes compatible with all families after Chapter Eight.

### 12.3 Genome Categories

Each Kinbeast carries two alleles at every major genetic locus.

- **Species Form** — base species and overall body structure.
- **Build** — size, weight, strength, speed, food requirements, physical
  resilience. Large builds favour Vitality and Power; small builds favour Speed
  and evasion. Neither is universally superior.
- **Colour** — primary body, secondary, accent, eye and glow channels.
- **Pattern** — stripes, spots, bands, masks, mottling, metallic veining,
  luminous markings, or none.
- **Structural Features** — approved modular slots: horn shape, ear shape,
  crest, mane, tail, spines, shell shape, wing shape, leaf growth, whiskers,
  tusks. Cross-species traits only appear when the offspring's body supports
  the required feature tag; unsupported genes remain dormant and may reappear
  in a later compatible generation.
- **Affinity** — elemental strengths, weaknesses and available move families. A
  species may inherit its normal primary affinity, a secondary affinity, an
  altered affinity variant, or a dormant affinity gene.
- **Statistical Aptitudes** — Vitality, Power, Guard, Focus, Speed, Resolve.
  Genetics determines potential ranges; training determines how much of that
  potential is reached.
- **Combat Moves** — offspring may inherit compatible moves from either parent
  (Legacy Moves). A Kinbeast cannot inherit a move its anatomy cannot perform.
- **Passive Abilities** — one species passive, one inheritable passive slot,
  one temperament reaction, one Bond Skill.
- **Temperament** — two inherited tendencies from: Protective, Aggressive,
  Curious, Loyal, Social, Independent, Patient, Bold, Nervous, Playful,
  Territorial, Gentle. Combinations create specific personalities (Protective +
  Bold = Guardian; Curious + Independent = Explorer; Gentle + Social =
  Nurturer; Aggressive + Loyal = Enforcer; Nervous + Aggressive = Volatile;
  Patient + Territorial = Sentinel). Temperament affects battle reactions,
  bonding speed, social compatibility, breeding compatibility, habitat
  behaviour and exploration bonuses.
- **Echoes** — inherited fragments of ancestral memory: a person, a location, a
  sound, a battle, a learned technique, a moment of fear, a moment of trust, a
  hidden path, a major historical event. Compatible fragments can be assembled
  in the Echo Hall to unlock story scenes, hidden areas, Legacy Moves, rare
  breeding locations, Primal bloodlines and historical records.
- **Stability** — how comfortably a Kinbeast's traits function together. Low
  Stability may cause higher stamina costs, unpredictable affinity changes,
  failed passive activations, temperament stress and reduced fertility. High
  Stability improves reliability but does not directly increase every
  statistic.
- **Vigor** — genetic diversity and physical resilience. Outcrossing unrelated
  compatible bloodlines can produce Hybrid Vigor. Repeatedly narrowing a
  bloodline may improve trait predictability but gradually reduces Vigor.
  Direct parent-offspring and full-sibling pairings are prohibited by the
  sanctuary system.

### 12.4 Trait Expression

Alleles may be dominant, recessive, codominant, incompletely dominant, dormant,
or linked to another trait.

A recessive trait can remain hidden for several generations before reappearing.
Codominant traits may visually combine — a red and white colour gene might
produce a red-and-white pattern rather than one colour replacing the other.

The Gene Archive gradually reveals more exact inheritance information as it is
upgraded.

### 12.5 Mutation

Mutation is uncommon and should feel exciting rather than routine. Possible
mutations include unusual coloration, altered markings, a new structural
feature, a shifted affinity, a modified passive, increased Echo sensitivity, a
rare temperament, or an unstable but powerful combat effect.

Basic mutations occur naturally at a low rate. Optional catalysts can increase
mutation chances but also increase Instability.

**The offspring's complete genome is determined when the egg is created, not
when it hatches.**

### 12.6 Breeding Interface

The breeding screen displays parent portraits, Brood Families, compatibility,
social relationship, relatedness, predicted species form, possible colours,
possible patterns, possible structural traits, potential affinities,
inheritable moves, temperament possibilities, known Echo fragments, a Stability
estimate and a Vigor estimate.

Early in the game predictions are broad. Late-game Gene Archive upgrades reveal
exact percentage ranges and hidden alleles.

### 12.7 Raising Offspring

| Stage | Capability |
| --- | --- |
| **Hatchling** | Cannot battle. Forms early relationships and reveals visible traits. |
| **Juvenile** | Can train, explore safe areas, and participate in supervised battles. |
| **Adult** | Can participate in all battles and breeding. |
| **Elder** | Remains usable and gains access to mentorship. |

Elders can teach Legacy Moves, temperament control, species techniques and
training bonuses. **Kinbeasts do not die of old age in the base game.**

### 12.8 Example Crosses

- **Cinderkit (Form) + Frostfang (Trait)** — Cinderkit body, thicker Frostfang
  mane, pale ember coloration, increased cold resistance, pack-oriented
  temperament, inherited Frost move, dormant Frost affinity.
- **Mossbun (Form) + Crownstag (Trait)** — Mossbun body, small branch antlers,
  improved healing aptitude, protective temperament, Light secondary affinity,
  Crownstag Echo fragment.
- **Pebbleback (Form) + Ironhorn (Trait)** — Pebbleback body, metallic shell
  plates, higher physical Guard, small horn feature, Iron Resolve passive,
  reduced Speed.

Crossbreeding does not create an entirely new permanent species at launch. It
creates inherited variants of the Form Parent's species.

---

## 13. Combat System

**Team structure.** Three active Kinbeasts and three reserves, which may switch
positions during battle.

**Battle format.** Turn-based combat on a visible initiative timeline. Each
Kinbeast has four equipped active moves, one species passive, one inherited
passive, one temperament reaction and one Bond Skill.

**Combat roles.** Species are generally designed around one or two of: Striker,
Bruiser, Defender, Skirmisher, Controller, Support, Healer. Breeding can adjust
a species within its identity but should not erase its core role.

**Temperament reactions.** Protective Kinbeasts may intercept an attack;
Aggressive may counterattack; Curious may identify an enemy weakness; Loyal may
resist fear when an ally is injured; Nervous may gain Speed when threatened;
Territorial may become stronger while holding the front position.

**Family and relationship bonuses.** Parent-and-offspring assists, sibling
combination attacks, mentor-and-student Focus bonuses, bonded-pair defensive
reactions. These remain modest so unrelated teams stay competitive.

**Battle objectives.** Not every battle requires defeating every opponent.
Objectives include: defeat the opposing team, survive a set number of rounds,
protect a nest, calm a rampaging Kinbeast, break a control device, escort a
juvenile, capture a battlefield position.

**Kinbeasts do not permanently die in standard mode.**

---

## 14. Sanctuary System

Briarhold begins as a ruined estate with one usable meadow and eventually
becomes a large collection of specialised habitats and research facilities.

**Core facilities.** Nursery (breeding and egg production), Hatchery
(incubation temperature, moisture, light and elemental conditions), Gene
Archive (alleles, pedigrees, inherited moves, relatedness), Echo Hall
(reconstructing ancestral memories), Clinic (injuries, stress, Instability),
Training Yard (combat statistics and move mastery), Primal Conservatory (rare
and restored bloodlines), Grand Arena (tournament preparation and postgame
battles).

**Habitat types.** Meadow, Forest, Wetland, Tide Pool, Furnace, Stone Grotto,
Mountain Crag, Canopy, Frost Den, Moon Garden, Storm Perch, First Wild
Preserve.

**Social simulation.** Kinbeasts develop friendships, rivalries, family bonds,
mentor relationships, preferred mates, disliked neighbours, favourite
activities and favourite habitat locations. Care is managed primarily at the
habitat level rather than through constant individual hunger meters. The
objective is meaningful observation, not repetitive maintenance.

---

## 15. Progression

**Broodkeeper Rank** increases through story chapters, Concord Seals, sanctuary
upgrades, completed bloodline projects and regional service contracts. Higher
ranks unlock larger active rosters, new facilities, advanced breeding
information, rare habitat permits and additional training options.

**Kinbeast progression** comes from battle experience, training, bond
development, mentorship, inherited potential, Legacy Moves and Primal Marks.
Level alone cannot create the perfect Kinbeast — genetics, training,
temperament and team role all matter.

**Bloodline naming.** The player may name important family lines (Briarhold
Ember Line, Silverbrook Guardians, Moonthorn Line, First Concord Line). Named
lines receive dedicated pedigree pages and can be displayed in the Hall of
Lineages.

---

## 16. The 30 Initial Kinbeast Species

Rarity distribution: 12 Common, 8 Uncommon, 6 Rare, 4 Very Rare. **Rarity does
not equal raw power.**

### Common

**1. Mossbun** — Grove · Feral/Bloom · Support. A hare-sized Kinbeast covered in
soft green fur, with leaf-shaped ears and a small patch of living moss across
its back. *Softstep:* restores a small amount of health to the weakest ally
when Mossbun enters battle. *Breeding value:* high fertility, gentle
temperaments, healing aptitude, leaf ears, moss patterns, strong nursery
behaviour. *First found:* Hearthmere Fields.

**2. Cinderkit** — Flame · Feral · Skirmisher. A foxlike Kinbeast with charcoal
paws, bright eyes, and a tail that glows like a banked ember. *Flashkindle:*
its first attack deals additional damage when acting before its target.
*Breeding value:* Speed, Flame moves, ember-tail features, warm coloration,
Bold temperament, heat resistance. *First found:* Hearthmere and Emberbreak.

**3. Brookfin** — Tide · Tide/Feral · Healer. A playful otterlike creature with
fin-shaped ears, webbed paws and a flexible fish tail. *Clearwater:* healing an
ally also removes one minor negative condition. *Breeding value:* poison
resistance, cleansing moves, social temperaments, strong fertility, blue or
silver coloration. *First found:* Hearthmere rivers and Tideglass Coast.

**4. Pebbleback** — Stone · Scale · Defender. A squat armadillo-like Kinbeast
protected by overlapping stone plates. *Curlguard:* after using Guard,
Pebbleback's next physical attack gains additional force. *Breeding value:*
armour traits, high Guard potential, shell patterns, Patient temperament, Stone
resistance. *First found:* Hearthmere hills and Emberbreak foothills.

**5. Galecrest** — Gale · Wing · Speed Support. A long-legged bird with a
sweeping feather crest that changes direction with the wind. *Tailwind Cry:*
slightly increases the team's Speed when Galecrest enters battle. *Breeding
value:* feather crests, Wing-compatible moves, Speed aptitude, alert
temperaments, Gale affinity. *First found:* Hearthmere grasslands and
Stormcrown foothills.

**6. Glowgrub** — Light · Chitin · Support. A large, gentle larva with a
lantern-like abdomen and luminous facial markings. *Warm Glow:* restores a
small amount of health to all allies at the end of each third round. *Breeding
value:* luminescent colours, Light affinity, recovery passives, calm
temperaments, mutation sensitivity. *First found:* Hearthmere caves and
Greenmantle groves.

**7. Brambletusk** — Grove/Stone · Feral/Bloom · Bruiser. A broad boarlike
Kinbeast with bark-covered shoulders and thorny vines wrapped around its tusks.
*Thornhide:* physical attackers take minor retaliatory damage. *Breeding
value:* Power aptitude, tusk features, bark armour, Bold temperament,
retaliatory passives. *First found:* Greenmantle Fen.

**8. Mudsprig** — Tide/Grove · Tide/Bloom · Controller. A frog-salamander
Kinbeast with a small living sprout growing from its head. *Bog Bloom:* slowed
enemies take additional Grove damage while Mudsprig is present. *Breeding
value:* dual-affinity inheritance, flexible incubation requirements, root
effects, adaptable temperaments. *First found:* Greenmantle marshes.

**9. Sparkmidge** — Spark · Chitin · Fast Striker. A large dragonfly-like insect
that stores electricity along its transparent abdomen. *Chain Static:* Spark
attacks have a chance to jump to a second opponent. *Breeding value:* high
Speed, electrical markings, chain attacks, energetic temperaments, Spark
affinity. *First found:* Stormcrown lowlands.

**10. Duskmew** — Shade · Feral/Wisp · Status Skirmisher. A small smoky feline
with crescent-shaped pupils and fur that blurs around the edges in low light.
*Fade Step:* automatically evades the first direct attack made against it.
*Breeding value:* Shade affinity, unusual eye colours, stealth passives,
Independent temperament, Echo sensitivity. *First found:* Hearthmere at night.

**11. Shellip** — Tide/Stone · Tide/Scale · Defender. A small turtle-crab
Kinbeast with a wide scalloped shell and paddle-like feet. *Safe Harbor:*
places a temporary shield on the weakest ally when Shellip drops below half
health. *Breeding value:* shell shapes, defensive passives, aquatic
adaptability, Loyal temperament, patterned armour. *First found:* Tideglass
shallows.

**12. Embermole** — Flame/Stone · Feral · Burrowing Bruiser. A heavy-clawed mole
with glowing furnace lines beneath its dark fur. *Burrowheat:* disappears
beneath the battlefield before emerging under an enemy with a Flame attack.
*Breeding value:* Heatproof traits, digging exploration abilities, Power
aptitude, thermal markings, Flame resistance. *First found:* Emberbreak
tunnels.

### Uncommon

**13. Ironhorn** — Metal/Stone · Feral/Scale · Defender. *Iron Resolve:* gains
Guard whenever it resists a physical attack. *First found:* Emberbreak
highlands.

**14. Reedstalker** — Tide/Grove · Wing/Tide · Ambush Controller. *Stillwater
Ambush:* deals additional damage after completing a round without being
attacked. *First found:* Greenmantle and Tideglass wetlands.

**15. Sunplume** — Light/Gale · Wing · Support Striker. *Dawn Chorus:* damages
Shade enemies while cleansing fear and blindness from allies. *First found:*
Tideglass cliffs.

**16. Frostfang** — Frost · Feral · Pack Striker. *Pack Chill:* consecutive
attacks against the same target build increasing Chill. *First found:*
Stormcrown snowfields.

**17. Thornmantis** — Grove · Chitin/Bloom · Precision Striker. *Pruning
Strike:* critical-hit chance increases against rooted or slowed opponents.
*First found:* Greenmantle canopy.

**18. Volcaram** — Flame/Stone · Feral/Scale · Bruiser. *Pressure Furnace:*
Power increases as Volcaram loses health. *First found:* Emberbreak caldera.

**19. Mirewisp** — Shade/Tide · Wisp/Tide · Controller. *Drowning Fog:* creates
mist that reduces enemy accuracy and strengthens Shade and Tide effects. *First
found:* Greenmantle at night.

**20. Voltclaw** — Spark/Gale · Feral/Wing · Skirmisher. *Overcharge:*
consecutive skill use increases Speed, but excessive use may briefly stun
Voltclaw. *First found:* Stormcrown cliffs.

### Rare

**21. Runebear** — Stone/Aether · Feral/Wisp · Guardian. *Ancestral Ward:*
activating an Echo or Legacy Skill creates a shield around the team. *First
found:* ruins beneath Stormcrown and the First Wild.

**22. Tidewarden** — Tide/Light · Tide/Scale · Defensive Healer. *Life Current:*
healing effects become stronger whenever rain or water terrain is active.
*First found:* deep Tideglass caverns.

**23. Glasswing** — Light/Gale · Chitin/Wing · Evasive Support. *Prismatic
Veil:* the first elemental attack received each battle is partially reflected.
*First found:* Greenmantle's Sacred Grove.

**24. Ashwyrm** — Flame/Shade · Scale/Wisp · Damage Striker. *Cinder Rebirth:*
once per battle, Ashwyrm can return at low health if a burning creature is
present. *First found:* Emberbreak's sealed volcanic chambers.

**25. Crownstag** — Grove/Light · Feral/Bloom · Healer and Protector. *King's
Canopy:* smaller allies receive reduced damage and increased healing. *First
found:* Greenmantle's inner grove and the First Wild.

**26. Moonveil** — Shade/Aether · Feral/Wisp · Illusion Controller. *Dreamstep:*
exchanges places with an ally and leaves an illusion behind. *First found:*
Briarhold's underground ruins and the First Wild at night.

### Very Rare

**27. Tempest Roc** — Spark/Gale · Wing/Scale · Siege Striker. *Eye of the
Storm:* creates storm terrain when entering battle. Only one wild Tempest Roc
can be bonded during the main story; further members must be bred in the
postgame. *First found:* Stormcrown summit.

**28. Rootwarden** — Grove/Stone · Bloom/Scale · Fortress Support. *Living
Sanctuary:* a portion of the damage Rootwarden receives is converted into
gradual healing for its allies. Eggs require the fully upgraded Primal
Conservatory. *First found:* the First Wild.

**29. Starcoil** — Light/Aether · Scale/Wisp · Arcane Controller. *Celestial
Loop:* once per battle, repeats the last non-damaging move used by an ally. Can
only produce eggs beneath specific moon and habitat conditions. *First found:*
the Echo Vault within the First Wild.

**30. Echoryx** — Aether/Adaptive · all families after awakening · Adaptive
Support. A small four-legged Kinbeast whose ears, tail, markings and elemental
glow subtly change according to its bonds and inherited traits. *Living
Lineage:* Echoryx may equip one compatible inherited passive from any Brood
Family. Before Chapter Eight it cannot breed and expresses only limited
adaptive traits. After awakening it becomes a universal breeding bridge whose
offspring retain the other Form Parent's species while gaining an increased
chance of expressing dormant traits. *First found:* the hidden egg beneath
Briarhold.

---

## 17. Postgame

- **Grand Concord League** — increasingly difficult battles against elite
  breeders using advanced multi-generational teams. Aster oversees the league
  and regularly updates opponent lineages.
- **House Rematches** — each regional Trial Master develops a postgame team
  built from restored Primal bloodlines.
- **Very Rare Breeding** — additional Tempest Rocs, Rootwardens, Starcoils and
  Echoryx-linked offspring.
- **Restoration Contracts** — communities request Kinbeasts with specific
  traits (a Heatproof Brookfin for a volcanic settlement; a Glowgrub with Frost
  resistance for a northern hospital; a gentle Brambletusk for agricultural
  work; a Tide Kinbeast carrying a lost cleansing ability; a Galecrest capable
  of flying through storm terrain). Rewards are sanctuary upgrades, rare
  traits, cosmetic items and historical Echoes. Kinbeasts are assigned or
  rehomed rather than sold as disposable inventory.
- **Lost Lineages** — reconstruct extinct regional variants through dormant
  genes and Primal Marks.
- **Sanctuary Exhibition** — display favourite Kinbeasts, named bloodlines,
  rare mutations, reconstructed Echoes, tournament trophies and pedigree
  histories.

---

## 18. Art Direction

**Overall style.** Warm, painterly fantasy with readable silhouettes and
expressive creature animation. The world begins weathered and subdued; colour
gradually returns as Briarhold and the regional ecosystems recover.

**Kinbeast design rules.** Every species should have a recognisable silhouette,
one prominent identifying feature, a clear habitat influence, a visible
emotional range, modular inheritance slots, and easily readable rarity without
excessive visual clutter. Rare species may be larger or more elaborate, but
Common species should remain equally appealing.

**Modular creature art.** Each species should support multiple body sizes,
three or more primary palettes, secondary and accent colours, several pattern
overlays, two or more structural feature variations, eye colour variations,
optional glow effects and inherited feature overlays. Full freeform species
fusion is not required — inherited traits are mapped onto approved slots so the
art workload stays manageable.

**Sanctuary visual development.**

- *Beginning:* broken fences, dead gardens, collapsed nursery, empty habitats,
  faded family banners.
- *Midgame:* repaired habitats, active nursery, visiting keepers, juveniles
  playing, restored gardens, expanding archive.
- *Endgame:* large natural preserves, rare Kinbeast habitats, Echo Hall, Primal
  Conservatory, public training arena, Hall of Lineages, a visible community
  surrounding Briarhold.

---

## 19. User Interface Direction

The interface should resemble a Broodkeeper's field journal.

- **Kinbeast Profile** — portrait, species, generation, parents, affinities,
  statistics, temperament, moves, passives, bond, Stability, Vigor, Echoes,
  visible and hidden traits.
- **Pedigree Screen** — a scrollable family tree with portraits, trait filters,
  move filters, Echo markers, relatedness and named lineage labels.
- **Breeding Preview** — clear probability ranges and visual previews rather
  than walls of numbers.
- **Sanctuary Map** — Kinbeasts physically moving between habitats.
- **Echo Archive** — reconstructed memories as illustrated fragments that
  gradually form complete scenes.

**Colour-dependent information must also use icons, patterns and text for
accessibility.**

---

## 20. Audio Direction

- **Sanctuary music** — warm acoustic instruments, light woodwinds, soft
  percussion, ambient Kinbeast calls.
- **Exploration music** — each region has a distinct natural soundscape and
  musical identity.
- **Battle music** — rhythmic and energetic without becoming excessively
  aggressive. Important battles incorporate motifs associated with the player's
  sanctuary.
- **Echo music** — distant voices, reversed natural sounds, soft choral
  textures, fragments of previously heard themes.
- **Pale Sovereign theme** — begins as overlapping versions of multiple
  regional themes playing in conflict; during the final Echo phase the themes
  gradually align into a single harmonious arrangement.

---

## 21. Initial Production Scope

### Vertical Slice

- Briarhold Sanctuary
- Hearthmere Fields
- Six Common species: Mossbun, Cinderkit, Brookfin, Pebbleback, Galecrest,
  Glowgrub
- Basic wild bonding
- Three-versus-three combat
- One habitat
- The Nursery
- Same-species breeding
- Colour, pattern, size and temperament inheritance
- One inherited move
- One Echo sequence
- The Meadow Trial

### Full Base Game

30 species · 10 major story sections including the prologue · six primary
regions · five Concord Seals · eight major sanctuary facilities · seven Brood
Families · multi-generational pedigrees · physical, combat, temperament and
Echo inheritance · Rare and Very Rare breeding · Grand Concord postgame ·
restoration contracts · open-ended sanctuary development.

---

## 22. Rules for Adding Future Species

Every new species must contribute something meaningful to breeding, and must
specify: rarity; primary habitat; one or two affinities; one or two Brood
Families; a clear visual silhouette; a primary combat role; a signature passive
or move; at least one valuable inheritable trait; supported modular body tags;
temperament tendencies; Echo potential; breeding difficulty; and a sanctuary
habitat requirement.

New species should not exist only to provide stronger statistics. They should
expand at least one of: team strategy, family compatibility, visual
inheritance, sanctuary behaviour, exploration utility, Echo reconstruction, or
environmental interaction.

Future regions can be added beyond Alderreach while Briarhold remains the
persistent central sanctuary.

---

## 23. Final Identity

The Broodkeeper's Oath is not primarily about collecting every monster. It is
about raising generations.

The Kinbeast found in the first hour may become the parent, grandparent or
ancestor of a creature used in the final battle. A harmless coloration gene may
remain hidden for four generations. A retired Common Kinbeast may carry the
Echo that clears the player's family name. A supposedly imperfect offspring may
introduce the trait that saves an entire species.

The player does not finish the game with a box full of interchangeable
creatures. They finish with a sanctuary full of families, histories, memories
and bloodlines that exist because of the decisions they made.
