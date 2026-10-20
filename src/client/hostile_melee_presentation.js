const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const HOSTILE_STRIKE_FEEDBACK_MS = 190;

export function hostileMeleePose(actor, tick) {
  const phase = actor.meleePhase, geometry = actor.meleeGeometry;
  if (!actor.alive || !geometry || !phase || phase.phase === 'idle') return null;
  const dx = geometry.targetPosition ? geometry.targetPosition.x - actor.position.x : actor.presentationFacingX ?? 1;
  const dy = geometry.targetPosition ? geometry.targetPosition.y - actor.position.y : 0;
  const distance = Math.hypot(dx, dy), direction = distance > .001 ? {x: dx / distance, y: dy / distance} : {x: 1, y: 0};
  const sourceRadius = geometry.sourceRadius, targetRadius = geometry.targetRadius;
  const centerLimit = geometry.mode === 'clearHullGap' ? geometry.reach + sourceRadius + targetRadius : geometry.reach;
  // A strike reaches the target's near surface, not its center. Combat uses
  // combatRadius (enemy10.8 / hero9), not either collision hull radius.
  const weaponReach = Math.max(sourceRadius, centerLimit - targetRadius);
  const progress = clamp((tick - phase.phaseStartedTick) / Math.max(1, phase.phaseEndsTick - phase.phaseStartedTick), 0, 1);
  const lunge = phase.phase === 'windup' ? -3 * progress
    : phase.phase === 'impact' ? Math.min(27, Math.max(0, weaponReach - 16)) * (1 - .2 * progress)
    : Math.min(20, Math.max(0, weaponReach - 16)) * (1 - progress);
  return {phase: phase.phase, progress, direction, sourceRadius, targetRadius, centerLimit, weaponReach, lunge};
}

export function drawHostileMeleePhase(ctx, pose) {
  if (!pose) return;
  ctx.save(); ctx.rotate(Math.atan2(pose.direction.y, pose.direction.x));
  if (pose.phase === 'windup') {
    const reach = pose.weaponReach, p = pose.progress;
    ctx.globalAlpha *= .3 + .45 * p; ctx.strokeStyle = '#ffc078'; ctx.lineWidth = 1.2 + p;
    ctx.beginPath(); ctx.moveTo(pose.sourceRadius, -3); ctx.lineTo(reach, -3);
    ctx.moveTo(pose.sourceRadius, 3); ctx.lineTo(reach, 3); ctx.stroke();
    ctx.beginPath(); ctx.arc(reach - 3, 0, 4, -.8, .8); ctx.stroke();
  } else if (pose.phase === 'impact') {
    drawHostileStrikeTrail(ctx, {x: 0, y: 0}, {x: 1, y: 0}, pose.weaponReach,
      pose.progress * HOSTILE_STRIKE_FEEDBACK_MS * .45);
  }
  ctx.restore();
}

export function drawHostileStrikeTrail(ctx, source, direction, reach, age) {
  if (age < 0 || age >= HOSTILE_STRIKE_FEEDBACK_MS) return;
  const t = age / HOSTILE_STRIKE_FEEDBACK_MS;
  ctx.save(); ctx.translate(source.x, source.y); ctx.rotate(Math.atan2(direction.y, direction.x));
  ctx.globalAlpha *= (1 - t) ** 1.4;
  ctx.fillStyle = '#b24837'; ctx.beginPath(); ctx.moveTo(10, -4 * (1 - t));
  ctx.quadraticCurveTo(reach * .6, -8 * (1 - t), reach, 0);
  ctx.quadraticCurveTo(reach * .55, 6 * (1 - t), 10, 4 * (1 - t)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffe5ba'; ctx.lineWidth = 2 * (1 - t) + .5;
  ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(reach, 0); ctx.stroke();
  ctx.restore();
}
