// Trusted internal B1 math. Inputs are owned by a validated simulation; never a command/load boundary.
import { boundedCombatInteger, combatIntegerWire } from '../shared/contracts/combat_integer.js';
import { requireContract } from '../shared/contracts/wire.js';
import { centerDistance, collidesWithTiles, isActorInReach } from '../shared/rules/world_geometry.js';
import { isActiveAttackReady } from '../shared/rules/attack_speed_contract.js';
export function canTargetActor(source, target) {
  return source.kind === "actor" && target.kind === "actor" && source.entityId !== target.entityId &&
    source.alive && target.alive && source.team !== target.team;
}

export function canActorAttack(source, target) {
  return canTargetActor(source, target) && isActorInReach(source, target) &&
    isActiveAttackReady(source.attackTimer, { activeAttackSpeed: source.attackDelayTicks });
}

// H4A game_update.js moves X then Y independently. World retains that slide
// behavior and uses an explicit, validated collision record.
export function stepActorMovement(actor, collision, intent = actor.movementIntent, speedMultiplier = 1) {
  requireContract(actor.kind === "actor", "Movement source must be an actor");
  requireContract(intent && typeof intent === "object" && Number.isFinite(intent.x) && Number.isFinite(intent.y) &&
    intent.x >= -1 && intent.x <= 1 && intent.y >= -1 && intent.y <= 1 && Math.hypot(intent.x, intent.y) <= 1.000000000001,
  "Invalid normalized movement intent");
  requireContract(Number.isFinite(speedMultiplier)&&speedMultiplier>=0&&speedMultiplier<=1.45,"Invalid movement speed multiplier");
  let x = actor.position.x;
  let y = actor.position.y;
  let moved = false;
  const vx = intent.x * actor.moveSpeed * speedMultiplier;
  const vy = intent.y * actor.moveSpeed * speedMultiplier;
  if (vx !== 0 && !collidesWithTiles(collision, x + vx, y, actor.hullRadius)) { x += vx; moved = true; }
  if (vy !== 0 && !collidesWithTiles(collision, x, y + vy, actor.hullRadius)) { y += vy; moved = true; }
  return ({ position: { x, y }, moved });
}

export function selectSimpleEnemyTarget(enemy, entitiesById) {
  requireContract(enemy.kind === "actor" && enemy.ai?.kind === "simpleMelee", "Expected simple melee enemy");
  const candidates = Object.values(entitiesById).filter((candidate) =>
    candidate.kind === "actor" && candidate.team === "party" && canTargetActor(enemy, candidate))
    .map((candidate) => ({ candidate, distance: centerDistance(enemy, candidate) }))
    .filter(({ distance }) => distance <= enemy.ai.acquireRange)
    .sort((first, second) => first.distance - second.distance ||
      (first.candidate.entityId < second.candidate.entityId ? -1 : first.candidate.entityId > second.candidate.entityId ? 1 : 0));
  return candidates[0]?.candidate ?? null;
}

export function approachIntent(source, target) {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;
  const distance = Math.hypot(dx, dy);
  return (distance === 0 ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance });
}

export function advanceAttackTimer(actor) {
  requireContract(actor.kind === "actor", "Cadence source must be an actor");
  return Math.min(actor.attackDelayTicks, actor.attackTimer + 1);
}

export function resolveBoundedDirectDamage(source, target, requestedDamage = boundedCombatInteger(source.attackDamage)) {
  requireContract(canActorAttack(source, target), "Attack is not eligible, ready, or in reach");
  const currentHp = boundedCombatInteger(target.hp);
  requireContract(Number.isSafeInteger(requestedDamage)&&requestedDamage>=0&&requestedDamage<=1000000000, 'Invalid requested combat damage');
  const appliedDamage = Math.min(currentHp, requestedDamage);
  const resultingHp = currentHp - appliedDamage;
  return ({ damage: combatIntegerWire(appliedDamage), resultingHp: combatIntegerWire(resultingHp), targetAlive: resultingHp > 0 });
}
