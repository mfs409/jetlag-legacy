import { JetLagSprite } from "../misc/JetLagDevice"

/**
 * JLSprite is a thin wrapper around PIXI.Sprite, so that we don't have accesses
 * to PIXI outside of this file.
 */
export class HtmlSprite implements JetLagSprite {
    private debug: PIXI.Graphics;
    constructor(private imgName: string, private sprite: PIXI.Sprite) { 
        this.debug = new PIXI.Graphics();
    }

    getImgName() { return this.imgName; }

    setPosition(x: number, y: number) {
        this.sprite.position.x = x;
        this.sprite.position.y = y;
    }
    getXPosition() { return this.sprite.position.x; }
    getYPosition() { return this.sprite.position.y }
    getWidth() { return this.sprite.width; }
    setWidth(w: number) { this.sprite.width = w; }
    getHeight() { return this.sprite.height; }
    setHeight(h: number) { this.sprite.height = h; }
    setRotation(r: number) { this.sprite.rotation = r; }
    setAnchoredPosition(ax: number, ay: number, x: number, y: number) {
        this.sprite.anchor.set(ax, ay);
        this.sprite.position.set(x, y);
    }
    getRenderObject() { return this.sprite };
    getDebugShape() { return this.debug; }
}
