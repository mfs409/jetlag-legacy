import { JetLagText } from "../support/Interfaces"
import { XY } from "../support/XY";

/**
 * HtmlText provides JetLagText functionality via the PIXI.text type.
 */
export class HtmlText implements JetLagText {
    constructor(private text: PIXI.Text) { }
    getXPosition() { return this.text.position.x; }
    getYPosition() { return this.text.position.y; }
    setText(text: string) { this.text.text = text; }
    setPosition(x: number, y: number) {
        this.text.position.x = x;
        this.text.position.y = y;
    }
    getBounds(): XY {
        let bounds = this.text.getBounds();
        return new XY(bounds.width, bounds.height);
    }
    getRenderObject() { return this.text; }
}
