import { Camera } from "../internal/support/Camera"
import { JetLagText, JetLagRenderer, Renderable } from "../internal/support/Interfaces";
import { b2Vec2 } from "@box2d/core";

/**
 * JetLag's Text object provides a way to generate text and put it onto the
 * screen.  The text that is displayed is controlled by a callback, so that it
 * can change over time.
 */
export class Text implements Renderable {
    /**
     * visible, through its getter and setter, allow the programmer to show and
     * hide RenderableText in response to game events.
     */
    private visible: boolean = true;

    /** The low-level text object that we pass to the Renderer */
    private text: JetLagText;

    /** coordinate of the text */
    private readonly coord = new b2Vec2(0, 0);

    /** Should we center at coord (true) or is it top-left? */
    private readonly center: boolean;

    /** The code that produces the string of text to display */
    private readonly producer: () => string;

    /** 
     * Build some text that can be rendered
     * 
     * @param renderer   The renderer for the game
     * @param fontFamily The font to use
     * @param fontSize   The font size
     * @param fontColor  The color, as an HTML hex code
     * @param x          The x coordinate of the top left (or center)
     * @param y          The y coordinate of the top left (or center)
     * @param center     True to center instead of placing at top right (x,y)
     * @param producer   The code that produces text
     */
    constructor(renderer: JetLagRenderer, fontFamily: string, fontSize: number, fontColor: string, x: number, y: number, center: boolean, producer: () => string) {
        this.coord.Set(x, y);
        this.producer = producer;
        this.center = center;
        this.text = renderer.makeText("", { fontFamily: fontFamily, fontSize: fontSize, fill: fontColor });
    }

    /**
     * Show or hide this Text
     *
     * @param vis The new state (true for showing, false for hidden)
     */
    public setVisible(vis: boolean) { this.visible = vis; }

    /**
     * Render the text
     *
     * @param renderer The renderer to use when drawing this picture
     * @param camera   The camera that defines the bounds for the Scene where
     *                 this image should be drawn
     */
    public render(renderer: JetLagRenderer, camera: Camera) {
        if (!this.visible)
            return;
        // Set the world position and the text, then let the renderer decide
        // where to put it...
        this.text.setText(this.producer());
        this.text.setPosition(this.coord.x, this.coord.y);
        renderer.addTextToFrame(this.text, camera, this.center);
    }
}