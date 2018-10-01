import { Renderer } from "../device/Renderer"
import { JetLagText } from "../device/Renderer"
import { JetLagManager } from "../JetLagManager"
import { Renderable } from "./Renderable"
import { Camera } from "../misc/Camera"

/**
 * RenderableText provides a way to generate text and put it onto the screen.
 */
export class RenderableText implements Renderable {
    /**
     * visible, through its getter and setter, allow the programmer to show and
     * hide RenderableText in response to game events.
     */
    private visible: boolean = true;

    /** The text object that we pass to the Renderer */
    private mText: JetLagText;

    /** X coordinate of the text */
    private readonly x: number;

    /** Y coordinate of the text */
    private readonly y: number;

    /** The thing that produces the text */
    private readonly producer: () => string;

    /** Should we center at (x,y) */
    private readonly center: boolean;

    /** 
     * Build some text that can be rendered
     * 
     * @param manager The JetLag manager
     * @param fontFamily The font to use
     * @param fontSize  The font size
     * @param fontColor The color, as an HTML hex code
     * @param x The x coordinate of the top left (or center)
     * @param y The y coordinate of the top left (or center)
     * @param center True to center instead of placing at top right (x,y)
     * @param producer The thing that produces text
     */
    constructor(manager: JetLagManager, fontFamily: string, fontSize: number, fontColor: string, x: number, y: number, center: boolean, producer: () => string) {
        this.x = x;
        this.y = y;
        this.producer = producer;
        this.center = center;
        this.mText = manager.device.renderer.makeText("", { fontFamily: fontFamily, fontSize: fontSize, fill: fontColor });
    }

    /**
     * Show or hide this RenderableText
     *
     * @param vis The new state (true for showing, false for hidden)
     */
    public setVisible(vis: boolean) { this.visible = vis; }

    /**
     * Render the text
     * 
     * @param renderer The renderer to use when drawing this picture
     * @param camera The camera that defines the bounds for the Scene where this
     *               image should be drawn
     */
    public render(renderer: Renderer, camera: Camera): void {
        if (!this.visible)
            return;
        // Set the world position and the text, then let the renderer decide where to put it...
        this.mText.text.text = this.producer();
        this.mText.text.position.x = this.x;
        this.mText.text.position.y = this.y;
        renderer.addTextToFrame(this.mText, camera, this.center);
    }
}