"use strict";

import { Vec2 } from "./vec2.js";

let nextBodyId = 1;

export class Body {
  constructor({ m = 1, mass = undefined, pos = new Vec2(), vel = new Vec2(),
                radius = 0.35, color = "#ff8200", isStatic = false,
                name = "Body", trailLimit = 0 } = {}) {
    const chosenMass = mass === undefined ? m : mass;
    if (!(chosenMass > 0) || !Number.isFinite(chosenMass)) {
      throw new Error("Body mass must be a positive finite number.");
    }
    if (!(radius > 0) || !Number.isFinite(radius)) {
      throw new Error("Body radius must be a positive finite number.");
    }
    this.id = nextBodyId++;
    this.m = chosenMass;
    this.invMass = isStatic ? 0 : 1 / chosenMass;
    this.pos = pos.clone();
    this.vel = vel.clone();
    this.acc = new Vec2();
    this.force = new Vec2();
    this.radius = radius;
    this.color = color;
    this.isStatic = Boolean(isStatic);
    this.name = name;
    this.trail = [];
    this.trailLimit = Math.max(0, Math.floor(trailLimit));
  }

  clearForce() { this.force.zero(); }
  kineticEnergy() { return this.isStatic ? 0 : 0.5 * this.m * this.vel.lengthSq(); }
  addTrailPoint() {
    if (this.trailLimit <= 0) return;
    this.trail.push(this.pos.clone());
    if (this.trail.length > this.trailLimit) this.trail.shift();
  }
}
