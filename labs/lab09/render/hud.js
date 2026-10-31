"use strict";

export function drawHUD(ctx, canvas, world, metrics, initialEnergy, integratorName) {
  const energy = world.totalEnergy();
  const momentum = world.totalMomentum();
  const drift = Math.abs(initialEnergy) > 1e-14
    ? (energy - initialEnergy) / Math.abs(initialEnergy)
    : 0;
  const lines = [
    `t = ${world.time.toFixed(2)} s`,
    `bodies = ${world.bodies.length}   collisions = ${world.collisionCount}`,
    `E_total = ${energy.toFixed(5)} J`,
    `energy drift = ${(100 * drift).toFixed(3)} %`,
    `|p| = ${momentum.length().toFixed(5)} kg m/s`,
    `integrator = ${integratorName}`,
    `fps = ${metrics.fps.toFixed(1)}`,
    `physics = ${metrics.physicsMs.toFixed(3)} ms/frame`,
    `render = ${metrics.renderMs.toFixed(3)} ms/frame`
  ];
  const x = 12, y = 12, lineH = 18, width = 286, height = lines.length * lineH + 16;
  ctx.save();
  ctx.fillStyle = "rgba(8, 12, 18, 0.88)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.strokeRect(x, y, width, height);
  ctx.font = "12px monospace";
  ctx.textBaseline = "top";
  for (let i = 0; i < lines.length; i++) {
    if (i === 3) ctx.fillStyle = Math.abs(drift) > 0.01 ? "#ff6666" : "#9ee6b1";
    else ctx.fillStyle = "#eef2f7";
    ctx.fillText(lines[i], x + 10, y + 8 + i * lineH);
  }
  ctx.restore();
  return { energy, momentum, drift };
}
