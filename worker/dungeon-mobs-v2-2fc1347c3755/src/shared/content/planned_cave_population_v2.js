import {populationIds,ALPHA_POPULATION_SELECTIONS,hasAlphaPopulation} from './alpha_site_population_v1.js';
import {PLANNED_CAVE_VERSION,PLANNED_CAVE_ID} from './planned_cave_policy_v1.js';
// Review selection data, not separate gameplay implementations. V1 identity domains
// are retained so the existing Standard cave and its generated content stay exact.
export const PLANNED_CAVE_POPULATION_VERSION='planned-cave-population-candidate-v2';
export const ALPHA_PLANNED_CAVES=Object.freeze([
  {
    "reservationId": "repeatable-slot:cave:woodland:small:01",
    "tier": "small",
    "biome": "woodland",
    "band": 2,
    "footprintChunk": {
      "x": 70,
      "y": 232
    },
    "approachChunk": {
      "x": 71,
      "y": 232
    }
  },
  {
    "reservationId": "repeatable-slot:cave:desert:standard:01",
    "tier": "standard",
    "biome": "desert",
    "band": 3,
    "footprintChunk": {
      "x": 154,
      "y": 190
    },
    "approachChunk": {
      "x": 155,
      "y": 190
    }
  },
  {
    "reservationId": "repeatable-slot:cave:upland:large:01",
    "tier": "large",
    "biome": "upland",
    "band": 2,
    "footprintChunk": {
      "x": 64,
      "y": 220
    },
    "approachChunk": {
      "x": 65,
      "y": 220
    }
  },
  {
    "reservationId": "repeatable-slot:cave:tropical:deep:01",
    "tier": "deep",
    "biome": "tropical",
    "band": 3,
    "footprintChunk": {
      "x": 116,
      "y": 72
    },
    "approachChunk": {
      "x": 117,
      "y": 72
    }
  }
].map(r=>Object.freeze({...r,footprintChunk:Object.freeze(r.footprintChunk),approachChunk:Object.freeze(r.approachChunk)})));
export function plannedCaveIds(binding){if(hasAlphaPopulation(binding))return populationIds(binding,'cave');return binding?.cavePrototype===PLANNED_CAVE_POPULATION_VERSION?ALPHA_PLANNED_CAVES.map(r=>r.reservationId):binding?.cavePrototype===PLANNED_CAVE_VERSION?[PLANNED_CAVE_ID]:[];}
export function plannedCaveSelection(binding,id){if(hasAlphaPopulation(binding)){const s=ALPHA_POPULATION_SELECTIONS.find(s=>s.id===id&&s.familyId==='site-family:cave');return s?{reservationId:s.id,tier:s.tier,band:s.band,biome:s.biome,footprintChunk:s.footprint[0],approachChunk:s.approach[0]}:null;}return plannedCaveIds(binding).includes(id)?ALPHA_PLANNED_CAVES.find(r=>r.reservationId===id):null;}
