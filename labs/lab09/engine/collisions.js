"use strict";

function resolveWallCollisions(world, body) {
  const bounds = world.bounds;
  if (!bounds || body.isStatic) return 0;
  let hits = 0;
  const e = world.restitution;
  const r = body.radius;

  if (body.pos.x - r < bounds.xMin) {
    body.pos.x = bounds.xMin + r;
    if (body.vel.x < 0) body.vel.x = -e * body.vel.x;
    hits++;
  } else if (body.pos.x + r > bounds.xMax) {
    body.pos.x = bounds.xMax - r;
    if (body.vel.x > 0) body.vel.x = -e * body.vel.x;
    hits++;
  }
  if (body.pos.y - r < bounds.yMin) {
    body.pos.y = bounds.yMin + r;
    if (body.vel.y < 0) body.vel.y = -e * body.vel.y;
    hits++;
  } else if (body.pos.y + r > bounds.yMax) {
    body.pos.y = bounds.yMax - r;
    if (body.vel.y > 0) body.vel.y = -e * body.vel.y;
    hits++;
  }
  return hits;
}

export function resolvePair(a, b, restitution = 1, disableSeparatingGuard = false) {
  if (a.isStatic && b.isStatic) return { overlap: false, impulse: false };
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const rSum = a.radius + b.radius;
  const distSq = dx * dx + dy * dy;
  if (distSq >= rSum * rSum) return { overlap: false, impulse: false };

  let nx, ny, distance;
  if (distSq < 1e-18) {
    nx = a.id < b.id ? 1 : -1;
    ny = 0;
    distance = 0;
  } else {
    distance = Math.sqrt(distSq);
    nx = dx / distance;
    ny = dy / distance;
  }

  const invA = a.isStatic ? 0 : 1 / a.m;
  const invB = b.isStatic ? 0 : 1 / b.m;
  const invSum = invA + invB;
  if (invSum === 0) return { overlap: true, impulse: false };

  // Positional correction removes overlap without changing momentum.
  const overlap = rSum - distance;
  const correction = Math.max(overlap - 1e-4, 0) * 0.82 / invSum;
  if (!a.isStatic) {
    a.pos.x -= nx * correction * invA;
    a.pos.y -= ny * correction * invA;
  }
  if (!b.isStatic) {
    b.pos.x += nx * correction * invB;
    b.pos.y += ny * correction * invB;
  }

  const rvx = b.vel.x - a.vel.x;
  const rvy = b.vel.y - a.vel.y;
  const vn = rvx * nx + rvy * ny;
  if (vn > 0 && !disableSeparatingGuard) {
    return { overlap: true, impulse: false };
  }

  const impulseMagnitude = -(1 + restitution) * vn / invSum;
  if (!a.isStatic) {
    a.vel.x -= nx * impulseMagnitude * invA;
    a.vel.y -= ny * impulseMagnitude * invA;
  }
  if (!b.isStatic) {
    b.vel.x += nx * impulseMagnitude * invB;
    b.vel.y += ny * impulseMagnitude * invB;
  }
  return { overlap: true, impulse: Math.abs(impulseMagnitude) > 0 };
}

export function resolveCollisions(world) {
  if (!world.collisionsEnabled) {
    world.lastCollisionCount = 0;
    world.lastPairChecks = 0;
    return;
  }

  let collisionCount = 0;
  let wallCollisionCount = 0;
  for (const body of world.bodies) {
    const hits = resolveWallCollisions(world, body);
    collisionCount += hits;
    wallCollisionCount += hits;
  }

  let pairChecks = 0;
  const bodies = world.bodies;
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (a.isStatic && b.isStatic) continue;
      const reach = a.radius + b.radius;
      if (Math.abs(a.pos.x - b.pos.x) > reach ||
          Math.abs(a.pos.y - b.pos.y) > reach) continue;
      pairChecks++;
      const result = resolvePair(a, b, world.restitution, world.disableSeparatingGuard);
      if (result.overlap && result.impulse) collisionCount++;
    }
  }
  world.lastCollisionCount = collisionCount;
  world.lastWallCollisionCount = wallCollisionCount;
  world.wallCollisionCount += wallCollisionCount;
  world.collisionCount += collisionCount;
  world.lastPairChecks = pairChecks;
}
