// Canonical supplied Dungeon contract; callers must supply reward-domain RNG.
export const EQUIPMENT_RARITY_UNLOCK_STAGE = Object.freeze([1, 1, 26, 101, 251, 501]);

export const EQUIPMENT_RARITY_SOURCES = Object.freeze({
  ORDINARY_MONSTER: "ordinary_monster",
  STANDARD_BOSS: "standard_boss",
  CHEST: "chest",
  HOARD_MIMIC: "hoard_mimic",
  DUNGEON_MERCHANT: "dungeon_merchant",
  GLIMMERING_FAIRY: "glimmering_fairy",
  GACHA: "gacha",
  HUB_EQUIPMENT_MARKET: "hub_equipment_market",
  REWARD_CONTAINER: "reward_container",
  CAVERN_SIGIL_SACK: "cavern_sigil_sack",
});

export const EQUIPMENT_RARITY_EXCEPTIONS = Object.freeze({
  AUTHORED_CHEST_MINIMUM: "authored_chest_minimum",
  AUTHORED_MIMIC_MINIMUM: "authored_mimic_minimum",
  AUTHORED_FAIRY_MINIMUM: "authored_fairy_minimum",
  GACHA_BASE_RARE_MINIMUM: "gacha_base_rare_minimum",
  GLIMMERING_GACHA_EPIC_MINIMUM: "glimmering_gacha_epic_minimum",
  GACHA_PITY_MYTHIC: "gacha_pity_mythic",
  AUTHORED_DIRECT_REWARD: "authored_direct_reward",
});

export const QUALITY_PLAYER_RULE =
  "Drop Quality improves the odds of higher equipment rarities that are currently unlocked. It does not unlock rarity tiers. It also improves eligible Cavern Sigil, artifact-trait, gacha, shop, and reward quality checks; named minimum-rarity, pity, and guaranteed rewards remain separate rules.";

const VALID_SOURCES = new Set(Object.values(EQUIPMENT_RARITY_SOURCES));
const VALID_EXCEPTIONS = new Set(Object.values(EQUIPMENT_RARITY_EXCEPTIONS));

// These slopes extend the existing Epic/Legendary/Mythic curve down to Rare and
// Magic without changing the accepted late-tier Quality multipliers.
const QUALITY_WEIGHT_SLOPES = Object.freeze([0, 0.1, 0.2, 0.3, 0.45, 0.6]);

function normalizeProgressionStage(value) {
  let numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, numeric) : 1;
}

function normalizeQuality(value) {
  let numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0.5, numeric) : 1;
}

function requireRollOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError(
      "Equipment rarity requires an options object with progressionStage separate from itemPowerLevel.",
    );
  }
  if (!("progressionStage" in options)) {
    throw new TypeError("Equipment rarity requires progressionStage.");
  }
  if (!VALID_SOURCES.has(options.source)) {
    throw new RangeError(`Unknown equipment-rarity source: ${options.source}`);
  }
}

export function getUnlockedEquipmentRarities(progressionStage) {
  let stage = normalizeProgressionStage(progressionStage);
  return EQUIPMENT_RARITY_UNLOCK_STAGE.map((unlockStage) => stage >= unlockStage);
}

export function calculateEquipmentRarityProbabilities(options) {
  requireRollOptions(options);

  let stage = normalizeProgressionStage(options.progressionStage);
  let quality = normalizeQuality(options.resolvedQuality);
  let unlocked = getUnlockedEquipmentRarities(stage);

  let weights = [
    Math.max(5, 100 - 0.3 * stage),
    Math.max(
      10,
      30 + 0.4 * Math.min(stage, 100) - 0.1 * Math.max(0, stage - 100),
    ),
    stage >= 26 ? Math.max(0, 0.6 * (stage - 25)) : 0,
    stage >= 101 ? Math.max(0, 0.5 * (stage - 100)) : 0,
    stage >= 251 ? Math.max(0, 0.4 * (stage - 250)) : 0,
    stage >= 501 ? Math.max(0, 0.3 * (stage - 500)) : 0,
  ];

  let qualityBonus = Math.max(0, quality - 1);
  for (let rarity = 1; rarity < weights.length; rarity++) {
    if (unlocked[rarity] && weights[rarity] > 0) {
      weights[rarity] *= 1 + qualityBonus * QUALITY_WEIGHT_SLOPES[rarity];
    }
  }

  if (options.isGacha === true) {
    weights[3] *= 1.5;
    weights[4] *= 2;
    weights[5] *= 2.5;
  }

  // The explicit lock pass is intentionally last: no Quality or source bonus can
  // create weight for a future progression tier.
  for (let rarity = 0; rarity < weights.length; rarity++) {
    if (!unlocked[rarity]) weights[rarity] = 0;
  }

  let totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) totalWeight = 1;

  return Object.fromEntries(
    weights.map((weight, rarity) => [rarity, (weight / totalWeight) * 100]),
  );
}

export function rollEquipmentRarity(options) {
  let probabilities = calculateEquipmentRarityProbabilities(options);
  let random = options.random;
  let randomValue = Number(random());
  if (!Number.isFinite(randomValue)) randomValue = 1;
  let roll = Math.max(0, Math.min(1 - Number.EPSILON, randomValue)) * 100;
  let cumulative = 0;

  for (let rarity = 5; rarity >= 0; rarity--) {
    let probability = probabilities[rarity] || 0;
    if (probability <= 0) continue;
    cumulative += probability;
    if (roll < cumulative) return rarity;
  }
  return 0;
}

export function applyEquipmentRarityException(
  rolledRarity,
  { minimumRarity = 0, exception } = {},
) {
  if (!VALID_EXCEPTIONS.has(exception)) {
    throw new RangeError(`Unknown equipment-rarity exception: ${exception}`);
  }
  let rolled = Math.max(0, Math.min(5, Math.floor(Number(rolledRarity) || 0)));
  let minimum = Math.max(0, Math.min(5, Math.floor(Number(minimumRarity) || 0)));
  return Math.max(rolled, minimum);
}
