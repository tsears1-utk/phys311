"use strict";

import { VelocityVerlet } from "../engine/integrators.js";
import { NewtonGravity } from "../engine/forces.js";
import { Vec2 } from "../engine/vec2.js";
import { Body } from "../engine/body.js";
import { createNBodyWorld, makeGasTestWorld, makeBenchmarkWorld } from "../scenes.js";
import { drawWorld } from "../render/renderer.js";

export function runGasValidation(restitution, count = 20) {
  const world = makeGasTestWorld(count, restitution);
  const dt = 1 / 240;
  const steps = Math.round(60 / dt);
  const p0 = world.totalMomentum();
  const e0 = world.totalEnergy();
  let minEnergy = e0;
  let maxEnergy = e0;
  let monotonicEnergy = true;
  let previousEnergy = e0;
  for (let i = 0; i < steps; i++) {
    world.step(dt);
    const energy = world.totalEnergy();
    minEnergy = Math.min(minEnergy, energy);
    maxEnergy = Math.max(maxEnergy, energy);
    if (energy > previousEnergy + 1e-9 * Math.max(1, e0)) monotonicEnergy = false;
    previousEnergy = energy;
  }
  const p1 = world.totalMomentum();
  const e1 = world.totalEnergy();
  return {
    count,
    restitution,
    time: world.time,
    steps,
    initialMomentumMagnitude: p0.length(),
    finalMomentumMagnitude: p1.length(),
    momentumVectorDifference: p1.sub(p0).length(),
    initialEnergy: e0,
    finalEnergy: e1,
    fractionalEnergyDrift: (e1 - e0) / Math.abs(e0),
    minimumEnergy: minEnergy,
    maximumEnergy: maxEnergy,
    monotonicEnergy,
    pairCollisions: world.collisionCount,
    wallCollisions: world.wallCollisionCount
  };
}

export function runConservationTests(log = () => {}) {
  const elastic20 = runGasValidation(1.0, 20);
  const inelastic20 = runGasValidation(0.8, 20);
  const elastic50 = runGasValidation(1.0, 50);
  const inelastic50 = runGasValidation(0.8, 50);
  const results = { elastic20, inelastic20, elastic50, inelastic50 };
  console.group("Lab 9 B2 — collision validation");
  console.log("Required 20-body elastic case (e = 1.0)", elastic20);
  console.log("Required 20-body inelastic case (e = 0.8)", inelastic20);
  console.log("Supplemental 50-body elastic stress case (e = 1.0)", elastic50);
  console.log("Supplemental 50-body inelastic stress case (e = 0.8)", inelastic50);
  console.groupEnd();

  for (const [label, result] of [
    ["REQUIRED 20-BODY ELASTIC CASE (e = 1.0)", elastic20],
    ["REQUIRED 20-BODY INELASTIC CASE (e = 0.8)", inelastic20],
    ["SUPPLEMENTAL 50-BODY ELASTIC STRESS TEST (e = 1.0)", elastic50],
    ["SUPPLEMENTAL 50-BODY INELASTIC STRESS TEST (e = 0.8)", inelastic50]
  ]) {
    log(label);
    log(`bodies = ${result.count}; t = ${result.time.toFixed(3)} s; pair collisions = ${result.pairCollisions}; wall collisions = ${result.wallCollisions}`);
    log(`|p|: ${result.initialMomentumMagnitude.toPrecision(10)} -> ${result.finalMomentumMagnitude.toPrecision(10)} kg m/s`);
    log(`|Δp| = ${result.momentumVectorDifference.toExponential(4)} kg m/s`);
    log(`E_total: ${result.initialEnergy.toPrecision(10)} -> ${result.finalEnergy.toPrecision(10)} J`);
    log(`fractional energy drift = ${(100 * result.fractionalEnergyDrift).toExponential(4)} %`);
    if (result.restitution < 1) log(`energy non-increasing (within round-off): ${result.monotonicEnergy}`);
  }
  log("The test box is deliberately large so no particles hit its walls. With no applied forces and no wall impacts, pair impulses are internal, so momentum is conserved.");
  return results;
}

export function runOrbitValidation(log = () => {}) {
  const world = createNBodyWorld(new VelocityVerlet(), false);
  const dt = 1 / 240;
  const steps = Math.round(60 / dt);
  const e0 = world.totalEnergy();
  let eMin = e0;
  let eMax = e0;
  let allFinite = true;
  for (let i = 0; i < steps; i++) {
    world.step(dt);
    const energy = world.totalEnergy();
    eMin = Math.min(eMin, energy);
    eMax = Math.max(eMax, energy);
    if (!world.bodies.every(b => Number.isFinite(b.pos.x) && Number.isFinite(b.pos.y) && Number.isFinite(b.vel.x) && Number.isFinite(b.vel.y))) {
      allFinite = false;
      break;
    }
  }
  const e1 = world.totalEnergy();
  const maxDrift = Math.max(Math.abs(eMax - e0), Math.abs(eMin - e0)) / Math.abs(e0);
  const result = {
    simulatedTime: world.time,
    steps: world.steps,
    initialEnergy: e0,
    finalEnergy: e1,
    minimumEnergy: eMin,
    maximumEnergy: eMax,
    finalFractionalDrift: (e1 - e0) / Math.abs(e0),
    maximumFractionalExcursion: maxDrift,
    allStatesFinite: allFinite,
    bodyCount: world.bodies.length
  };
  console.log("Lab 9 Scene 2 — 60-second N-body stability test", result);
  log(`Simulated time: ${result.simulatedTime.toFixed(3)} s; steps: ${result.steps}; bodies: ${result.bodyCount}`);
  log(`Energy: ${e0.toPrecision(10)} -> ${e1.toPrecision(10)} J`);
  log(`Maximum fractional energy excursion: ${(100 * maxDrift).toFixed(5)} %`);
  log(`All states finite: ${allFinite}`);
  return result;
}

export function runPerformanceBenchmark(canvas, log = () => {}) {
  const results = [];
  const benchCanvas = document.createElement("canvas");
  benchCanvas.width = canvas.width;
  benchCanvas.height = canvas.height;
  const benchCtx = benchCanvas.getContext("2d");
  const benchInfo = {
    title: "Performance benchmark",
    viewBounds: { xMin: 0, xMax: 52, yMin: 0, yMax: 32 },
    gridSpacing: 4
  };
  for (const count of [20, 50, 100, 200]) {
    const world = makeBenchmarkWorld(count);
    for (let i = 0; i < 30; i++) world.step(1 / 120);
    const physicsSteps = 180;
    const p0 = performance.now();
    for (let i = 0; i < physicsSteps; i++) world.step(1 / 120);
    const physicsMs = (performance.now() - p0) / physicsSteps;

    const renderRepeats = 24;
    const r0 = performance.now();
    for (let i = 0; i < renderRepeats; i++) drawWorld(benchCtx, benchCanvas, world, benchInfo);
    const renderMs = (performance.now() - r0) / renderRepeats;
    const estimatedFps = Math.min(60, 1000 / Math.max(1e-9, 2 * physicsMs + renderMs));
    results.push({
      bodies: count,
      broadPhasePairChecksPerStep: count * (count - 1) / 2,
      physicsMsPerStep: physicsMs,
      renderMsPerDraw: renderMs,
      estimatedFps
    });
  }
  console.table(results);
  log("PERFORMANCE SCALING (browser measurements)");
  log("Bodies | broad-phase pair checks/step | physics ms/step | render ms/draw | estimated FPS");
  for (const result of results) {
    log(`${String(result.bodies).padEnd(6)} | ${String(result.broadPhasePairChecksPerStep).padEnd(29)} | ${result.physicsMsPerStep.toFixed(4).padEnd(15)} | ${result.renderMsPerDraw.toFixed(4).padEnd(14)} | ${result.estimatedFps.toFixed(1)}`);
  }
  log("FPS estimate assumes two fixed 1/120-s physics steps plus one render in a 60-Hz frame. Live measured FPS is also shown in the canvas HUD.");
  return results;
}
