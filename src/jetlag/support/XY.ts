/**
 * It's inconvenient to type PhysicsType2d.Vector2 every time we need it, and we
 * aren't able to cleanly import the PhysicsType2d namespace.  Since Vector2
 * is just a pair of numbers, an easy workaround is to make this XY class, which
 * is just a name wrapper around PhysicsType2d.Vector2.
 */
export class XY extends PhysicsType2d.Vector2 {
    /**
     * Create a 2D point, consisting of X and Y coordinates
     *
     * @param x The X coordinate of the point
     * @param y The Y coordinate of the point
     */
    constructor(x: number, y: number) {
        super(x, y);
    }
}