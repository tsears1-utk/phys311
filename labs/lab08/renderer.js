"use strict";

import { Camera } from "./camera.js";

function drawGrid(ctx, canvas, camera, spacing, digits = 0) {
  ctx.save();
  ctx.strokeStyle = "rgba(160, 170, 180, 0.16)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#9ca3af";
  ctx.font = "11px monospace";

  const xMin = Math.ceil(camera.toWorldX(0) / spacing) * spacing;
  const xMax = camera.toWorldX(canvas.width);
  for (let x = xMin; x <= xMax + 1e-9; x += spacing) {
    const px = camera.toScreenX(x);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();
    if (Math.abs(x) > 1e-9) ctx.fillText(x.toFixed(digits), px + 3, camera.toScreenY(0) + 16);
  }

  const yMin = Math.ceil(camera.toWorldY(canvas.height) / spacing) * spacing;
  const yMax = camera.toWorldY(0);
  for (let y = yMin; y <= yMax + 1e-9; y += spacing) {
    const py = camera.toScreenY(y);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
    if (Math.abs(y) > 1e-9) ctx.fillText(y.toFixed(digits), camera.toScreenX(0) + 5, py - 4);
  }
  ctx.restore();
}

function drawAxes(ctx, canvas, camera, tickSpacing, digits = 0) {
  drawGrid(ctx, canvas, camera, tickSpacing, digits);

  ctx.save();
  ctx.strokeStyle = "#5ca66b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, camera.toScreenY(0));
  ctx.lineTo(canvas.width, camera.toScreenY(0));
  ctx.stroke();

  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(camera.toScreenX(0), 0);
  ctx.lineTo(camera.toScreenX(0), canvas.height);
  ctx.stroke();
  ctx.restore();
}

export function drawCoordinateDemo(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#151a21";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const camera = new Camera(42, 62, canvas.height - 60);
  drawAxes(ctx, canvas, camera, 1, 0);

  const x = camera.toScreenX(2);
  const y = camera.toScreenY(3);
  const r = camera.toScreenLen(0.3);

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ff8200";
  ctx.fill();
  ctx.strokeStyle = "#fff3e6";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#f3f4f6";
  ctx.font = "14px monospace";
  ctx.fillText("Static coordinate-transform check", 18, 24);
  ctx.font = "12px monospace";
  ctx.fillText("Circle center = (2.000 m, 3.000 m), radius = 0.300 m", 18, 44);
  ctx.fillText("Ground is y = 0; positive physics y points upward.", 18, 62);
}

function drawTrail(ctx, camera, trail) {
  if (trail.length < 2) return;
  for (let i = 1; i < trail.length; i++) {
    const alpha = 0.04 + 0.72 * (i / (trail.length - 1));
    ctx.strokeStyle = `rgba(255, 130, 0, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camera.toScreenX(trail[i - 1].x), camera.toScreenY(trail[i - 1].y));
    ctx.lineTo(camera.toScreenX(trail[i].x), camera.toScreenY(trail[i].y));
    ctx.stroke();
  }
}

function drawHUD(ctx, canvas, world, settings) {
  const body = world.bodies[0];
  const speed = body.vel.length();
  const KE = body.kineticEnergy();
  const PE = world.potentialEnergy();
  const E = world.totalEnergy();
  const mode = settings.fixed ? "fixed accumulator" : "variable frame dt";
  const lines = [
    `t       = ${world.time.toFixed(3)} s`,
    `x       = ${body.pos.x.toFixed(3)} m`,
    `y       = ${body.pos.y.toFixed(3)} m`,
    `|v|     = ${speed.toFixed(3)} m/s`,
    `KE      = ${KE.toFixed(3)} J`,
    `PE      = ${PE.toFixed(3)} J`,
    `E_total = ${E.toFixed(3)} J`,
    `method  = ${settings.method}`,
    `mode    = ${mode}`,
    `DT      = ${settings.fixed ? settings.dt.toFixed(5) : settings.lastDt.toFixed(5)} s`,
    `steps   = ${world.steps}   (last frame: ${settings.lastSteps})`
  ];
  const x = 12, y = 12, width = 310, lineH = 18, height = lines.length * lineH + 18;
  ctx.fillStyle = "rgba(10, 14, 20, 0.88)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.strokeRect(x, y, width, height);
  ctx.font = "12px monospace";
  ctx.textBaseline = "top";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = i === 6 ? "#9ee6b1" : "#eef2f7";
    ctx.fillText(lines[i], x + 10, y + 9 + i * lineH);
  }
  ctx.textBaseline = "alphabetic";
}

export function drawProjectile(ctx, canvas, world, settings) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#151a21";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const camera = new Camera(20, 62, canvas.height - 52);
  drawAxes(ctx, canvas, camera, 5, 0);

  const body = world.bodies[0];
  drawTrail(ctx, camera, body.trail);

  const px = camera.toScreenX(body.pos.x);
  const py = camera.toScreenY(body.pos.y);
  const radius = Math.max(5, camera.toScreenLen(body.radius));

  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fillStyle = body.color;
  ctx.fill();
  ctx.strokeStyle = "#fff0df";
  ctx.lineWidth = 2;
  ctx.stroke();

  const arrowScale = 0.35;
  const tipX = camera.toScreenX(body.pos.x + body.vel.x * arrowScale);
  const tipY = camera.toScreenY(body.pos.y + body.vel.y * arrowScale);
  ctx.strokeStyle = "#9cdcfe";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  drawHUD(ctx, canvas, world, settings);
}
