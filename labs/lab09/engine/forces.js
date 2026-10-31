"use strict";

import { Vec2 } from "./vec2.js";

export class Gravity {
  constructor(g = 9.81) { this.g = g; }
  apply(world) {
    for (const b of world.bodies) {
      if (!b.isStatic) b.force.y -= b.m * this.g;
    }
  }
  potentialEnergy(world) {
    let U = 0;
    for (const b of world.bodies) {
      if (!b.isStatic) U += b.m * this.g * b.pos.y;
    }
    return U;
  }
}

export class Drag {
  constructor(c = 0.05) { this.c = c; }
  apply(world) {
    for (const b of world.bodies) {
      if (b.isStatic) continue;
      const speed = b.vel.length();
      if (speed > 0) b.force.addScaled(b.vel, -this.c * speed);
    }
  }
}

// Hooke-law spring between one dynamic body and a fixed anchor point.
export class Spring {
  constructor(body, anchor, k, restLength = 0) {
    this.body = body;
    this.anchor = anchor.clone();
    this.k = k;
    this.restLength = restLength;
  }
  apply(world) {
    if (this.body.isStatic) return;
    const displacement = this.body.pos.sub(this.anchor);
    const length = displacement.length();
    if (length === 0) return;
    const stretch = length - this.restLength;
    this.body.force.addScaled(displacement, -this.k * stretch / length);
  }
  potentialEnergy(world) {
    const stretch = this.body.pos.sub(this.anchor).length() - this.restLength;
    return 0.5 * this.k * stretch * stretch;
  }
}

export class NewtonGravity {
  constructor(G = 1, softening = 0.15) {
    this.G = G;
    this.softening = softening;
  }
  apply(world) {
    const bodies = world.bodies;
    const eps2 = this.softening * this.softening;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        if (a.isStatic && b.isStatic) continue;
        const d = b.pos.sub(a.pos);
        const r2 = d.lengthSq() + eps2;
        const factor = this.G * a.m * b.m / (r2 * Math.sqrt(r2));
        if (!a.isStatic) a.force.addScaled(d, factor);
        if (!b.isStatic) b.force.addScaled(d, -factor);
      }
    }
  }
  potentialEnergy(world) {
    let U = 0;
    const bodies = world.bodies;
    const eps2 = this.softening * this.softening;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const d = bodies[j].pos.sub(bodies[i].pos);
        U -= this.G * bodies[i].m * bodies[j].m /
          Math.sqrt(d.lengthSq() + eps2);
      }
    }
    return U;
  }
}
