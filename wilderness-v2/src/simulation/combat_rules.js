import * as trusted from './trusted_combat_rules.js';
import { validateEntityState, validateCollisionSpace } from '../shared/contracts/state.js';
import { freezeWire } from '../shared/contracts/wire.js';
export function canTargetActor(source,target){validateEntityState(source);validateEntityState(target);return trusted.canTargetActor(source,target);}
export function canActorAttack(source,target){validateEntityState(source);validateEntityState(target);return trusted.canActorAttack(source,target);}
export function stepActorMovement(actor,collision,intent=actor.movementIntent){validateEntityState(actor);validateCollisionSpace(collision);return freezeWire(trusted.stepActorMovement(actor,collision,intent));}
export function selectSimpleEnemyTarget(enemy,entitiesById){validateEntityState(enemy);for(const actor of Object.values(entitiesById))if(actor.kind==='actor'&&actor.team==='party')validateEntityState(actor);return trusted.selectSimpleEnemyTarget(enemy,entitiesById);}
export function approachIntent(source,target){return freezeWire(trusted.approachIntent(source,target));}
export function advanceAttackTimer(actor){validateEntityState(actor);return trusted.advanceAttackTimer(actor);}
export function resolveBoundedDirectDamage(source,target){validateEntityState(source);validateEntityState(target);return freezeWire(trusted.resolveBoundedDirectDamage(source,target));}
