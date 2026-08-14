// Temperament tendencies. Every Kinbeast inherits two; the pair resolves into
// a named personality that drives battle reactions, bonding and habitat life.

export const TENDENCIES = {
  protective:  { id: 'protective',  name: 'Protective',  bond: 0.9, social: 1.1 },
  aggressive:  { id: 'aggressive',  name: 'Aggressive',  bond: 0.7, social: 0.8 },
  curious:     { id: 'curious',     name: 'Curious',     bond: 1.2, social: 1.0 },
  loyal:       { id: 'loyal',       name: 'Loyal',       bond: 1.1, social: 1.1 },
  social:      { id: 'social',      name: 'Social',      bond: 1.2, social: 1.3 },
  independent: { id: 'independent', name: 'Independent', bond: 0.8, social: 0.7 },
  patient:     { id: 'patient',     name: 'Patient',     bond: 1.0, social: 1.1 },
  bold:        { id: 'bold',        name: 'Bold',        bond: 1.0, social: 0.9 },
  nervous:     { id: 'nervous',     name: 'Nervous',     bond: 0.7, social: 0.8 },
  playful:     { id: 'playful',     name: 'Playful',     bond: 1.2, social: 1.2 },
  territorial: { id: 'territorial', name: 'Territorial', bond: 0.7, social: 0.6 },
  gentle:      { id: 'gentle',      name: 'Gentle',      bond: 1.2, social: 1.2 },
};

export const TENDENCY_IDS = Object.keys(TENDENCIES);

// Named personalities produced by specific tendency pairs (order-insensitive).
const PERSONALITIES = [
  { pair: ['protective', 'bold'],        name: 'Guardian',   note: 'Steps in front of wounded allies without being asked.' },
  { pair: ['curious', 'independent'],    name: 'Explorer',   note: 'Wanders the sanctuary edges and comes back with things.' },
  { pair: ['gentle', 'social'],          name: 'Nurturer',   note: 'Settles hatchlings and calms stressed neighbours.' },
  { pair: ['aggressive', 'loyal'],       name: 'Enforcer',   note: 'Answers any threat to its bonded keeper immediately.' },
  { pair: ['nervous', 'aggressive'],     name: 'Volatile',   note: 'Reacts first, understands later. Dangerous and fast.' },
  { pair: ['patient', 'territorial'],    name: 'Sentinel',   note: 'Chooses one place and holds it for years.' },
  { pair: ['playful', 'curious'],        name: 'Trickster',  note: 'Treats training drills as games it intends to win.' },
  { pair: ['loyal', 'protective'],       name: 'Shieldkin',  note: 'Will not leave a nest unattended.' },
  { pair: ['bold', 'aggressive'],        name: 'Duelist',    note: 'Seeks out the strongest thing in the field.' },
  { pair: ['gentle', 'patient'],         name: 'Tender',     note: 'Unshakeable around eggs and injured Kinbeasts.' },
  { pair: ['social', 'playful'],         name: 'Companion',  note: 'Miserable alone, radiant in a crowded habitat.' },
  { pair: ['independent', 'territorial'],name: 'Recluse',    note: 'Prefers a far corner and a clear line of sight.' },
  { pair: ['nervous', 'curious'],        name: 'Watcher',    note: 'Notices everything before anyone else does.' },
  { pair: ['patient', 'protective'],     name: 'Warden',     note: 'Endures. Outlasts. Keeps the young behind it.' },
];

export function personalityFor(a, b) {
  const match = PERSONALITIES.find(
    (p) => (p.pair[0] === a && p.pair[1] === b) || (p.pair[0] === b && p.pair[1] === a)
  );
  if (match) return match;
  if (a === b) {
    return { name: `Deeply ${TENDENCIES[a].name}`, note: `An unusually pure ${TENDENCIES[a].name.toLowerCase()} disposition.` };
  }
  return {
    name: `${TENDENCIES[a].name} ${TENDENCIES[b].name}`,
    note: 'An uncommon blend the archive has not yet named.',
  };
}

export function tendencyName(id) {
  return TENDENCIES[id]?.name ?? id;
}

// Battle reactions keyed by tendency. Resolved by the combat engine.
export const REACTIONS = {
  protective: { id: 'intercept',  name: 'Interpose',      desc: 'May take a hit aimed at a weaker ally.' },
  aggressive: { id: 'counter',    name: 'Counterstrike',  desc: 'May strike back when hit in melee.' },
  curious:    { id: 'read',       name: 'Read the Foe',   desc: 'May reveal and exploit an enemy weakness.' },
  loyal:      { id: 'steadfast',  name: 'Steadfast',      desc: 'Resists fear while an ally is wounded.' },
  nervous:    { id: 'startle',    name: 'Startle',        desc: 'Gains Speed when first threatened.' },
  territorial:{ id: 'holdground', name: 'Hold Ground',    desc: 'Stronger while in the front position.' },
  bold:       { id: 'press',      name: 'Press On',       desc: 'Bonus damage against healthier targets.' },
  gentle:     { id: 'soothe',     name: 'Soothe',         desc: 'Occasionally eases an ally\'s condition.' },
  social:     { id: 'rally',      name: 'Rally',          desc: 'Small Focus bonus while allies are standing.' },
  independent:{ id: 'selfreliant',name: 'Self-Reliant',   desc: 'Recovers a little stamina when alone in front.' },
  patient:    { id: 'measured',   name: 'Measured',       desc: 'Builds accuracy each round it is not struck.' },
  playful:    { id: 'feint',      name: 'Feint',          desc: 'May cause an attacker to misjudge its position.' },
};
