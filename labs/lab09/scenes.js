"use strict";

import { Vec2 } from "./engine/vec2.js";
import { Body } from "./engine/body.js";
import { Gravity, Drag, Spring, NewtonGravity } from "./engine/forces.js";
import { EulerCromer } from "./engine/integrators.js";
import { World } from "./engine/world.js";

export function createBallPitWorld(count = 24, restitution = 1, integrator = new EulerCromer(), addObstacle = true) {
  const bounds = { xMin: 0, xMax: 32, yMin: 0, yMax: 16 };
  const world = new World({ integrator, bounds, restitution, collisionsEnabled: true });
  const columns = 6;
  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const angle = i * 2.399963229728653;
    const speed = 1.35 + 0.22 * (i % 4);
    world.add(new Body({
      m: 0.8 + 0.15 * (i % 5),
      pos: new Vec2(2.2 + col * 3.05, 2.0 + row * 3.65),
      vel: new Vec2(speed * Math.cos(angle), speed * Math.sin(angle)),
      radius: 0.46,
      color: ["#ff8200", "#45b8ac", "#8b9cf6", "#f2c14e", "#e879a6"][i % 5],
      name: `Ball ${i + 1}`
    }));
  }
  if (addObstacle) {
    world.add(new Body({
      m: 1, pos: new Vec2(28.0, 8.0), vel: new Vec2(),
      radius: 1.15, color: "#778899", isStatic: true, name: "Static obstacle"
    }));
  }
  return world;
}

export function createNBodyWorld(integrator, withTrails = true) {
  const world = new World({ integrator, bounds: null, restitution: 1, collisionsEnabled: false });
  const G = 1.0;
  const starMass = 160.0;
  const star = world.add(new Body({
    m: starMass, pos: new Vec2(0, 0), vel: new Vec2(), radius: 0.82,
    color: "#f7c948", name: "Central star", trailLimit: withTrails ? 220 : 0
  }));
  const planets = [
    { m: 1.0, r: 6.0, angle: 0.0, color: "#55c1e7" },
    { m: 1.4, r: 9.0, angle: Math.PI / 2, color: "#e879a6" },
    { m: 1.8, r: 12.0, angle: Math.PI, color: "#8b9cf6" },
    { m: 2.2, r: 15.0, angle: 3 * Math.PI / 2, color: "#78c091" }
  ];
  let totalPx = 0;
  let totalPy = 0;
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const x = p.r * Math.cos(p.angle);
    const y = p.r * Math.sin(p.angle);
    const speed = Math.sqrt(G * starMass / p.r);
    const vx = -speed * Math.sin(p.angle);
    const vy = speed * Math.cos(p.angle);
    totalPx += p.m * vx;
    totalPy += p.m * vy;
    world.add(new Body({
      m: p.m, pos: new Vec2(x, y), vel: new Vec2(vx, vy), radius: 0.28,
      color: p.color, name: `Planet ${i + 1}`, trailLimit: withTrails ? 260 : 0
    }));
  }
  // Makes total initial momentum approximately zero.
  star.vel.set(-totalPx / starMass, -totalPy / starMass);
  world.addForce(new NewtonGravity(G, 0.2));
  return world;
}

export function createSpringWorld(integrator) {
  const world = new World({
    integrator,
    bounds: { xMin: 0, xMax: 24, yMin: 0, yMax: 15 },
    restitution: 0.8,
    collisionsEnabled: true
  });
  world.addForce(new Gravity(9.81));
  world.addForce(new Drag(0.035));
  const anchorXs = [3.5, 9.0, 14.5, 20.0];
  const anchors = [];
  const offsets = [
    new Vec2(1.2, -4.0), new Vec2(-1.0, -4.4),
    new Vec2(1.0, -3.6), new Vec2(-1.25, -4.2)
  ];
  for (let i = 0; i < anchorXs.length; i++) {
    const anchor = new Vec2(anchorXs[i], 11.5);
    const body = world.add(new Body({
      m: 1.0 + 0.2 * i,
      pos: anchor.add(offsets[i]),
      vel: new Vec2((i % 2 === 0 ? 0.8 : -0.65), 0.25 * (i - 1)),
      radius: 0.34,
      color: ["#ff8200", "#55c1e7", "#e879a6", "#78c091"][i],
      name: `Spring mass ${i + 1}`,
      trailLimit: 160
    }));
    world.addForce(new Spring(body, anchor, 9 + i, 3.7));
    anchors.push({ bodyId: body.id, anchor });
  }
  return { world, anchors };
}

export function buildScene(name, integrator, restitution) {
  if (name === "ballpit") {
    const world = createBallPitWorld(24, restitution, integrator, true);
    return {
      world,
      info: {
        title: "Scene 1 — Billiards / ball pit",
        viewBounds: world.bounds,
        gridSpacing: 2,
        anchors: null,
        description: "24 moving circles, an immovable obstacle, wall and pair collisions"
      }
    };
  }
  if (name === "nbody") {
    const world = createNBodyWorld(integrator, true);
    return {
      world,
      info: {
        title: "Scene 2 — Softened gravitational N-body system",
        viewBounds: { xMin: -19, xMax: 19, yMin: -18, yMax: 18 },
        gridSpacing: 3,
        anchors: null,
        description: "One central star and four orbiting bodies; NewtonGravity + Velocity Verlet recommended"
      }
    };
  }
  const setup = createSpringWorld(integrator);
  return {
    world: setup.world,
    info: {
      title: "Scene 3 — Damped spring-mass array",
      viewBounds: { xMin: 0, xMax: 24, yMin: 0, yMax: 15 },
      gridSpacing: 2,
      anchors: setup.anchors,
      description: "Four masses attached to fixed spring anchors under gravity and drag"
    }
  };
}

export function makeGasTestWorld(count, restitution) {
  const world = new World({
    integrator: new EulerCromer(),
    bounds: { xMin: -250, xMax: 250, yMin: -250, yMax: 250 },
    restitution,
    collisionsEnabled: true
  });
  const cols = count === 20 ? 5 : Math.ceil(Math.sqrt(count * 1.5));
  const rows = Math.ceil(count / cols);
  const spacing = count === 20 ? 1.06 : 1.02;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = (col - (cols - 1) / 2) * spacing;
    const y = (row - (rows - 1) / 2) * spacing;
    const phase = i * 1.61803398875;
    world.add(new Body({
      m: 1,
      pos: new Vec2(x, y),
      vel: new Vec2(-0.58 * x + 0.35 * Math.sin(phase),
                    -0.58 * y + 0.35 * Math.cos(phase)),
      radius: 0.5,
      color: ["#ff8200", "#55c1e7", "#e879a6", "#8b9cf6"][i % 4],
      name: `Gas ball ${i + 1}`
    }));
  }
  return world;
}

export function makeBenchmarkWorld(count) {
  const columns = 20;
  const bounds = { xMin: 0, xMax: 52, yMin: 0, yMax: 32 };
  const world = new World({ integrator: new EulerCromer(), bounds, restitution: 0.92, collisionsEnabled: true });
  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const phase = i * 2.399963229728653;
    world.add(new Body({
      m: 1,
      pos: new Vec2(1.5 + col * 1.25, 1.5 + row * 1.25),
      vel: new Vec2(1.1 * Math.cos(phase), 1.1 * Math.sin(phase)),
      radius: 0.32,
      color: "#ff8200",
      name: `Benchmark ${i + 1}`
    }));
  }
  return world;
}
