import { JetLagText } from "../support/Interfaces"
import { XY } from "../support/XY";

/** HtmlText provides JetLagText functionality via the PIXI.text type. */
export class HtmlText implements JetLagText {
    /**
     * Create an HtmlText by wrapping a PIXI text
     * @param text A PIXI text object
     */
    constructor(private text: PIXI.Text) { }

    /** Report the X position of the text */
    getXPosition() { return this.text.position.x; }

    /** Report the Y position of the text */
    getYPosition() { return this.text.position.y; }

    /** 
     * Set the string to display
     * 
     * @param text The string of text to display
     */
    setText(text: string) { this.text.text = text; }

    /**
     * Set the position of the text
     * 
     * @param x The X coordinate of the text
     * @param y The Y coordinate of the text
     */
    setPosition(x: number, y: number) {
        this.text.position.x = x;
        this.text.position.y = y;
    }

    /** Get the width and height of this text */
    getBounds(): XY {
        let bounds = this.text.getBounds();
        return new XY(bounds.width, bounds.height);
    }

    /** Get the part of the Text that can be passed to the renderer */
    getRenderObject() { return this.text; }
}
