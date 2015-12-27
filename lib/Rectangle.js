// @flow

const EPSILON = 1e-9;

export default class Rectangle {
  x1: number;
  x2: number;
  y1: number;
  y2: number;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    this.x1 = Math.min(x1, x2);
    this.x2 = Math.max(x1, x2);
    this.y1 = Math.min(y1, y2);
    this.y2 = Math.max(y1, y2);
  }

  static fromClientRect(rect: ClientRect) {
    return new Rectangle(
      rect.left,
      rect.top,
      rect.right,
      rect.bottom,
    );
  }

  width(): number {
    return this.x2 - this.x1;
  }

  height(): number {
    return this.y2 - this.y1;
  }

  /**
   * Checks if the rectangle contains a specific point.
   * Lenient to +- EPSILON in both dimensions.
   */
  contains(x: number, y: number): boolean {
    return this.x1 - EPSILON <= x && x <= this.x2 + EPSILON &&
      this.y1 - EPSILON <= y && y <= this.y2 + EPSILON;
  }
}
