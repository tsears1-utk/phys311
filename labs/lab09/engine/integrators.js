"use strict";

export class EulerCromer {
  step(world, dt) {
    for (const b of world.bodies) {
      if (b.isStatic) continue;
      b.acc.set(b.force.x * b.invMass, b.force.y * b.invMass);
      b.vel.addScaled(b.acc, dt);
      b.pos.addScaled(b.vel, dt);
    }
  }
}

export class VelocityVerlet {
  step(world, dt) {
    const oldAx = new Array(world.bodies.length);
    const oldAy = new Array(world.bodies.length);

    for (let i = 0; i < world.bodies.length; i++) {
      const b = world.bodies[i];
      if (b.isStatic) { oldAx[i] = 0; oldAy[i] = 0; continue; }
      const ax = b.force.x * b.invMass;
      const ay = b.force.y * b.invMass;
      oldAx[i] = ax;
      oldAy[i] = ay;
      b.pos.x += b.vel.x * dt + 0.5 * ax * dt * dt;
      b.pos.y += b.vel.y * dt + 0.5 * ay * dt * dt;
    }

    world.clearForces();
    world.applyForces();

    for (let i = 0; i < world.bodies.length; i++) {
      const b = world.bodies[i];
      if (b.isStatic) continue;
      const newAx = b.force.x * b.invMass;
      const newAy = b.force.y * b.invMass;
      b.vel.x += 0.5 * (oldAx[i] + newAx) * dt;
      b.vel.y += 0.5 * (oldAy[i] + newAy) * dt;
      b.acc.set(newAx, newAy);
    }
  }
}
