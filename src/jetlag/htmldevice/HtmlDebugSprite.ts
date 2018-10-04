/**
 * HtmlDebugSprite is used when we need to render a debug outline on an actor
 */
export class HtmlDebugSprite {
    /** For debug rendering */
    debugShape = new PIXI.Graphics();

    /** For debug rendering of the radius, if this is a circle */
    debugLine = new PIXI.Graphics();

    /** Return the render context for drawing the shape outline */
    getShape() { return this.debugShape; }

    /** Return the render context for drawing a line (circles only) */
    getLine() { return this.debugLine; }
}