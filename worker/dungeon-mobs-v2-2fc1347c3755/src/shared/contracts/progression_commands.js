import {prepareProgressionChange,validateD8Progression,ATTRIBUTE_RESET_GOLD} from './participant_progression.js';
import {compareAmount,subtractAmount} from './economy_amount.js';
import {resolvePlayerStats} from './player_stats.js';
import {copyWire,requireContract as check,safeInteger,canonicalStringify} from './wire.js';
export function prepareD8Command(player,command){
 if(command.kind!=='progression.change')return null;
 try {const p=command.payload;check(player.d8,'D8 progression unavailable');validateD8Progression(player.d8,player.progression.level);const plan=prepareProgressionChange(player.d8,p.progressionRevision,p.action);
  if(plan.goldCost!=='0'){check(p.inventoryRevision===player.inventory.revision&&p.goldQuote===ATTRIBUTE_RESET_GOLD,'Stale economy quote');check(compareAmount(player.inventory.gold,plan.goldCost)>=0,'Insufficient Gold');}
  const gold=subtractAmount(player.inventory.gold,plan.goldCost),stats=resolvePlayerStats({...player,d8:plan.progression});safeInteger(player.inventory.revision+(plan.goldCost!=='0'?1:0));return {...plan,gold,stats};
 }catch(error){if(error.code==='NUMERIC_DOMAIN_EXTENSION_REQUIRED')throw error;return {error:error.message};}
}
export function applyD8Command(state,player,command,authorityOrder,plan){check(plan&&!plan.error,'Invalid progression preflight');player.d8=plan.progression;player.d8.lastChange={command:copyWire(command),authorityOrder,tick:state.tick,revision:player.d8.revision};if(plan.goldCost!=='0'){player.inventory.gold=plan.gold;player.inventory.revision++;}}
export function validateD8Receipt(state,player,validateCommand){const r=player.d8.lastChange;if(!r)return;const c=r.command;validateCommand(c);check(c.kind==='progression.change'&&c.playerId===player.playerId&&c.campaignId===state.campaign.campaignId&&c.sessionId===state.session.sessionId,'Progression receipt owner');safeInteger(c.clientSequence,1,state.appliedClientSequences[player.playerId]);safeInteger(r.authorityOrder,1,state.lastAppliedAuthorityOrder);safeInteger(r.tick,0,state.tick);check(c.payload.progressionRevision+1===r.revision,'Progression receipt revision');const a=state.appliedCommandsById[c.commandId];if(a)check(a.status==='applied'&&a.commandCanonical===canonicalStringify(c)&&a.authorityOrder===r.authorityOrder,'Progression command receipt');}
