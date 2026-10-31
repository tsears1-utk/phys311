"use strict";

import { EulerCromer, VelocityVerlet } from "./engine/integrators.js";
import { buildScene } from "./scenes.js";
import { drawWorld } from "./render/renderer.js";
import { drawHUD } from "./render/hud.js";
import {
  runConservationTests,
  runOrbitValidation,
  runPerformanceBenchmark
} from "./validation/validation.js";

const canvas = document.getElementById("sim");
const ctx = canvas.getContext("2d");
const logEl = document.getElementById("log");
const sceneSelect = document.getElementById("scene");
const integratorSelect = document.getElementById("integrator");
const restitutionInput = document.getElementById("restitution");
const restitutionValue = document.getElementById("restitutionValue");
const dtSelect = document.getElementById("dt");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");
const jitterButton = document.getElementById("jitter");
const testsButton = document.getElementById("runTests");
const orbitButton = document.getElementById("runOrbitTest");
const benchmarkButton = document.getElementById("benchmark");

const MAX_FRAME = 0.25;
const MAX_STEPS_PER_FRAME = 40;
let world;
let sceneInfo;
let initialEnergy = 0;
let paused = false;
let accumulator = 0;
let lastFrameTime = performance.now();
let fpsEMA = 60;
let physicsMsEMA = 0;
let renderMsEMA = 0;
let guardDisabled = false;

function makeIntegrator() {
  return integratorSelect.value === "verlet" ? new VelocityVerlet() : new EulerCromer();
}

function log(message, clear = false) {
  if (clear) logEl.textContent = "";
  logEl.textContent += `${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function resetScene() {
  const built = buildScene(sceneSelect.value, makeIntegrator(), Number(restitutionInput.value));
  world = built.world;
  sceneInfo = built.info;
  initialEnergy = world.totalEnergy();
  world.disableSeparatingGuard = guardDisabled;
  paused = false;
  accumulator = 0;
  lastFrameTime = performance.now();
  pauseButton.textContent = "Pause";
  pauseButton.disabled = false;
  log(`Loaded ${sceneInfo.title}. ${sceneInfo.description}.`, true);
  log(`Integrator: ${integratorSelect.value === "verlet" ? "Velocity Verlet" : "Euler-Cromer"}; restitution e = ${world.restitution.toFixed(2)}.`);
}

function updateTrails() {
  for (const body of world.bodies) body.addTrailPoint();
}

function frame(nowMs) {
  const rawFrameTime = Math.max(0, (nowMs - lastFrameTime) / 1000);
  lastFrameTime = nowMs;
  if (rawFrameTime > 0) {
    const fps = 1 / rawFrameTime;
    fpsEMA = 0.9 * fpsEMA + 0.1 * fps;
  }

  let physicsThisFrame = 0;
  let stepsThisFrame = 0;
  if (!paused) {
    accumulator += Math.min(rawFrameTime, MAX_FRAME);
    const dt = Number(dtSelect.value);
    while (accumulator >= dt && stepsThisFrame < MAX_STEPS_PER_FRAME) {
      const start = performance.now();
      world.step(dt);
      physicsThisFrame += performance.now() - start;
      accumulator -= dt;
      stepsThisFrame++;
      updateTrails();
      if (!world.bodies.every(b => Number.isFinite(b.pos.x) && Number.isFinite(b.pos.y))) {
        paused = true;
        log("ERROR: A body position became non-finite. Simulation paused.");
        break;
      }
    }
  }
  physicsMsEMA = 0.85 * physicsMsEMA + 0.15 * physicsThisFrame;

  const renderStart = performance.now();
  drawWorld(ctx, canvas, world, sceneInfo);
  drawHUD(ctx, canvas, world, {
    fps: fpsEMA,
    physicsMs: physicsMsEMA,
    renderMs: renderMsEMA
  }, initialEnergy, integratorSelect.value === "verlet" ? "Velocity Verlet" : "Euler-Cromer");
  renderMsEMA = 0.85 * renderMsEMA + 0.15 * (performance.now() - renderStart);
  requestAnimationFrame(frame);
}

window.runConservationTests = () => runConservationTests(log);
window.runOrbitValidation = () => runOrbitValidation(log);
window.runPerformanceBenchmark = () => runPerformanceBenchmark(canvas, log);

pauseButton.addEventListener("click", () => {
  paused = !paused;
  pauseButton.textContent = paused ? "Resume" : "Pause";
  lastFrameTime = performance.now();
  log(paused ? "Simulation paused." : "Simulation resumed.");
});
resetButton.addEventListener("click", resetScene);
sceneSelect.addEventListener("change", () => {
  if (sceneSelect.value === "nbody") {
    integratorSelect.value = "verlet";
    dtSelect.value = "0.004166666666666667";
  } else {
    integratorSelect.value = "euler-cromer";
    dtSelect.value = "0.008333333333333333";
  }
  resetScene();
});
integratorSelect.addEventListener("change", () => {
  world.integrator = makeIntegrator();
  accumulator = 0;
  initialEnergy = world.totalEnergy();
  log(`Integrator switched at runtime to ${integratorSelect.value === "verlet" ? "Velocity Verlet" : "Euler-Cromer"}.`);
});
restitutionInput.addEventListener("input", () => {
  restitutionValue.textContent = Number(restitutionInput.value).toFixed(2);
  world.restitution = Number(restitutionInput.value);
  log(`Restitution set to e = ${world.restitution.toFixed(2)}.`);
});
dtSelect.addEventListener("change", () => {
  accumulator = 0;
  log(`Fixed timestep changed to ${Number(dtSelect.value).toFixed(6)} s.`);
});
jitterButton.addEventListener("click", () => {
  guardDisabled = !guardDisabled;
  world.disableSeparatingGuard = guardDisabled;
  jitterButton.textContent = guardDisabled ? "Restore separating guard" : "Disable guard (jitter demo)";
  log(guardDisabled
    ? "JITTER DEMO: separating-velocity guard disabled. Overlapping bodies that are already separating may receive reverse impulses."
    : "Separating-velocity guard restored. This prevents impulses from being applied to bodies already moving apart.");
});
testsButton.addEventListener("click", () => {
  log("Running 60-second momentum/energy tests at DT = 1/240 s", true);
  window.runConservationTests();
});
orbitButton.addEventListener("click", () => {
  log("Running the 60-second N-body stability test", true);
  window.runOrbitValidation();
});
benchmarkButton.addEventListener("click", () => {
  log("Running the 20/50/100/200-body performance benchmark", true);
  window.runPerformanceBenchmark();
});

resetScene();
requestAnimationFrame(frame);
