import {isD9Progression,validateD9Entitlements,d9AttributeBalance,allocateD9Attributes,D9_PARTICIPANT_VERSION} from './participant_progression_d9.js';
import {progressionBigInt as pb,progressionWire as pw,positiveProgression} from './progression_integer.js';
import {ACTIVE_NODES,CONSTELLATIONS} from '../content/constellations.js';
import {closedRecord,requireContract as check,safeInteger,validateWire,copyWire} from './wire.js';
import {integerBigInt as big,integerWire as wire,validateInteger,numericExtension,INTEGER_MAX_DIGITS} from './integer_domain.js';
import {integerRoot,fractionalModifier12} from './endless_formula.js';

export const D8_PROGRESSION_VERSION='participant-progression-d8-v1';
export const MASTERY_FAMILIES=Object.freeze(['shield','dagger','tome']);
export const ATTRIBUTE_RESET_GOLD='2500';
const round=(n,d)=>(2n*n+d)/(2n*d);
const family=()=>({level:'1',xp:'0',xpTenthsRemainder:0,nodeRanks:{}});
export function initialD8Progression(heroLevel){safeInteger(heroLevel,1,50);return {version:D8_PROGRESSION_VERSION,highestHeroLevel:heroLevel,revision:0,attributeResetCount:'0',lastChange:null,causalXp:{},transient:emptyMasteryTransient(),allocated:{str:0,dex:0,int:0},utility:{nodeRanks:{}},shield:family(),dagger:family(),tome:family()};}
export const nodeRank=(state,id)=>state?.[ACTIVE_NODES[id]?.tree]?.nodeRanks[id]??'0';
export function finiteNodeRank(state,id){const node=ACTIVE_NODES[id];check(node&&node.maxRank!=='infinite','Finite node required');const rank=big(nodeRank(state,id));check(rank<=BigInt(node.maxRank),'Rank beyond maximum');return Number(rank);}
// The exact authored requirement rounds the complete product, never a rounded power.
export function masteryRequirement(level){const l=big(level);check(l>=1n,'Invalid mastery level');return wire(l<=50n?round(1000n*59n**(l-1n),50n**(l-1n)):3800000n+(l-50n)*250000n);}
// Bounded cold derivation. Only the most recent requested prefix is cached; no
// per-rank authoritative ledger or unbounded memoized rank history is retained.
let infiniteCache={rank:0n,n:2n,d:1n,spent:0n};
function infinitePrefix(rank){const r=big(rank);if(r===infiniteCache.rank)return infiniteCache;
 let {rank:i,n,d,spent}=r>infiniteCache.rank?infiniteCache:{rank:0n,n:2n,d:1n,spent:0n};
 let work=0;while(i<r){if(++work>2000000)numericExtension('infinite SP cold work');const cost=round(n,d);spent+=cost<2n?2n:cost;i++;
  if(spent.toString().length>INTEGER_MAX_DIGITS)numericExtension('infinite SP magnitude');
  n*=59n;d*=50n;if(n.toString().length>INTEGER_MAX_DIGITS*2+32||d.toString().length>INTEGER_MAX_DIGITS*2+32)numericExtension('infinite SP rational proof');
 }
 return infiniteCache={rank:i,n,d,spent};
}
export function nodeCost(id,nextRank){const node=ACTIVE_NODES[id],rank=big(nextRank);check(node&&rank>0n,'Invalid node/rank');if(node.maxRank!=='infinite'){check(rank<=BigInt(node.maxRank),'Node at maximum');return wire(node.costPerRank);}const p=infinitePrefix(wire(rank-1n));const value=round(p.n,p.d);return wire(value<2n?2n:value);}
export function spentPoints(state,tree){check(CONSTELLATIONS[tree],'Unknown constellation');let total=0n;for(const [id,rank] of Object.entries(state[tree].nodeRanks)){const n=ACTIVE_NODES[id];check(n?.tree===tree,'Foreign or deferred node');total+=n.maxRank==='infinite'?infinitePrefix(rank).spent:big(rank)*BigInt(n.costPerRank);}return wire(total);}
export function pointBalances(state){const earnedAP=isD9Progression(state)?0:3*(state.highestHeroLevel-1),allocated=isD9Progression(state)?0:Object.values(state.allocated).reduce((a,b)=>a+b,0);return {...(isD9Progression(state)?d9AttributeBalance(state):{attributeEarned:earnedAP,attributeUnspent:earnedAP-allocated}),...Object.fromEntries(['utility',...MASTERY_FAMILIES].map(tree=>{const earned=tree==='utility'?pb(state.highestHeroLevel)-1n:big(state[tree].level)-1n,spent=big(spentPoints(state,tree));check(earned>=spent,'Overspent progression');return [tree,{earned:wire(earned),spent:wire(spent),unspent:wire(earned-spent)}];}))};}
export function validateD8Progression(state,heroLevel){validateWire(state);closedRecord(state,['version','highestHeroLevel','revision','attributeResetCount','lastChange','causalXp','transient','allocated','utility',...MASTERY_FAMILIES]);check((state.version===D8_PROGRESSION_VERSION||state.version===D9_PARTICIPANT_VERSION),'Progression version');if(!isD9Progression(state))safeInteger(state.highestHeroLevel,heroLevel,50);safeInteger(state.revision);validateInteger(state.attributeResetCount);closedRecord(state.causalXp,[],Object.keys(state.causalXp));validateMasteryTransient(state.transient);if(state.lastChange!==null){closedRecord(state.lastChange,['command','authorityOrder','tick','revision']);safeInteger(state.lastChange.authorityOrder,1);safeInteger(state.lastChange.tick);safeInteger(state.lastChange.revision,1,state.revision);}closedRecord(state.allocated,['str','dex','int']);if(isD9Progression(state))validateD9Entitlements(state,heroLevel);else{for(const value of Object.values(state.allocated))safeInteger(value,0,147);check(Object.values(state.allocated).reduce((a,b)=>a+b,0)<=3*(state.highestHeroLevel-1),'Overspent attributes');}
 for(const tree of ['utility',...MASTERY_FAMILIES]){const branch=state[tree];closedRecord(branch,tree==='utility'?['nodeRanks']:['level','xp','xpTenthsRemainder','nodeRanks']);if(tree!=='utility'){validateInteger(branch.level);validateInteger(branch.xp);check(big(branch.level)>=1n&&big(branch.xp)<big(masteryRequirement(branch.level)),'Unsettled mastery XP');safeInteger(branch.xpTenthsRemainder,0,9);}closedRecord(branch.nodeRanks,[],Object.values(ACTIVE_NODES).filter(n=>n.tree===tree).map(n=>n.id));
  for(const [id,value] of Object.entries(branch.nodeRanks)){validateInteger(value);const rank=big(value),node=ACTIVE_NODES[id];check(rank>0n,'Sparse ranks omit zero');check(node.maxRank==='infinite'||rank<=BigInt(node.maxRank),'Rank over maximum');check(!node.isStarterToggle||pb(state.highestHeroLevel)>=2n,'Root requires Hero Level 2');check(node.prereqs.length===0||node.prereqs.some(parent=>big(nodeRank(state,parent))>0n),'Missing ANY-parent');}
  const bought=Object.values(ACTIVE_NODES).filter(n=>n.tree===tree&&n.tier===4&&big(nodeRank(state,n.id))>0n);check(bought.length<=1,'Exclusive keystones');
  // A state must admit a legal purchase ordering. Total spending alone could
  // otherwise forge a tier-five rank by counting its own price toward its gate.
  const remaining=new Set(Object.keys(branch.nodeRanks)),visited=new Set();let paid=0n;
  while(remaining.size){let progress=false;for(const id of remaining){const n=ACTIVE_NODES[id],gate=tree==='utility'?0:[0,0,3,7,12,15][n.tier];if(paid<BigInt(gate)||n.prereqs.length&&!n.prereqs.some(p=>visited.has(p)))continue;paid+=n.maxRank==='infinite'?infinitePrefix(branch.nodeRanks[id]).spent:big(branch.nodeRanks[id])*BigInt(n.costPerRank);visited.add(id);remaining.delete(id);progress=true;}check(progress,'Unreachable tier purchase history');}
 }
 pointBalances(state);return state;
}
export function purchaseAvailability(state,id){const node=ACTIVE_NODES[id];if(!node)return {ok:false,reason:'Unavailable constellation node'};const rank=big(nodeRank(state,id));if(node.maxRank!=='infinite'&&rank>=BigInt(node.maxRank))return {ok:false,reason:'Maximum rank'};if(node.isStarterToggle&&pb(state.highestHeroLevel)<2n)return {ok:false,reason:'Requires Hero Level 2'};if(node.prereqs.length&&!node.prereqs.some(p=>big(nodeRank(state,p))>0n))return {ok:false,reason:'Requires one connected parent'};
 const gate=node.tree==='utility'?0:[0,0,3,7,12,15][node.tier];if(big(spentPoints(state,node.tree))<BigInt(gate))return {ok:false,reason:`Requires ${gate} paid points in this constellation`};if(node.tier===4&&Object.values(ACTIVE_NODES).some(n=>n.tree===node.tree&&n.tier===4&&n.id!==id&&big(nodeRank(state,n.id))>0n))return {ok:false,reason:'Other keystone selected'};
 const cost=nodeCost(id,wire(rank+1n));if(big(pointBalances(state)[node.tree].unspent)<big(cost))return {ok:false,reason:'Insufficient Skill Points',cost};return {ok:true,cost,nextRank:wire(rank+1n)};
}
// Pure preflight: the caller atomically installs the returned state only after
// command stamps, liveness, economy quotes and resolved capacities also validate.
export function prepareProgressionChange(state,expectedRevision,action){check(state.revision===expectedRevision,'Stale progression revision');const next=copyWire(state);let goldCost='0';
 if(action.kind==='allocate'){closedRecord(action.deltas,['str','dex','int']);if(isD9Progression(state))next.allocated=allocateD9Attributes(state,action.deltas);else{let total=0;for(const key of ['str','dex','int']){safeInteger(action.deltas[key],0,147);total+=action.deltas[key];next.allocated[key]+=action.deltas[key];}check(total>0&&total<=pointBalances(state).attributeUnspent,'Invalid attribute allocation');}}
 else if(action.kind==='attributes.reset'){check(Object.values(state.allocated).some(v=>pb(v)>0n),'No allocated attributes');next.allocated={str:0,dex:0,int:0};next.attributeResetCount=wire(big(next.attributeResetCount)+1n);goldCost=ATTRIBUTE_RESET_GOLD;}
 else if(action.kind==='node.purchase'){const offer=purchaseAvailability(state,action.nodeId);check(offer.ok,offer.reason);next[ACTIVE_NODES[action.nodeId].tree].nodeRanks[action.nodeId]=copyWire(offer.nextRank);}
 else if(action.kind==='tree.reset'){check(CONSTELLATIONS[action.tree],'Unknown constellation');check(Object.keys(state[action.tree].nodeRanks).length>0,'Constellation already empty');next[action.tree].nodeRanks={};clearMasteryTreeTransient(next.transient,action.tree);}
 else check(false,'Unknown progression action');
 safeInteger(next.revision+1);next.revision++;validateD8Progression(next,state.highestHeroLevel);return {progression:next,goldCost};
}
export function updateHighestHeroLevel(state,level){if(isD9Progression(state))positiveProgression(level);else safeInteger(level,1,50);if(pb(level)<=pb(state.highestHeroLevel))return state;const next=copyWire(state);next.highestHeroLevel=level;safeInteger(next.revision+1);next.revision++;return next;}
// Award settlement accepts already-authorized causal XP only. It is not exposed
// as a player command. The combat authority owns eligibility and causal dedup.
export function settleMasteryXp(state,tree,rawAward,depth){check(MASTERY_FAMILIES.includes(tree),'Invalid mastery family');positiveProgression(depth);const source=state[tree],level=big(source.level),diff=pb(depth)-level;
 let tenths=10n;if(diff>5n)tenths+=diff-5n>10n?10n:diff-5n;else if(diff< -5n)tenths-= -diff-5n>9n?9n:-diff-5n;
 const credited=big(rawAward)*tenths+BigInt(source.xpTenthsRemainder);let xp=big(source.xp)+credited/10n,l=level;
 while(l<=50n&&xp>=big(masteryRequirement(wire(l)))){xp-=big(masteryRequirement(wire(l)));l++;}
 if(l>50n){const first=big(masteryRequirement(wire(l))),step=250000n;
  // Sum of the linear tail, solved by an integer quadratic root; no loop per
  // level even for a chunked huge XP award.
  const b=2n*first-step;let n=(integerRoot(b*b+8n*step*xp,2)-b)/(2n*step);const cost=k=>k*first+step*k*(k-1n)/2n;while(cost(n+1n)<=xp)n++;while(cost(n)>xp)n--;xp-=cost(n);l+=n;
 }
 const next=copyWire(state);next[tree].level=wire(l);next[tree].xp=wire(xp);next[tree].xpTenthsRemainder=Number(credited%10n);safeInteger(next.revision+1);next.revision++;return {progression:next,wholeAward:wire(credited/10n),levelsGained:wire(l-level)};
}
export function triggerScaledMasteryXp(base,depth){positiveProgression(depth);const t=fractionalModifier12(pb(depth),1,7,20);return wire(round(big(base)*BigInt(t.n),BigInt(t.d)));}
export function progressionRewardWitness(state){const r=id=>finiteNodeRank(state,id);return {version:'personal-reward-modifiers-d8-v1',goldHundredths:100+5*(r('utility_pioneer')+r('utility_gold')),occurrenceHundredths:100+5*r('utility_pioneer'),qualityHundredths:2*r('utility_quality'),dualEligible:r('tome_spell_weaving')>=1,triEligible:r('tome_spell_weaving')>=2};}
export const inventoryIntakeCapacity=state=>64+5*finiteNodeRank(state,'utility_bag');
export const D8_OWNERSHIP_BOUND=79;

export function emptyMasteryTransient(){return {fortitudeStacks:0,fortitudeTicks:0,retaliatoryReady:false,pulseBlocks:0,colossusAttack:'0',colossusTicks:0,shadowStepTicks:0,mainCritStreak:0,syphonStacks:0,syphonTicks:0,weavingStacks:0,weavingTicks:0,lastAnchor:null,rotationItemId:null,rotationCursor:0};}
export function clearMasteryTreeTransient(t,tree){const fields=tree==='shield'?['fortitudeStacks','fortitudeTicks','retaliatoryReady','pulseBlocks','colossusAttack','colossusTicks']:tree==='dagger'?['shadowStepTicks','mainCritStreak']:tree==='tome'?['syphonStacks','syphonTicks','weavingStacks','weavingTicks','lastAnchor']:[];const empty=emptyMasteryTransient();for(const key of fields)t[key]=empty[key];}
export function validateMasteryTransient(t){closedRecord(t,Object.keys(emptyMasteryTransient()));for(const [key,max] of Object.entries({fortitudeStacks:5,fortitudeTicks:360,pulseBlocks:4,colossusTicks:600,shadowStepTicks:240,mainCritStreak:2,syphonStacks:3,syphonTicks:360,weavingStacks:4,weavingTicks:240}))safeInteger(t[key],0,max);check(typeof t.retaliatoryReady==='boolean','Retaliatory flag');safeInteger(t.rotationCursor,0,2);check(t.rotationItemId===null||typeof t.rotationItemId==='string'&&t.rotationItemId.length<=240,'Tome rotation identity');check(t.rotationItemId!==null||t.rotationCursor===0,'Rotation without item');validateInteger(t.colossusAttack);check(t.lastAnchor===null||['fire','lightning','frost'].includes(t.lastAnchor),'Weaving anchor');check(t.fortitudeTicks>0||t.fortitudeStacks===0,'Expired Fortitude');check(t.syphonTicks>0||t.syphonStacks===0,'Expired Syphon');check(t.weavingTicks>0||t.weavingStacks===0,'Expired Weaving');check(t.colossusTicks>0||t.colossusAttack==='0','Expired Colossus');return t;}

export function validateD8Advance(before,after,oldLevel,newLevel,oldAuthorityOrder){if(!after){check(!before,'Progression removed');return;}validateD8Progression(after,newLevel);const prior=before??initialD8Progression(oldLevel);check(pb(after.highestHeroLevel)>=pb(prior.highestHeroLevel)&&after.revision>=prior.revision&&big(after.attributeResetCount)>=big(prior.attributeResetCount),'D8 progression regressed');for(const tree of MASTERY_FAMILIES){const a=prior[tree],b=after[tree];check(big(b.level)>=big(a.level),'Mastery level regressed');if(big(a.level)===big(b.level))check(big(b.xp)*10n+BigInt(b.xpTenthsRemainder)>=big(a.xp)*10n+BigInt(a.xpTenthsRemainder),'Mastery XP regressed');}for(const [id,row] of Object.entries(prior.causalXp)){for(const [kind,sequence] of Object.entries(row))check((after.causalXp[id]?.[kind]??0)>=sequence,'Mastery causal receipt regressed');}const purchases=s=>JSON.stringify([s.allocated,...['utility',...MASTERY_FAMILIES].map(t=>Object.entries(s[t].nodeRanks).sort()),s.attributeResetCount]);if(purchases(prior)!==purchases(after))check(after.revision>prior.revision&&after.lastChange?.authorityOrder>oldAuthorityOrder,'Progression changes require a later authoritative command');}
