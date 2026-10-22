import {freezeWire,requireContract as check} from '../contracts/wire.js';
import {progressionBigInt as big} from '../contracts/progression_integer.js';
import {integerRoot} from '../contracts/endless_formula.js';
import {combatAmount as Q} from '../contracts/combat_amount.js';
export const WORLD_COMBAT_VERSION='world-combat-hordes-progression-v1';
export const WORLD_COMBAT_HASH='a6bd45764908d58d1e1dff8e55e811a0d10876ee0b24ea4b15aa28ea6c94fc59';
export const WORLD_COMBAT_POLICY=freezeWire({version:WORLD_COMBAT_VERSION,parentRuntime:'3da5e7e40452aa32',reviewRevision:3,parentCombatRuntime:'f474d024b06426c4',bandLevels:[1,6,11,21,41],primary:{reachClearHullGapPixels:32,forwardDotMinimum:0.1,cleaveTargetsByCombo:[4,6,8],cadence:'existing 22/24/40 tick combo, movement multipliers unchanged'},forge:{firstAttuneGold:30,firstAttuneSouls:2,flatAttackPerWeaponAttune:2,flatArmorHpPerAttune:8,enchantSlotLevel:3,pricing:'World progression successor; Dungeon mechanics and UI retained'},ordinaryPack:[6,12],floorPacks:{small:3,standard:3,large:4,deep:4},floorPackSize:[6,8],maximumFloorMembers:40,activeActors:192,retainedSiteActors:4096,retainedSiteGroups:128,worldActors:192,renewalVacancyTicks:18000,gearChancePercent:10,soulChancePercent:35,equipmentLevel:'encounter level equals item power; regional minimum and participant escalation preserved',ordinaryStats:'HP=(30+6*(L-1)+(L-1)^2/8)*familyHP/45*rank; damage=(3+2*(L-1))*familyDamage/6*rank',xp:'per recipient: reward level min(locked encounter level,hero level+2); base1+integerSqrt(reward level); rankC100/B140/A200/S300hundredths, elitex3 or bossx15atC, ceil rank reward; multiply4/(4+max(abs(enemy level-hero level)-2,0)^2),floor and allow0; mastery applies afterward',levelGap:{graceLevels:2,outgoing:'4/(4+max(enemy level-hero level-2,0)^2)',incoming:'min(4,(4+max(enemy level-hero level-2,0)^2)/4)',policy:'Deterministic per-recipient frozen enemy level and current hero level; every delivered damage packet once, after attack/crit and before wards, barrier or defense; no random misses'},engagement:{threat:'actor-relative threat with frozen encounter level retained',initialAcquireLineOfSight:true,attackLineOfSight:true,interiorPursuitMemoryTicks:600,disengageTicks:120,returnHealing:false},equipmentRequirement:'World combat generated itemPower <= hero level; higher-level finds remain owned, sellable and salvageable',rarity:{unit:'basis points',status:'provisional World tuning; natural drops unlock Legendary at21 and Mythic at41; existing Awaken path retained',below21:{ordinary:[7000,2400,500,100,0,0],completion:[0,6500,3000,500,0,0]},from21:{ordinary:[7000,2400,500,95,5,0],completion:[0,6500,3000,450,50,0]},from41:{ordinary:[7000,2400,500,90,9,1],completion:[0,6500,3000,400,90,10]}},economy:'enemy gold 1+level/4; chest 20+4*level and guaranteed gear; elite gold x3 and guaranteed gear',safety:'all settlement/site/faction/future-island protected chunks plus one-chunk collar; ferry and spawn safety; prepare at 768px, no placement within 384px of any actor',respawn:'existing 18000 active tick vacant cleared encounter renewal, unresolved ownership gates retained',simulation:'60Hz unchanged; spatial activation, separation, LOS and interior navigation retained'});
export const hasWorldCombat=x=>{const b=x?.d9World?.plannedWorld??x;return b?.combatVersion===WORLD_COMBAT_VERSION&&b.combatHash===WORLD_COMBAT_HASH;};
export const combatPlayer=p=>p?.inventory?.services?.combatHash===WORLD_COMBAT_HASH;
export function worldEnemyStats(level,tier,budget={hp:45,damage:6},elite=false){const l=big(level),n=l-1n,r=BigInt(({C:100,B:140,A:200,S:300})[tier]);check(r&&l>=1n,'World combat level/rank');const ceil=(n,d)=>(n+d-1n)/d;return {maxHp:String(ceil((240n+48n*n+n*n)*BigInt(budget.hp)*r,8n*45n*100n)),attackDamage:String(ceil((3n+2n*n)*BigInt(budget.damage)*r,6n*100n)),xp:String(ceil((4n+2n*l)*r*BigInt(elite?3:1),100n))};}
export function combatAttuneCost(level){check(Number.isInteger(level)&&level>=0&&level<100,'Combat attunement level');return {gold:String(30+20*level+10*level*level),materials:{'Monster Soul':2+2*level}};}
export function combatAttuneSpent(level){let gold=0n,souls=0;for(let i=0;i<level;i++){const c=combatAttuneCost(i);gold+=BigInt(c.gold);souls+=c.materials['Monster Soul'];}return {gold:String(gold),materials:level?{'Monster Soul':souls}:{}};}

export function worldBossStats(level){const s=worldEnemyStats(level,'C');return {maxHp:String(BigInt(s.maxHp)*12n),attackDamage:String(BigInt(s.attackDamage)*2n),xp:String(BigInt(s.xp)*15n)};}

// Per-recipient awards prevent a low hero inheriting high-band or party XP.
// The ordinary hero curve and persisted XP schema remain unchanged.
export function worldHeroKillXp(level,heroLevel,tier='C',elite=false,boss=false){
 const enemy=big(level),hero=big(heroLevel),rewardLevel=enemy<hero+2n?enemy:hero+2n;check(enemy>=1n&&hero>=1n,'World hero XP levels');
 const rank=BigInt(({C:100,B:140,A:200,S:300})[boss?'C':tier]??0);check(rank>0n,'World XP rank');
 const base=1n+integerRoot(rewardLevel,2),raw=(base*rank*BigInt(boss?15:elite?3:1)+99n)/100n,difference=enemy>hero?enemy-hero:hero-enemy,excess=difference>2n?difference-2n:0n;
 return String(raw*4n/(4n+excess*excess));
}

// A level advantage never rescales equal/lower-level enemies. Every player
// damage packet uses the same deterministic coefficients, including spells.
export function worldLevelGapMultiplier(heroLevel,enemyLevel){
 const hero=big(heroLevel),enemy=big(enemyLevel);check(hero>=1n&&enemy>=1n,'World damage levels');
 const excess=enemy>hero+2n?enemy-hero-2n:0n,denominator=4n+excess*excess;
 return {outgoing:Q(4n,denominator),incoming:Q(denominator>16n?16n:denominator,4n)};
}

export function worldGearRarity(level,role,draw,qualityHundredths=0){
 const l=big(level),q=big(qualityHundredths);check(l>=1n&&['ordinary','elite','completion'].includes(role)&&Number.isFinite(draw)&&draw>=0&&draw<1,'World rarity input');
 const band=WORLD_COMBAT_POLICY.rarity[l>=41n?'from41':l>=21n?'from21':'below21'],base=band[role==='ordinary'?'ordinary':'completion'];
 if(q===0n){const roll=Math.floor(draw*10000);let sum=0;for(let i=0;i<base.length;i++){sum+=base[i];if(roll<sum)return i;}}
 else {const weights=base.map((w,i)=>BigInt(w)*(10000n+q*BigInt(i*10))),total=weights.reduce((a,b)=>a+b,0n),roll=BigInt(Math.floor(draw*4294967296))*total;let sum=0n;for(let i=0;i<weights.length;i++){sum+=weights[i];if(roll<sum*4294967296n)return i;}}
 check(false,'World rarity weights failed');
}

export const COMBAT_RUNTIME_VERSION='world-residency-hordes-v2-retention';
