import { Graphics, Sprite as PixiSprite } from "pixi.js";
import { JetLagSprite } from "../support/Interfaces"

/** A sprite any picture that can be drawn to the screen */
export class HtmlSprite implements JetLagSprite {
    /** A debug context, for when we need to print shape outlines */
    private debug: Graphics;

    /**
     * Construct a sprite
     * 
     * @param imgName the name of the image file to load
     * @param sprite The PIXI sprite to use
     */
    constructor(private imgName: string, private sprite: PixiSprite) {
        this.debug = new Graphics();
    }

    /** Return the image that is used for this sprite */
    getImgName() { return this.imgName; }

    /**
     * Set the position for this sprite
     * 
     * @param x The x coordinate
     * @param y The y coordinate
     */
    setPosition(x: number, y: number) {
        this.sprite.position.x = x;
        this.sprite.position.y = y;
    }

    /** Get the x coordinate of the sprite */
    getXPosition() { return this.sprite.position.x; }

    /** Get the y coordinate of the sprite */
    getYPosition() { return this.sprite.position.y }

    /** Get the width of the sprite */
    getWidth() { return this.sprite.width; }

    /** Get the height of the sprite */
    getHeight() { return this.sprite.height; }

    /**
     * Set the width of the sprite
     * 
     * @param w The new width
     */
    setWidth(w: number) { this.sprite.width = w; }

    /**
     * Set the height of the sprite
     * 
     * @param h The new height
     */
    setHeight(h: number) { this.sprite.height = h; }

    /**
     * Set the rotation of the sprite
     * 
     * @param r The new rotation
     */
    setRotation(r: number) { this.sprite.rotation = r; }

    /**
     * Set the position of the sprite relative to some X/Y anchor point
     * 
     * @param ax The X anchor
     * @param ay The Y anchor
     * @param x The X position relative to the anchor
     * @param y The Y position relative to the anchor
     */
    setAnchoredPosition(ax: number, ay: number, x: number, y: number) {
        this.sprite.anchor.set(ax, ay);
        this.sprite.position.set(x, y);
    }
    getRenderObject() { return this.sprite };
    getDebugShape() { return this.debug; }
}
