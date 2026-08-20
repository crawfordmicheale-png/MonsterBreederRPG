// Regions and expedition sites.
//
// A site may carry a `hazard`. Hazardous sites are visible from the start —
// the player should be able to see the locked door and understand exactly what
// trait would open it, because that is the breeding puzzle.

export const REGIONS = {
  hearthmere: {
    id: 'hearthmere',
    name: 'Hearthmere Fields',
    blurb:
      'Long grass, low stone walls and the smell of rain coming. The countryside around Briarhold has been left to itself for years.',
    unlockedBy: null,
    tone: '#7a9a5c',
    sites: [
      {
        id: 'meadow',
        name: 'The Open Meadow',
        blurb: 'Waist-high grass that moves when nothing is moving it.',
        tone: '#8fae6a',
        encounters: [
          { species: 'mossbun', weight: 40, level: [3, 6] },
          { species: 'cinderkit', weight: 22, level: [4, 7] },
          { species: 'galecrest', weight: 24, level: [4, 7] },
          { species: 'pebbleback', weight: 14, level: [4, 8] },
        ],
        resources: ['meadow_herb', 'soft_reed'],
      },
      {
        id: 'brook',
        name: 'Hearthmere Brook',
        blurb: 'Cold, clear and shallow enough to wade. Something keeps stealing the fish.',
        tone: '#5a8f9a',
        encounters: [
          { species: 'brookfin', weight: 46, level: [4, 7] },
          { species: 'mossbun', weight: 24, level: [3, 6] },
          { species: 'galecrest', weight: 16, level: [5, 8] },
          { species: 'pebbleback', weight: 14, level: [5, 8] },
        ],
        resources: ['river_stone', 'clearwater_flask'],
      },
      {
        id: 'hollow',
        name: 'The Hollow Under the Hill',
        blurb: 'A chalk cave the local children are told not to enter. They enter anyway.',
        tone: '#6b5a86',
        encounters: [
          { species: 'glowgrub', weight: 38, level: [4, 8] },
          { species: 'pebbleback', weight: 26, level: [5, 9] },
          { species: 'duskmew', weight: 20, level: [5, 9] },
          { species: 'cinderkit', weight: 10, level: [5, 8] },
          { species: 'mossbun', weight: 6, level: [4, 7] },
        ],
        resources: ['lantern_moss', 'river_stone'],
        requires: 'ch1_started',
      },
    ],
  },

  emberbreak: {
    id: 'emberbreak',
    name: 'The Emberbreak Range',
    blurb:
      'Black rock and standing heat. Everything Embervale has ever built runs on the furnaces beneath it, and the furnaces run on Kinbeasts.',
    unlockedBy: 'ch2_started',
    tone: '#a85a32',
    sites: [
      {
        id: 'foothills',
        name: 'Emberbreak Foothills',
        blurb: 'Scrub, slag heaps and the sound of the works carrying down the valley.',
        tone: '#9a6a45',
        encounters: [
          { species: 'brambletusk', weight: 30, level: [9, 13] },
          { species: 'cinderkit', weight: 24, level: [9, 12] },
          { species: 'pebbleback', weight: 22, level: [9, 13] },
          { species: 'sparkmidge', weight: 24, level: [9, 12] },
        ],
        resources: ['ember_ash', 'iron_scrap'],
      },
      {
        id: 'springs',
        name: 'The Steaming Shallows',
        blurb: 'Hot springs where the mountain water comes back up. Warm enough to sit in. Just.',
        tone: '#7a8f8a',
        encounters: [
          { species: 'shellip', weight: 34, level: [10, 13] },
          { species: 'mudsprig', weight: 30, level: [10, 13] },
          { species: 'sparkmidge', weight: 20, level: [10, 13] },
          { species: 'cinderkit', weight: 16, level: [10, 13] },
        ],
        resources: ['thermal_salt', 'clearwater_flask'],
      },
      {
        id: 'furnace_road',
        name: 'The Furnace Road',
        blurb: 'The service tunnels. Hot, but survivable, and the crews still walk it daily. Something in the walls will not settle.',
        special: 'calm_rampage',
        tone: '#b8663a',
        encounters: [
          { species: 'embermole', weight: 34, level: [11, 14] },
          { species: 'cinderkit', weight: 24, level: [11, 14] },
          { species: 'pebbleback', weight: 22, level: [11, 14] },
          { species: 'brambletusk', weight: 20, level: [11, 14] },
        ],
        resources: ['ember_ash', 'iron_scrap', 'thermal_salt'],
      },
      {
        id: 'deep_tunnels',
        name: 'The Deep Tunnels',
        blurb:
          'Below the working levels, where the treated Kinbeasts were put when they stopped being useful. Nobody has been down since.',
        // The chapter's gate. Visible from the first visit so the player can
        // plan a bloodline toward it rather than discovering a wall.
        hazard: 'heat',
        tone: '#6a3a28',
        encounters: [
          { species: 'embermole', weight: 46, level: [13, 16] },
          { species: 'cinderkit', weight: 22, level: [13, 16] },
          { species: 'pebbleback', weight: 18, level: [13, 16] },
          { species: 'sparkmidge', weight: 14, level: [13, 16] },
        ],
        resources: ['ember_ash', 'thermal_salt', 'crown_ledger'],
      },
    ],
  },
};

export const RESOURCES = {
  meadow_herb:     { id: 'meadow_herb',     name: 'Meadow Herb',      short: 'Herb',   desc: 'Common, bitter, and exactly what a stressed Kinbeast needs.' },
  soft_reed:       { id: 'soft_reed',       name: 'Soft Reed',        short: 'Reed',   desc: 'Nesting material. The Nursery always wants more.' },
  river_stone:     { id: 'river_stone',     name: 'River Stone',      short: 'Stone',  desc: 'Smooth and heavy. Used in habitat repair.' },
  clearwater_flask:{ id: 'clearwater_flask',name: 'Clearwater Flask', short: 'Water',  desc: 'Water clean enough to raise a hatchling on.' },
  lantern_moss:    { id: 'lantern_moss',    name: 'Lantern Moss',     short: 'Moss',   desc: 'Glows faintly. Hatcheries use it to regulate light.' },
  ember_ash:       { id: 'ember_ash',       name: 'Ember Ash',        short: 'Ash',    desc: 'Fine, warm, and still faintly alive. Holds heat for days.' },
  iron_scrap:      { id: 'iron_scrap',      name: 'Iron Scrap',       short: 'Iron',   desc: 'Offcuts from the works. Embervale throws away better metal than most places forge.' },
  thermal_salt:    { id: 'thermal_salt',    name: 'Thermal Salt',     short: 'Salt',   desc: 'Crusted around the hot springs. Unstable, and useful because of it.' },
  crown_ledger:    { id: 'crown_ledger',    name: 'Crown Ledger Page',short: 'Ledger', desc: 'A page of treatment records the Crown did not intend to leave behind.' },
};

export function getRegion(id) {
  return REGIONS[id];
}

export function siteById(regionId, siteId) {
  return REGIONS[regionId]?.sites.find((s) => s.id === siteId);
}

/** Sites the player can currently see, given their story flags. */
export function availableSites(regionId, flags) {
  const region = REGIONS[regionId];
  if (!region) return [];
  return region.sites.filter((s) => !s.requires || flags[s.requires]);
}

/** Regions the player has reached. */
export function availableRegions(flags) {
  return Object.values(REGIONS).filter((r) => !r.unlockedBy || flags[r.unlockedBy]);
}
