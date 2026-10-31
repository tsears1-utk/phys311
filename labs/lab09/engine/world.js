"use strict";

import { Vec2 } from "./vec2.js";
import { EulerCromer } from "./integrators.js";
import { resolveCollisions } from "./collisions.js";

export class World {
  constructor({ integrator = new EulerCromer(), bounds = null,
                restitution = 0.9, collisionsEnabled = true } = {}) {
    this.bodies = [];
    this.forces = [];
    this.integrator = integrator;
    this.bounds = bounds;
    this.restitution = restitution;
    this.collisionsEnabled = collisionsEnabled;
    this.disableSeparatingGuard = false;
    this.time = 0;
    this.steps = 0;
    this.collisionCount = 0;
    this.wallCollisionCount = 0;
    this.lastWallCollisionCount = 0;
    this.lastCollisionCount = 0;
    this.lastPairChecks = 0;
  }

  add(body) { this.bodies.push(body); return body; }
  addForce(force) { this.forces.push(force); return force; }
  clearForces() { for (const body of this.bodies) body.clearForce(); }
  applyForces() { for (const force of this.forces) force.apply(this); }

  step(dt) {
    this.clearForces();
    this.applyForces();
    this.integrator.step(this, dt);
    resolveCollisions(this);
    this.time += dt;
    this.steps += 1;
  }

  kineticEnergy() {
    let total = 0;
    for (const body of this.bodies) total += body.kineticEnergy();
    return total;
  }
  potentialEnergy() {
    let total = 0;
    for (const force of this.forces) {
      if (typeof force.potentialEnergy === "function") total += force.potentialEnergy(this);
    }
    return total;
  }
  totalEnergy() { return this.kineticEnergy() + this.potentialEnergy(); }
  totalMomentum() {
    const p = new Vec2();
    for (const body of this.bodies) {
      if (!body.isStatic) p.addScaled(body.vel, body.m);
    }
    return p;
  }
}
