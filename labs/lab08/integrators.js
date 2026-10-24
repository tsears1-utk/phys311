export class Euler {
  step(world, dt) {
    for (const b of world.bodies) {
      if (b.fixed) continue;
      b.acc.set(b.force.x * b.invMass, b.force.y * b.invMass);
      b.pos.addScaled(b.vel, dt);     
      b.vel.addScaled(b.acc, dt);     
    }
  }
}

export class EulerCromer {
  step(world, dt) {
    for (const b of world.bodies) {
      if (b.fixed) continue;
      b.acc.set(b.force.x * b.invMass, b.force.y * b.invMass);
      b.vel.addScaled(b.acc, dt);     
      b.pos.addScaled(b.vel, dt);     
    }
  }
}

export class VelocityVerlet {
  step(world, dt) {
    for (const b of world.bodies) {
      if (b.fixed) continue;
      b.pos.x += b.vel.x * dt + 0.5 * b.acc.x * dt * dt;
      b.pos.y += b.vel.y * dt + 0.5 * b.acc.y * dt * dt;
    }
    
    world.clearForces();
    world.applyForces();
    
    for (const b of world.bodies) {
      if (b.fixed) continue;
      const axN = b.force.x * b.invMass, ayN = b.force.y * b.invMass;
      b.vel.x += 0.5 * (b.acc.x + axN) * dt;
      b.vel.y += 0.5 * (b.acc.y + ayN) * dt;
      b.acc.set(axN, ayN);            
    }
  }
}
