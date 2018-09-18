import { Renderable } from "./Renderable"
import { JetLagManager } from "../JetLagManager"
import { JLSprite } from "../device/Renderer"
import { Renderer, Camera } from "../device/Renderer"

/**
 * Picture is a lightweight alternative to BaseActor and its descendents.  Its
 * purpose is exclusively for the situations in which we need to draw something
 * to the screen at a fixed location, and we never intend to move, resize, or
 * rotate it.
 */
export class Picture implements Renderable {
    /**
     * visible, through its getter and setter, allows the programmer to show and
     * hide a Picture in response to game events.
     */
    private visible: boolean = true;

    /**
     * The X,Y position of the top left corner, in meters, and the width and
     * height, also in meters;
     */
    private dims = { x: -1, y: -1, w: -1, h: -1 };

    /**
     * The sprite to display on screen when the Picture is visible
     */
    sprite: JLSprite = null;

    /**
     * Place an image at a fixed position in the world
     * 
     * @param x The X coordinate of the top left corner, in meters
     * @param y The Y coordinate of the top left corner, in meters
     * @param w The width of the image, in meters
     * @param h The height of the image, in meters
     * @param imgName The name of the image to display
     */
    constructor(x: number, y: number, w: number, h: number, imgName: string, manager: JetLagManager) {
        this.dims.x = x;
        this.dims.y = y;
        this.dims.w = w;
        this.dims.h = h;
        this.sprite = manager.device.renderer.getSprite(imgName);
    }

    /**
     * Show or hide this Picture
     *
     * @param vis The new state (true for showing, false for hidden)
     */
    public setVisible(vis: boolean) { this.visible = vis; }

    /**
     * 
     * @param renderer The renderer to use when drawing this picture
     * @param camera The camera that defines the bounds for the Scene where this
     *               image should be drawn
     */
    public render(renderer: Renderer, camera: Camera): void {
        if (!this.visible || this.sprite === null)
            return;
        // update world position, because the renderer is free to scale and move
        // the sprite on every render...
        this.sprite.sprite.position.x = this.dims.x;
        this.sprite.sprite.position.y = this.dims.y;
        this.sprite.sprite.height = this.dims.h;
        this.sprite.sprite.width = this.dims.w;
        renderer.addPictureToFrame(this.sprite, camera);
    }
}