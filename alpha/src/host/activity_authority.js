import { createActivitySimulation } from '../simulation/activity_simulation.js';
import { createCommandGatewayContracts } from './command_gateway_core.js';
import { validateActivityCommand, validateActivityCommandForState } from '../shared/contracts/activity_state.js';
import { freezeWire, requireContract } from '../shared/contracts/wire.js';
export function createActivityAuthority({initialState,measure,schedulerOptions,developerCapabilities}) {
  const simulation=createActivitySimulation(initialState,{measure,schedulerOptions,developerCapabilities});
  const contracts=createCommandGatewayContracts({validateWorldState:s=>simulation.withAuthorityState(owned=>requireContract(s===owned,'Untrusted internal state')),
    validateCommand:validateActivityCommand,validateCommandForState:validateActivityCommandForState,appliedClientSequence:(s,id)=>s.appliedClientSequences[id]});
  let gateway=simulation.withAuthorityState(contracts.createGatewayState);
  const createControllerPort=playerId=>Object.freeze({send:command=>simulation.withAuthorityState(state=>{
    requireContract(command.playerId===playerId,'Forged controller owner');const r=contracts.admitDiagnosticCommand(gateway,command,state);gateway=r.gateway;return {status:r.status};})});
  function drainCommands(){for(const entry of Object.values(gateway.admittedCommandsById).sort((a,b)=>a.authorityOrder-b.authorityOrder)){
    simulation.apply(entry.command,entry.authorityOrder);gateway=simulation.withAuthorityState(s=>contracts.retireAppliedAdmissions(gateway,s));}}
  return Object.freeze({...simulation,createControllerPort,drainCommands,readGateway:()=>freezeWire(gateway),nextClientSequence:playerId=>gateway.playersById[playerId].nextClientSequence,getExactSnapshotForProof:()=>({snapshot:simulation.getSnapshot(),gateway:freezeWire(gateway)})});
}
