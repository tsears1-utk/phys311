"use strict";

export class Camera {
  constructor(scale, originX, originY) {
    this.scale = scale;
    this.originX = originX;
    this.originY = originY;
  }
  toScreenX(x) { return this.originX + x * this.scale; }
  toScreenY(y) { return this.originY - y * this.scale; }
  toScreenLen(length) { return length * this.scale; }
  static fit(canvas, bounds, padding = 48) {
    const width = bounds.xMax - bounds.xMin;
    const height = bounds.yMax - bounds.yMin;
    const scale = Math.min((canvas.width - 2 * padding) / width,
                           (canvas.height - 2 * padding) / height);
    const originX = (canvas.width - width * scale) / 2 - bounds.xMin * scale;
    const originY = (canvas.height + height * scale) / 2 + bounds.yMin * scale;
    return new Camera(scale, originX, originY);
  }
}
