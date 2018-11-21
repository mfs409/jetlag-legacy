import { XY } from "../internal/support/XY";

/**
 * Path specifies a set of points that an actor will move among, in order, at a
 * fixed speed.
 */
export class Path {
  /** The X coordinates of the points in the path */
  private points: XY[] = [];

  /**
   * Add a new point to a path by giving (coordinates for where the center of
   * the actor goes next
   *
   * @param x X value of the new coordinate
   * @param y Y value of the new coordinate
   */
  public to(x: number, y: number): Path {
    this.points.push(new XY(x, y));
    return this;
  }

  /** 
   * Return a copy of the ith point in the path.  We return a copy, so that the
   * caller can use the point
   *
   * @param i The index of the point to return
   */
  public getPoint(i: number) { return new XY(this.points[i].x, this.points[i].y); }

  /** Return the number of points in this path */
  public getNumPoints() { return this.points.length; }
}