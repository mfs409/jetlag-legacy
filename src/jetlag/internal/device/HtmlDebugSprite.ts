/**
 * HtmlDebugSprite is used when we need to render a debug outline on an actor
 */
export class HtmlDebugSprite {
    /**
     *  debugShape is the PIXI context that we use for making the shape's outline
     */
    private readonly debugShape = new PIXI.Graphics();

    /**
     * When we are drawing a circle, debugLine gives us a radius, to help see
     * how things rotate
     */
    private readonly debugLine = new PIXI.Graphics();

    /** Return the render context for drawing the shape outline */
    getShape() { return this.debugShape; }

    /** Return the render context for drawing a radius line (circles only) */
    getLine() { return this.debugLine; }
}