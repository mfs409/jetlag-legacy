import { JetLagConfig } from "../JetLagConfig"
import { JetLagManager } from "../JetLagManager"
import { BaseActor } from "../renderables/BaseActor"
import { BodyStyle } from "../renderables/BaseActor"
import * as PIXI from 'pixi.js';

/**
 * Renderer maintains a set of images, and can display them, along with text,
 * onto the screen.
 * 
 * Renderer is responsible for managing the render loop, which effectively
 * controls the whole game.  However, due to asynchronous loading, initiating
 * the render loop is tricky.  First, we construct a renderer.  Later, we call
 * the loadAssets() function to get all the assets loaded.  When loading is
 * done, loadAssets will call its parameter, which can then initialize a world
 * and start the render loop.
 * 
 * The operation of the render loop is also inverted.  To render, first call
 * initFrame().  Then use the add* methods to add things to the frame.  Finally,
 * call showFrame() and the frame will be rendered.
 */
export class Renderer {
    /** The renderer object is responsible for drawing onto a canvas */
    private renderer: PIXI.Application;

    /**
     * mainContainer holds all of the sprites that will be rendered as part of the
     * currently in-progress render.
     */
    mainContainer: PIXI.Container;

    /**
     * debugContainer holds outlines for sprites that will be rendered during the
     * currently in-progress render, but only if we are in debug mode.
     */
    private debugContainer: PIXI.Container = null;

    /**
     * Initialize the renderer and prepare to load all graphics assets.  Note
     * that the assets won't load until loadAssets() is called.
     * 
     * @param cfg The game-wide configuration object
     * @param domId The ID of the DOM element into which we will render
     */
    constructor(cfg: JetLagConfig, domId: string) {
        // Create a rendering context and attach it to the appropriate place in
        // the DOM
        PIXI.utils.skipHello();
        this.renderer = new PIXI.Application({ width: cfg.screenWidth, height: cfg.screenHeight, antialias: true });
        document.getElementById(domId).appendChild(this.renderer.view);

        // Set up the containers we will use when rendering
        this.mainContainer = new PIXI.Container();
        if (cfg.debugMode) {
            this.debugContainer = new PIXI.Container();
        }

        // Set the names of the graphics assets to load, but don't load them
        // yet.
        PIXI.loader.reset();
        for (let imgName of cfg.imageNames) {
            // PIXI has a built-in image loader
            PIXI.loader.add(imgName, cfg.resourcePrefix + imgName);
        }
    }

    /**
     * Load all of the graphics assets, then call the callback
     * 
     * @param callback The code to run once all assets are loaded
     */
    loadAssets(callback: () => void) {
        PIXI.loader.load(callback);
    }

    /**
     * Start the render loop.  Each iteration of the loop will call the
     * top-level game manager's render function.
     * 
     * @param manager The top-level game manager
     */
    public startRenderLoop(manager: JetLagManager) {
        this.renderer.ticker.add(() => {
            manager.render(this.renderer.ticker.elapsedMS)
        });
    }

    /**
     * Initialize the next frame to be rendered
     */
    public initFrame() {
        this.renderer.stage.removeChildren();
        this.mainContainer.removeChildren();
        if (this.debugContainer != null)
            this.debugContainer.removeChildren();
    }

    /**
     * Display the next frame on the screen
     */
    public showFrame() {
        if (this.debugContainer != null)
            this.mainContainer.addChild(this.debugContainer);
        this.renderer.stage.addChild(this.mainContainer);
    }

    /**
     * Set the background color of the next frame
     * 
     * @param color The color to use, as a hex value (e.g., 0xaaffbb)
     */
    public setFrameColor(color: number) {
        (this.renderer.renderer as any).backgroundColor = color;
    }

    /**
     * Add an actor (physics+image) to the next frame
     * 
     * @param actor The actor to (possibly) display
     * @param camera The camera that determines which actors to show, and where
     */
    public addActorToFrame(actor: BaseActor, camera: Camera) {
        // If the actor isn't on screen, skip it
        if (!camera.inBounds(actor.getXPosition(), actor.getYPosition(), actor.getWidth(), actor.getHeight()))
            return;
        // Compute the dimensions of the actor, in pixels
        let s = camera.getScale();
        let x = s * (actor.getXPosition() - camera.getOffsetX());
        let y = s * (actor.getYPosition() - camera.getOffsetY());
        let w = s * (actor.getWidth());
        let h = s * (actor.getHeight());
        let r = actor.getRotation();
        // Configure the sprite (image) and put it on screen
        let sprite = actor.mAnimator.getCurrent();
        sprite.sprite.anchor.set(.5, .5);
        sprite.sprite.position.set(x + w / 2, y + h / 2);
        sprite.sprite.width = w;
        sprite.sprite.height = h;
        sprite.sprite.rotation = r;
        this.mainContainer.addChild(sprite.sprite);
        // Debug rendering is the hard part!
        if (this.debugContainer != null) {
            if (actor.bodyStyle === BodyStyle.RECTANGLE) {
                // For rectangles, just use the PIXI rectangle
                let rect = actor.dbg;
                rect.clear();
                rect.lineStyle(1, 0x00FF00);
                rect.drawRect(x, y, w, h);
                // rotation
                rect.position.set(x + w / 2, y + h / 2);
                rect.pivot.set(x + w / 2, y + h / 2);
                rect.rotation = r;
                this.debugContainer.addChild(rect);
            }
            else if (actor.bodyStyle === BodyStyle.CIRCLE) {
                // For circles, use the PIXI Circle
                let circ = actor.dbg;
                circ.clear();
                let radius = Math.max(w, h) / 2;
                circ.lineStyle(1, 0x0000FF);
                circ.drawCircle(x + w / 2, y + w / 2, radius);
                this.debugContainer.addChild(circ);
                // Also draw a radius, to indicate rotation
                let line = actor.dbg2;
                line.clear();
                line.position.set(x + w / 2, y + h / 2);
                let xx = radius * Math.cos(r);
                let yy = radius * Math.sin(r);
                line.lineStyle(1, 0x0000FF).moveTo(0, 0).lineTo(xx, yy);
                this.debugContainer.addChild(line);
            }
            else if (actor.bodyStyle === BodyStyle.POLYGON) {
                // For polygons, we need to translate the points (they are 
                // 0-relative in Box2d)
                let poly = actor.dbg;
                poly.clear;
                poly.lineStyle(1, 0xFFFF00);
                let pts: number[] = [];
                for (let vert of actor.verts) {
                    pts.push(s * vert.x + x + w / 2);
                    pts.push(s * vert.y + y + h / 2);
                }
                // NB: must repeat start point of polygon in PIXI
                pts.push(s * actor.verts[0].x + x + w / 2);
                pts.push(s * actor.verts[0].y + y + h / 2);
                poly.drawPolygon(pts);
                // rotation
                poly.position.set(x + w / 2, y + h / 2);
                poly.pivot.set(x + w / 2, y + h / 2);
                poly.rotation = r;
                this.debugContainer.addChild(poly);
            }
            else {
                console.log("Unknown BodyStyle");
            }
        }
    }

    /**
     * Add a Picture (just image) to the next frame
     * 
     * @param sprite The image to (possibly) display
     * @param camera The camera that determines which pictures to show, and where
     */
    public addPictureToFrame(sprite: JLSprite, camera: Camera) {
        // If the picture isn't on screen, skip it
        if (!camera.inBounds(sprite.sprite.position.x, sprite.sprite.position.y, sprite.sprite.width, sprite.sprite.height))
            return;
        sprite.sprite.position.x -= camera.getOffsetX();
        sprite.sprite.position.y -= camera.getOffsetY();
        let scale = camera.getScale();
        sprite.sprite.position.x *= scale;
        sprite.sprite.position.y *= scale;
        sprite.sprite.width *= scale;
        sprite.sprite.height *= scale;
        this.mainContainer.addChild(sprite.sprite);
        // Debug rendering: draw a box around the image
        if (this.debugContainer != null) {
            let rect = sprite.dbg;
            rect.clear();
            rect.lineStyle(1, 0xFF0000);
            rect.drawRect(sprite.sprite.x + 1, sprite.sprite.y, sprite.sprite.width - 1, sprite.sprite.height - 1);
            this.debugContainer.addChild(rect);
        }
    }

    /**
     * Add text to the next frame
     * 
     * @param text The text object to display
     * @param camera The camera that determines which text to show, and where
     * @param center Should we center the text at its x/y coordinate?
     */
    public addTextToFrame(text: JLText, camera: Camera, center: boolean) {
        text.text.position.x -= camera.getOffsetX();
        text.text.position.y -= camera.getOffsetY();
        let scale = camera.getScale();
        text.text.position.x *= scale;
        text.text.position.y *= scale;
        let bounds = text.text.getBounds();
        if (center) {
            let w = bounds.width;
            let h = bounds.height;
            text.text.position.x -= w / 2;
            text.text.position.y -= h / 2;
        }
        this.mainContainer.addChild(text.text);
    }

    /**
     * Get an image that has been loaded by the renderer, or a blank image if
     * the provided filename is invalid.
     * 
     * @param imgName The name of the image to load
     */
    public getSprite(imgName: string): JLSprite {
        if (!PIXI.loader.resources[imgName]) {
            console.log("Unable to find graphics asset " + imgName);
            return new JLSprite("", new PIXI.Sprite());
        }
        return new JLSprite(imgName, new PIXI.Sprite(PIXI.loader.resources[imgName].texture));
    }

    /**
     * Return the current Frames-Per-Second of the renderer.  This is useful
     * when debugging
     */
    public getFPS(): number {
        return this.renderer.ticker.FPS;
    }

    /**
     * Create some text
     */
    public makeText(txt: string, opts: any) {
        return new JLText(new PIXI.Text(txt, opts));
    }
}

/**
 * JLSprite is a thin wrapper around PIXI.Sprite, so that we don't have accesses
 * to PIXI outside of this file.
 */
export class JLSprite {
    constructor(public imgName: string, public sprite: PIXI.Sprite) { }

    /** For debug rendering */
    dbg = new PIXI.Graphics();
}

/**
 * JLText is a thin wrapper around PIXI.Text
 */
export class JLText {
    constructor(public text: PIXI.Text) { }
}

/**
 * The Camera is used to determine /how much/ of a world to render.  The Camera
 * has a minimum X and Y coordinate, and a maximum X and Y coordinate.  It also
 * has a zoom factor, and a current center point.  
 * 
 * The zoom factor and center point give a rectangular region.  The min and max
 * coordinates give another rectangular region.  If the first region is not
 * fully within the second, we shift it so that it is within, and then we only
 * show those things that are within it.
 * 
 * Note that the camera center can be changed dynamically, in response to
 * changes in the world to which the camera is attached.
 */
export class Camera {
    /** The minimum x/y coordinates that can be shown (top left corner) */
    private min = { x: 0, y: 0 };

    /** The maximum x/y coordinates that can be shown (bottom right corner) */
    private max = { x: 0, y: 0 };

    /** The current center point of the camera */
    private center = { x: 0, y: 0 };

    /** The effective (scaled) pixel/meter ratio */
    private ratio: number;

    /** The dimensions of the screen, in pixels */
    private screenDims = { w: 0, h: 0 }

    /** The visible dimensions of the screen, in meters */
    private scaledVisibleRegionDims = { w: 0, h: 0 };

    /**
     * Create a Camera by setting its bounds and its current pixel/meter ratio
     * 
     * @param maxX The maximum X value (in meters)
     * @param maxY The maximum Y value (in meters)
     * @param ratio The initial pixel/meter ratio
     * @param config The game-wide configuration object, used to get screen dimensions
     */
    constructor(maxX: number, maxY: number, ratio: number, config: JetLagConfig) {
        this.max.x = maxX;
        this.max.y = maxY;
        this.center.x = (this.max.x - this.min.x) / 2;
        this.center.y = (this.max.y - this.min.y) / 2;
        this.screenDims.w = config.screenWidth;
        this.screenDims.h = config.screenHeight;
        this.setScale(ratio);
    }

    /**
     * Get the pixel/meter ratio of the camera.  Increasing the ratio would 
     * equate to zooming in.  Decreasing the ratio would equate to zooming out.
     */
    public getScale(): number {
        return this.ratio;
    }

    /**
     * Set the pixel/meter ratio of the camera.
     * 
     * @param ratio The new pixel/meter ratio
     */
    public setScale(ratio: number) {
        this.ratio = ratio;
        // Update our precomputed visible screen dimensions
        this.scaledVisibleRegionDims.w = this.screenDims.w / ratio;
        this.scaledVisibleRegionDims.h = this.screenDims.h / ratio;
        // Warn if the new scale is too small to fill the screen
        this.checkDims();
    }

    /**
     * Update a camera's bounds by providing a new maximum (X, Y) coordinate
     * 
     * @param maxX The new maximum X value (in meters)
     * @param maxY The new maximum Y value (in meters)
     */
    public setBounds(maxX: number, maxY: number) {
        this.max.x = maxX;
        this.max.y = maxY;
        // Warn if the new bounds are too small to fill the screen
        this.checkDims();
    }

    /**
     * Set the center point on which the camera should focus
     * 
     * @param centerX The X coordinate of the center point (in meters)
     * @param centerY The Y coordinate of the center point (in meters)
     */
    public setCenter(centerX: number, centerY: number) {
        // Make sure that X and Y aren't so close to an edge as to lead to
        // out-of-bounds stuff being rendered (modulo warnings from checkDims())
        let top = centerY - this.scaledVisibleRegionDims.h / 2;
        let bottom = centerY + this.scaledVisibleRegionDims.h / 2;
        let left = centerX - this.scaledVisibleRegionDims.w / 2;
        let right = centerX + this.scaledVisibleRegionDims.w / 2;

        if (top >= this.min.y && bottom <= this.max.y)
            this.center.y = centerY;
        if (left >= this.min.x && right <= this.max.x)
            this.center.x = centerX;
    }

    /**
     * Determine whether a sprite is within the region being shown by the camera,
     * so that we can reduce the overhead on the renderer.
     * 
     * @param x The X coordinate of the top left corner of the sprite, in meters
     * @param y The Y coordinate of the top left corner of the sprite, in meters
     * @param w The width of the sprite, in meters
     * @param h The height of the sprite, in meters
     */
    public inBounds(x: number, y: number, w: number, h: number): boolean {
        let leftOk = (x + w) >= this.center.x - this.scaledVisibleRegionDims.w / 2;
        let rightOk = x <= this.center.x + this.scaledVisibleRegionDims.w / 2;
        let topOk = (y + h) >= this.center.y - this.scaledVisibleRegionDims.h / 2;
        let bottomOk = y <= this.center.y + this.scaledVisibleRegionDims.h / 2;
        return leftOk && rightOk && topOk && bottomOk;
    }

    /**
     * Return the X coordinate of the left of the camera viewport
     */
    public getOffsetX() {
        return this.center.x - this.scaledVisibleRegionDims.w / 2;
    }

    /**
     * Return the Y coordinate of the top of the camera viewport
     */
    public getOffsetY() {
        return this.center.y - this.scaledVisibleRegionDims.h / 2;
    }

    /**
     * Given screen coordinates, convert them to meter coordinates in the world
     * 
     * @param screenX The X coordinate, in pixels
     * @param screenY The Y coordinate, in pixels
     */
    public screenToMeters(screenX: number, screenY: number) {
        let res = { x: 0, y: 0 };
        res.x = screenX / this.ratio + this.getOffsetX();
        res.y = screenY / this.ratio + this.getOffsetY();
        return res;
    }

    /** 
     * Convert meter coordinates to screen coordinates
     */
    public metersToScreen(worldX: number, worldY: number) {
        let res = { x: 0, y: 0 };
        res.x = (worldX - this.getOffsetX()) * this.ratio;
        res.y = (worldY - this.getOffsetY()) * this.ratio;
        return res;
    }

    /**
     * Check to make sure that the current screen bounds, scaled by the current
     * pixel/meter ratio, are at least as big as the screen dimensions.
     */
    private checkDims() {
        // w and h are the visible world's width and height in pixels
        let w = this.ratio * (this.max.x - this.min.x);
        let h = this.ratio * (this.max.y - this.min.y);

        if (w < this.screenDims.w)
            console.log("Warning, the visible game area is less than the screen width");
        if (h < this.screenDims.h)
            console.log("Warning, the visible game area is less than the screen height");
    }
}