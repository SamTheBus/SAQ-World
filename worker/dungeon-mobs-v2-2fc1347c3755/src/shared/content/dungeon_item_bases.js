export const canonicalNoun = value => String(value??'').trim().toLowerCase().replace(/[\s_-]+/g,'_');
// Ported from supplied Dungeon items.js:4502-4790. Pure item contribution calculation.
export function dungeonItemBases(item,stageScale){
const band=Math.ceil(stageScale/4)*4, effective=band<=100?band:100+Math.pow(band-100,.7)*1.5;
const repScale=Math.pow(1.012,effective)*(1+.015*effective);
        let stars = item.statsRolled || 0;
        let baseRarityMult = 1 + stars * .07;
        let noun = item.noun ? canonicalNoun(item.noun) : "";

        if (
          item.type === "weapon" &&
          !item.isUniqueStaff &&
          !item.isUniqueSword &&
          !item.isUniqueSingularity &&
          !item.isUniqueMaelstrom
        ) {
          let baseVal = Math.ceil(16.0 * repScale * baseRarityMult);
          if (noun.includes("greatsword") || noun.includes("claymore")) {
            item.baseAtk = Math.ceil(baseVal * 1.15);
            item.baseCritDamage = 0.15;
          } else if (
            noun.includes("longsword") ||
            noun.includes("broadsword")
          ) {
            item.baseAtk = Math.ceil(baseVal * 0.95);
            item.baseCritChance = 0.04;
          } else if (noun.includes("halberd") || noun.includes("battleaxe")) {
            item.baseAtk = Math.ceil(baseVal * 1.2);
            item.atkPct = 0.05;
          } else if (noun.includes("warhammer") || noun.includes("mace")) {
            item.baseAtk = Math.ceil(baseVal * 1.1);
            item.baseStr = Math.ceil(0.8 * stageScale * baseRarityMult);
          } else {
            item.baseAtk = baseVal;
          }
        } else if (item.type === "chest" || item.type === "overall") {
          let overallMult = item.type === "overall" ? 1.8 : 1.0;
          let baseDefVal = Math.ceil(
            10.0 * repScale * baseRarityMult * overallMult,
          );
          let baseHpVal = Math.ceil(
            40.0 * repScale * baseRarityMult * overallMult,
          );

          if (
            noun.includes("cuirass") ||
            noun.includes("plate_mail") ||
            noun.includes("full_plate")
          ) {
            item.baseDef = Math.ceil(baseDefVal * 1.3);
            item.baseMaxHp = Math.ceil(baseHpVal * 0.8);
            item.defPct = 0.04;
          } else if (noun.includes("hauberk") || noun.includes("chain_mail")) {
            item.baseDef = baseDefVal;
            item.baseMaxHp = baseHpVal;
            item.baseBlock = 0.02;
          } else if (
            noun.includes("brigandine") ||
            noun.includes("doublet") ||
            noun.includes("trenchcoat")
          ) {
            item.baseDef = Math.ceil(baseDefVal * 0.7);
            item.baseMaxHp = Math.ceil(baseHpVal * 1.4);
            item.maxHpPct = 0.05;
          } else if (noun.includes("exosuit")) {
            item.baseDef = baseDefVal;
            item.baseMaxHp = baseHpVal;
            item.maxHpPct = 0.06;
          } else if (noun.includes("robes")) {
            item.baseDef = Math.ceil(baseDefVal * 0.6);
            item.baseMaxHp = Math.ceil(baseHpVal * 1.4);
            item.baseInt = Math.ceil(2.0 * stageScale * baseRarityMult);
          } else {
            item.baseDef = baseDefVal;
            item.baseMaxHp = baseHpVal;
          }
        } else if (item.type === "helmet" && !item.isUniqueTempest) {
          let baseDefVal = Math.ceil(5.0 * repScale * baseRarityMult);
          let baseHpVal = Math.ceil(20.0 * repScale * baseRarityMult);

          if (noun.includes("greathelm") || noun.includes("visor")) {
            item.baseDef = Math.ceil(baseDefVal * 1.25);
            item.baseMaxHp = Math.ceil(baseHpVal * 0.85);
            item.defPct = 0.03;
          } else if (
            noun.includes("armet") ||
            noun.includes("bascinet") ||
            noun.includes("barbuta")
          ) {
            item.baseDef = baseDefVal;
            item.baseMaxHp = baseHpVal;
            item.baseParry = 0.02;
          } else if (noun.includes("circlet") || noun.includes("coif")) {
            item.baseDef = Math.ceil(baseDefVal * 0.65);
            item.baseMaxHp = Math.ceil(baseHpVal * 1.35);
            item.baseCritChance = 0.03;
          } else {
            item.baseDef = baseDefVal;
            item.baseMaxHp = baseHpVal;
          }
        } else if (item.type === "leggings") {
          let baseDefVal = Math.ceil(5.0 * repScale * baseRarityMult);
          let baseHpVal = Math.ceil(20.0 * repScale * baseRarityMult);

          if (noun.includes("legplates")) {
            item.baseDef = Math.ceil(baseDefVal * 1.2);
            item.baseMaxHp = Math.ceil(baseHpVal * 0.8);
            item.defPct = 0.03;
          } else if (noun.includes("greaves")) {
            item.baseDef = baseDefVal;
            item.baseMaxHp = baseHpVal;
            item.baseBlock = 0.02;
          } else if (noun.includes("chausses") || noun.includes("cuisses")) {
            item.baseDef = Math.ceil(baseDefVal * 0.7);
            item.baseMaxHp = Math.ceil(baseHpVal * 1.3);
            item.baseParry = 0.03;
          } else {
            item.baseDef = baseDefVal;
            item.baseMaxHp = baseHpVal;
          }
        } else if (item.type === "boots" && !item.isUniqueWarpCore) {
          let baseDefVal = Math.ceil(5.0 * repScale * baseRarityMult);
          let baseSpdVal = Math.ceil(1.0 * stageScale);

          if (
            noun.includes("sabatons") ||
            noun.includes("steel_boots") ||
            noun.includes("steel")
          ) {
            item.baseDef = Math.ceil(baseDefVal * 1.4);
            item.baseMoveSpeed = Math.ceil(baseSpdVal * 0.8);
            item.defPct = 0.03;
          } else if (noun.includes("sollerets")) {
            item.baseDef = baseDefVal;
            item.baseMoveSpeed = baseSpdVal;
            item.baseParry = 0.02;
          } else if (noun.includes("treads")) {
            item.baseDef = Math.ceil(baseDefVal * 0.6);
            item.baseMoveSpeed = Math.ceil(baseSpdVal * 1.35);
            item.moveSpeedPct = 0.04;
          } else {
            item.baseDef = baseDefVal;
            item.baseMoveSpeed = baseSpdVal;
          }
        } else if (item.type === "ring") {
                    if (item.implicitType === undefined) {
                      if (item.baseAtk > 0) item.implicitType = "atk";
                      else if (item.baseMaxHp > 0) item.implicitType = "maxHp";
                      else item.implicitType = "def";
                    }
                    if (item.implicitType === "atk")
                      item.baseAtk = Math.ceil(4.0 * repScale * baseRarityMult);
                    else if (item.implicitType === "maxHp")
                      item.baseMaxHp = Math.ceil(10.0 * repScale * baseRarityMult);
                    else if (item.implicitType === "def")
                      item.baseDef = Math.ceil(2.5 * repScale * baseRarityMult);

                    if (!item.implicitPctType) {
                      if ((item.atkPct || 0) > 0) item.implicitPctType = "atkPct";
                      else if ((item.maxHpPct || 0) > 0) item.implicitPctType = "maxHpPct";
                      else if ((item.defPct || 0) > 0) item.implicitPctType = "defPct";
                      else if ((item.strPct || 0) > 0) item.implicitPctType = "strPct";
                      else if ((item.dexPct || 0) > 0) item.implicitPctType = "dexPct";
                      else if ((item.intPct || 0) > 0) item.implicitPctType = "intPct";
                      else item.implicitPctType = "atkPct";
                    }

                    let s = Math.max(1, stageScale);
                    let implicitPctVal = parseFloat((0.03 + (0.22 * (s - 1)) / ((s - 1) + 40)).toFixed(4));

                    item.atkPct = 0;
                    item.maxHpPct = 0;
                    item.defPct = 0;
                    item.strPct = 0;
                    item.dexPct = 0;
                    item.intPct = 0;

                    if (item.implicitPctType) {
                      item[item.implicitPctType] = implicitPctVal;
                    }
                  } else if (
          item.type === "subweapon" &&
          !item.isUniqueAegis &&
          !item.isUniqueWatch &&
          !item.isUniqueChronicle &&
          !item.isUniqueConduit &&
          !item.isUniqueViper
        ) {
          if (item.subType === "shield") {
            item.baseDef = Math.ceil(1.0 * repScale * baseRarityMult);
            item.baseStr = Math.ceil(1.5 * stageScale * baseRarityMult);
            let noun = item.noun ? canonicalNoun(item.noun) : "";
            let stars =
              typeof item.statsRolled === "number" ? item.statsRolled : 0;

            if (noun.includes("tower")) {
              item.subArchetype = "tower";
              item.baseBlock = 0.15 + stars * 0.02;
              item.blockCapBonus = 0.04 + stars * 0.008;
              item.reflectDamage = 1.2 + stars * 0.16; // 120% - 200% Def
              item.bashAtkBonus = 0;
            } else if (noun.includes("buckler")) {
              item.subArchetype = "buckler";
              item.baseBlock = 0.2 + stars * 0.025;
              item.blockCapBonus = 0.02 + stars * 0.005;
              item.reflectDamage = 0.6 + stars * 0.08; // 60% Def
              item.bashAtkBonus = 0.5; // +50% Atk
            } else {
              item.subArchetype = "vanguard";
              item.baseBlock = 0.15 + stars * 0.02;
              item.blockCapBonus = 0.02 + stars * 0.006;
              item.reflectDamage = 1.0 + stars * 0.12; // 100% Def
              item.bashAtkBonus = 0;
            }
          } else if (item.subType === "dagger") {
            item.baseAtk = Math.ceil(0.8 * repScale * baseRarityMult);
            item.baseDex = Math.ceil(1.5 * stageScale * baseRarityMult);
            let noun = item.noun ? canonicalNoun(item.noun) : "";
            let stars =
              typeof item.statsRolled === "number" ? item.statsRolled : 0;

            if (noun.includes("main")) {
              item.subArchetype = "main_gauche";
              item.baseParry = 0.18 + stars * 0.02;
              item.parryCapBonus = 0.1 + stars * 0.01; // 10% - 15% bonus parry cap
              item.parryMitigation = 0.75; // 75% damage mitigation on parry
              item.riposteDamage = 0.8 + stars * 0.08;
              item.bleedChance = 0;
              item.offhandChance = 0;
              item.offhandDmg = 0.35;
            } else if (noun.includes("stiletto")) {
              item.subArchetype = "stiletto";
              item.baseParry = 0.12 + stars * 0.016;
              item.parryCapBonus = 0.02;
              item.parryMitigation = 0.6;
              item.riposteDamage = 1.0 + stars * 0.12; // 100% Atk
              item.bleedChance = 0.35 + stars * 0.04; // 35% - 55% Bleed
              item.offhandChance = 0;
              item.offhandDmg = 0.35;
            } else {
              item.subArchetype = "flurry";
              item.baseParry = 0.12 + stars * 0.016;
              item.parryCapBonus = 0.02;
              item.parryMitigation = 0.6;
              item.riposteDamage = 0.8 + stars * 0.08;
              item.offhandChance = 0.5 + stars * 0.05; // 50% - 75% Offhand Chance
              item.offhandDmg = 0.45; // 45% Atk
              item.bleedChance = 0.15;
            }
          } else if (item.subType === "tome") {
                      item.baseInt = Math.ceil(1.5 * stageScale * baseRarityMult);
                      item.baseAtk = Math.ceil(0.4 * repScale * baseRarityMult);
                      let noun = item.noun ? canonicalNoun(item.noun) : "";
                      let stars =
                        typeof item.statsRolled === "number" ? item.statsRolled : 0;
                      // Persisted attunement is authoritative. Nouns are a legacy
                      // fallback only and may never overwrite an authored roll.
                      if (!item.spellType) {
                        if (noun.includes("grimoire")) item.spellType = "fire";
                        else if (noun.includes("codex")) item.spellType = "lightning";
                        else if (noun.includes("lexicon")) item.spellType = "frost";
                        else item.spellType = "tri";
                      }

                      if (item.spellType === "fire") {
                        item.spellChance = Math.min(0.5, 0.25 + stars * 0.02);
                        item.spellPower = 1.8 + stars * 0.2;
                        item.baseBarrierPct = 0.20;
                        item.barrierRechargeDelay = 3.0;
                        item.barrierRegenRate = 0.10;
                      } else if (item.spellType === "lightning") {
                        item.spellChance = Math.min(0.6, 0.38 + stars * 0.03);
                        item.spellPower = 1.2 + stars * 0.15;
                        item.baseBarrierPct = 0.15;
                        item.barrierRechargeDelay = 2.0;
                        item.barrierRegenRate = 0.15;
                      } else if (item.spellType === "frost") {
                        item.spellChance = Math.min(0.5, 0.3 + stars * 0.025);
                        item.spellPower = 1.45 + stars * 0.15;
                        item.baseBarrierPct = 0.30;
                        item.barrierRechargeDelay = 4.0;
                        item.barrierRegenRate = 0.08;
                      } else {
                        item.spellChance = Math.min(0.5, 0.33 + stars * 0.02);
                        item.spellPower = 1.5 + stars * 0.18;
                        item.baseBarrierPct = 0.25;
                        item.barrierRechargeDelay = 3.0;
                        item.barrierRegenRate = 0.10;
                      }
                    }
        }

return item;
}
