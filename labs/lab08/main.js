"use strict";

import { Vec2 } from "./vec2.js";
import { Body } from "./body.js";
import { Gravity } from "./forces.js";
import { EulerCromer, VelocityVerlet } from "./integrators.js";
import { World } from "./world.js";
import { drawCoordinateDemo, drawProjectile } from "./renderer.js";

const G = 9.81;
const V0 = 20.0;
const THETA = 50 * Math.PI / 180;
const MAX_FRAME = 0.25;
const HEADLESS_DT = 1 / 120;
const HEADLESS_STEPS = 1200;
const MAX_TRAIL = 200;

const canvas = document.getElementById("sim");
const ctx = canvas.getContext("2d");
const logEl = document.getElementById("log");
const methodSelect = document.getElementById("integrator");
const dtSelect = document.getElementById("dt");
const fixedToggle = document.getElementById("fixedStep");
const pauseButton = document.getElementById("pause");
const coordinateButton = document.getElementById("coordinateDemo");

let world;
let paused = false;
let finished = false;
let staticMode = false;
let accumulator = 0;
let lastTime = performance.now();
let lastSteps = 0;
let lastDt = HEADLESS_DT;
let fpsEMA = 60;

function makeIntegrator(name) {
  return name === "verlet" ? new VelocityVerlet() : new EulerCromer();
}

function buildProjectile(methodName) {
  const projectileWorld = new World(makeIntegrator(methodName));
  const projectile = new Body({
    m: 1.0,
    pos: new Vec2(0.0, 0.0),
    vel: new Vec2(V0 * Math.cos(THETA), V0 * Math.sin(THETA)),
    radius: 0.3,
    color: "#ff8200"
  });

  projectileWorld.add(projectile);
  projectileWorld.addForce(new Gravity(G));
  projectileWorld.primeAccelerations();
  projectile.trail.push(projectile.pos.clone());
  return projectileWorld;
}

function currentDT() {
  return 1 / Number(dtSelect.value);
}

function resetSimulation() {
  staticMode = false;
  coordinateButton.textContent = "Show coordinate demo";
  world = buildProjectile(methodSelect.value);
  paused = false;
  finished = false;
  pauseButton.disabled = false;
  accumulator = 0;
  lastSteps = 0;
  lastDt = currentDT();
  lastTime = performance.now();
  fpsEMA = 60;
  pauseButton.textContent = "Pause";
  log(`Reset: v0 = ${V0} m/s, angle = 50°, method = ${methodSelect.value}, DT = ${currentDT().toFixed(6)} s.`);
}

function log(message, clear = false) {
  if (clear) logEl.textContent = "";
  logEl.textContent += `${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function addTrailPoint() {
  const body = world.bodies[0];
  body.trail.push(body.pos.clone());
  if (body.trail.length > MAX_TRAIL) body.trail.shift();
}

function checkLanding() {
  if (world.bodies[0].pos.y < 0) {
    paused = true;
    finished = true;
    pauseButton.textContent = "Landed — Reset";
    pauseButton.disabled = true;
    log("Projectile reached ground level. Press Reset to launch again.");
    return true;
  }
  return false;
}

function render() {
  if (staticMode) {
    drawCoordinateDemo(ctx, canvas);
    return;
  }
  drawProjectile(ctx, canvas, world, {
    method: methodSelect.value === "verlet" ? "Velocity Verlet" : "Euler-Cromer",
    fixed: fixedToggle.checked,
    dt: currentDT(),
    lastDt,
    lastSteps,
    fps: fpsEMA
  });
}

function frame(nowMs) {
  const frameTimeRaw = Math.max(0, (nowMs - lastTime) / 1000);
  lastTime = nowMs;

  if (frameTimeRaw > 0) {
    const instantaneousFPS = 1 / frameTimeRaw;
    fpsEMA = 0.9 * fpsEMA + 0.1 * instantaneousFPS;
  }
  lastSteps = 0;

  if (staticMode) {
    render();
    requestAnimationFrame(frame);
    return;
  }

  if (!paused) {
    if (fixedToggle.checked) {
      // Fixed-timestep accumulator
      const frameTime = Math.min(frameTimeRaw, MAX_FRAME);
      accumulator += frameTime;
      const dt = currentDT();

      while (accumulator >= dt) {
        world.step(dt);
        accumulator -= dt;
        lastSteps += 1;
        lastDt = dt;
        addTrailPoint();
        if (checkLanding()) break;
      }
    } else if (frameTimeRaw > 0) {
      // Deliberately variable-step mode
      const variableDT = Math.min(frameTimeRaw, MAX_FRAME);
      world.step(variableDT);
      lastSteps = 1;
      lastDt = variableDT;
      addTrailPoint();
      checkLanding();
    }
  }

  render();
  requestAnimationFrame(frame);
}

function vec2SelfTest() {
  const a = new Vec2(3, 4);
  const b = new Vec2(1, -2);
  const mutable = new Vec2(3, 4);
  mutable.addTo(b);
  const scaled = new Vec2(3, 4);
  scaled.addScaled(b, 2);

  const checks = [
    ["a.add(b)", a.add(b), new Vec2(4, 2)],
    ["a.sub(b)", a.sub(b), new Vec2(2, 6)],
    ["a.mul(2)", a.mul(2), new Vec2(6, 8)],
    ["a.dot(b)", a.dot(b), -5],
    ["a.length()", a.length(), 5],
    ["a.lengthSq()", a.lengthSq(), 25],
    ["a.normalized()", a.normalized(), new Vec2(0.6, 0.8)],
    ["addTo (in place)", mutable, new Vec2(4, 2)],
    ["addScaled (in place)", scaled, new Vec2(5, 0)]
  ];

  console.group("Lab 8 Part A — Vec2 self-test");
  let allPass = true;
  const rows = checks.map(([operation, got, expected]) => {
    const gx = got instanceof Vec2 ? got.x : got;
    const gy = got instanceof Vec2 ? got.y : undefined;
    const ex = expected instanceof Vec2 ? expected.x : expected;
    const ey = expected instanceof Vec2 ? expected.y : undefined;
    const pass = Math.abs(gx - ex) < 1e-12 &&
      (ey === undefined || Math.abs(gy - ey) < 1e-12);
    allPass = allPass && pass;
    return {
      operation,
      result: got instanceof Vec2 ? `(${gx}, ${gy})` : gx,
      expected: expected instanceof Vec2 ? `(${ex}, ${ey})` : ex,
      pass
    };
  });
  console.table(rows);
  console.log(`Vec2 self-test: ${allPass ? "ALL PASS" : "FAIL"}`);
  console.groupEnd();
  log(`Vec2 self-test: ${allPass ? "ALL PASS" : "FAIL"}. See browser Console for the hand-checkable results.`);
  return allPass;
}

function runHeadless(methodName = methodSelect.value) {
  // Independent world: no animation, no rendering, exactly 1200 steps.
  const validationWorld = buildProjectile(methodName);
  for (let i = 0; i < HEADLESS_STEPS; i++) {
    validationWorld.step(HEADLESS_DT);
  }

  const body = validationWorld.bodies[0];
  const result = {
    method: methodName === "verlet" ? "Velocity Verlet" : "Euler-Cromer",
    steps: validationWorld.steps,
    dt: HEADLESS_DT,
    t: validationWorld.time,
    x: body.pos.x,
    y: body.pos.y,
    vx: body.vel.x,
    vy: body.vel.y,
    E_total: validationWorld.totalEnergy()
  };

  console.group("Lab 8 Part C1 — Headless numerical validation");
  console.log("Initial conditions: m = 1 kg, x0 = y0 = 0 m, v0 = 20 m/s, angle = 50 deg, g = 9.81 m/s^2");
  console.log("No rendering or ground-stop condition is applied in this test.");
  console.log("Final state (full precision):");
  console.table(result);
  console.log(JSON.stringify(result, null, 2));
  console.groupEnd();

  log("\nHEADLESS TEST — 1200 steps at DT = 1/120 s", false);
  for (const [key, value] of Object.entries(result)) {
    log(`${key.padEnd(9)} ${typeof value === "number" ? value.toPrecision(17) : value}`);
  }
  log("Compare these numbers with validation/python_reference.py using the Lab 7 engine.");

  // Make the function callable from the browser Console as required by the lab.
  return result;
}

window.runHeadless = runHeadless;
window.runVec2SelfTest = vec2SelfTest;

//UI
pauseButton.addEventListener("click", () => {
  if (!staticMode && !finished) {
    paused = !paused;
    pauseButton.textContent = paused ? "Resume" : "Pause";
    lastTime = performance.now();
    log(paused ? "Simulation paused." : "Simulation resumed.");
  }
});

document.getElementById("reset").addEventListener("click", resetSimulation);

for (const control of [methodSelect, dtSelect]) {
  control.addEventListener("change", resetSimulation);
}

fixedToggle.addEventListener("change", () => {
  accumulator = 0;
  lastTime = performance.now();
  log(`Timestep mode changed to ${fixedToggle.checked ? "fixed accumulator" : "variable frame dt"}. Reset before each screenshot for a fair comparison.`);
});

coordinateButton.addEventListener("click", () => {
  if (!staticMode) {
    staticMode = true;
    paused = true;
    pauseButton.disabled = true;
    pauseButton.textContent = "Static demo";
    coordinateButton.textContent = "Return to projectile";
    log("Showing static coordinate-transform check: circle center (2, 3) m; radius 0.3 m.");
  } else {
    staticMode = false;
    resetSimulation();
  }
});

document.getElementById("headless").addEventListener("click", () => runHeadless());
document.getElementById("selfTest").addEventListener("click", vec2SelfTest);

document.getElementById("injectLag").addEventListener("click", () => {
  const stallMs = 300;
  log(`Injecting ${stallMs} ms of main-thread lag. Current mode: ${fixedToggle.checked ? "fixed accumulator" : "variable frame dt"}.`);
  const start = performance.now();
  while (performance.now() - start < stallMs) {
    // Intentional busy-wait for the Lab 8 timestep comparison.
  }
  log("Lag injection complete. Observe the trajectory and E_total HUD, then reset and compare the other timestep mode.");
});

resetSimulation();
vec2SelfTest();
requestAnimationFrame(frame);
