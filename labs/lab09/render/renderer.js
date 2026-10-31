"use strict";

import { Camera } from "./camera.js";

function drawGrid(ctx, canvas, camera, bounds, spacing = 2) {
  ctx.save();
  ctx.strokeStyle = "rgba(166, 180, 194, 0.12)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#8492a3";
  ctx.font = "10px monospace";
  for (let x = Math.ceil(bounds.xMin / spacing) * spacing; x <= bounds.xMax; x += spacing) {
    const px = camera.toScreenX(x);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); ctx.stroke();
  }
  for (let y = Math.ceil(bounds.yMin / spacing) * spacing; y <= bounds.yMax; y += spacing) {
    const py = camera.toScreenY(y);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke();
  }
  ctx.restore();
}

function drawBounds(ctx, canvas, camera, bounds) {
  if (!bounds) return;
  const left = camera.toScreenX(bounds.xMin);
  const right = camera.toScreenX(bounds.xMax);
  const top = camera.toScreenY(bounds.yMax);
  const bottom = camera.toScreenY(bounds.yMin);
  ctx.save();
  ctx.strokeStyle = "#aeb9c6";
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, right - left, bottom - top);
  ctx.restore();
}

function drawSpring(ctx, camera, anchor, body) {
  const ax = camera.toScreenX(anchor.x);
  const ay = camera.toScreenY(anchor.y);
  const bx = camera.toScreenX(body.pos.x);
  const by = camera.toScreenY(body.pos.y);
  ctx.save();
  ctx.strokeStyle = "#a5b4fc";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#dbeafe";
  ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBody(ctx, camera, body) {
  const x = camera.toScreenX(body.pos.x);
  const y = camera.toScreenY(body.pos.y);
  const radius = Math.max(3, camera.toScreenLen(body.radius));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = body.color;
  ctx.fill();
  ctx.lineWidth = body.isStatic ? 3 : 1.5;
  ctx.strokeStyle = body.isStatic ? "#ffffff" : "rgba(255,255,255,0.8)";
  ctx.stroke();
  if (body.isStatic) {
    ctx.beginPath(); ctx.moveTo(x - radius * 0.55, y); ctx.lineTo(x + radius * 0.55, y);
    ctx.moveTo(x, y - radius * 0.55); ctx.lineTo(x, y + radius * 0.55);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

function drawTrail(ctx, camera, trail, color) {
  if (trail.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.38;
  ctx.beginPath();
  ctx.moveTo(camera.toScreenX(trail[0].x), camera.toScreenY(trail[0].y));
  for (let i = 1; i < trail.length; i++) {
    ctx.lineTo(camera.toScreenX(trail[i].x), camera.toScreenY(trail[i].y));
  }
  ctx.stroke();
  ctx.restore();
}

export function drawWorld(ctx, canvas, world, sceneInfo) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#151a21";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const viewBounds = sceneInfo.viewBounds || world.bounds || {
    xMin: -20, xMax: 20, yMin: -15, yMax: 15
  };
  const camera = Camera.fit(canvas, viewBounds, 46);
  drawGrid(ctx, canvas, camera, viewBounds, sceneInfo.gridSpacing || 2);
  drawBounds(ctx, canvas, camera, world.bounds || viewBounds);

  if (sceneInfo.anchors) {
    for (const item of sceneInfo.anchors) {
      const body = world.bodies.find(b => b.id === item.bodyId);
      if (body) drawSpring(ctx, camera, item.anchor, body);
    }
  }

  for (const body of world.bodies) {
    drawTrail(ctx, camera, body.trail, body.color);
  }
  for (const body of world.bodies) drawBody(ctx, camera, body);

  ctx.save();
  ctx.fillStyle = "#e6edf3";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(sceneInfo.title, 16, canvas.height - 15);
  ctx.restore();
}
