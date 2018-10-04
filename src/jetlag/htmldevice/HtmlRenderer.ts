import { JetLagConfig } from "../JetLagConfig"
import { JetLagManager } from "../JetLagManager"
import { BaseActor } from "../renderables/BaseActor"
import { BodyStyle } from "../renderables/BaseActor"
import { Camera } from "../misc/Camera"
import { Logger } from "../misc/Logger";
import { JetLagRenderer, JetLagText, JetLagSprite } from "../misc/JetLagDevice"
import { HtmlText } from "./HtmlText"
import { HtmlSprite } from "./HtmlSprite"
import { HtmlDebugSprite } from "./HtmlDebugSprite"
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
export class HtmlRenderer implements JetLagRenderer {
    /** The renderer object is responsible for drawing onto a canvas */
    private renderer: PIXI.Application;

    /**
     * mainContainer holds all of the sprites that will be rendered as part of
     * the currently in-progress render.
     */
    mainContainer: PIXI.Container;

    /**
     * debugContainer holds outlines for sprites that will be rendered during
     * the currently in-progress render, but only if we are in debug mode.
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

        // Set the names of the graphics assets, but don't load them yet.
        PIXI.loader.reset();
        for (let imgName of cfg.imageNames) {
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

    /** Initialize the next frame to be rendered */
    public initFrame() {
        this.renderer.stage.removeChildren();
        this.mainContainer.removeChildren();
        if (this.debugContainer != null)
            this.debugContainer.removeChildren();
    }

    /** Display the next frame on the screen */
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
        sprite.setAnchoredPosition(.5, .5, x + w / 2, y + h / 2);
        sprite.setWidth(w);
        sprite.setHeight(h);
        sprite.setRotation(r);
        this.mainContainer.addChild(sprite.getRenderObject());
        // Debug rendering is the hard part!
        if (this.debugContainer != null) {
            if (actor.bodyStyle === BodyStyle.RECTANGLE) {
                // For rectangles, just use the PIXI rectangle
                let rect = actor.debug.getShape() as PIXI.Graphics;
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
                let circ = actor.debug.getShape() as PIXI.Graphics;
                circ.clear();
                let radius = Math.max(w, h) / 2;
                circ.lineStyle(1, 0x0000FF);
                circ.drawCircle(x + w / 2, y + w / 2, radius);
                this.debugContainer.addChild(circ);
                // Also draw a radius, to indicate rotation
                let line = actor.debug.getLine() as PIXI.Graphics;
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
                let poly = actor.debug.getShape() as PIXI.Graphics;
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
                Logger.urgent("Unknown BodyStyle while attempting to render actor");
            }
        }
    }

    /**
     * Add a Picture (just image) to the next frame
     * 
     * @param sprite The image to (possibly) display
     * @param camera The camera that determines which pictures to show, and where
     */
    public addPictureToFrame(sprite: JetLagSprite, camera: Camera) {
        // If the picture isn't on screen, skip it
        if (!camera.inBounds(sprite.getXPosition(), sprite.getYPosition(), sprite.getWidth(), sprite.getHeight()))
            return;
        let x = sprite.getXPosition();
        let y = sprite.getYPosition();
        x -= camera.getOffsetX();
        y -= camera.getOffsetY();
        let scale = camera.getScale();
        x *= scale;
        y *= scale;
        sprite.setPosition(x, y);
        sprite.setWidth(scale * sprite.getWidth());
        sprite.setHeight(scale * sprite.getHeight());
        this.mainContainer.addChild(sprite.getRenderObject());
        // Debug rendering: draw a box around the image
        if (this.debugContainer != null) {
            let rect = sprite.getDebugShape() as PIXI.Graphics;
            rect.clear();
            rect.lineStyle(1, 0xFF0000);
            rect.drawRect(x + 1, y, sprite.getWidth() - 1, sprite.getHeight() - 1);
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
    public addTextToFrame(text: JetLagText, camera: Camera, center: boolean) {
        let x = text.getXPosition();
        let y = text.getYPosition();
        x -= camera.getOffsetX();
        y -= camera.getOffsetY();
        let scale = camera.getScale();
        x *= scale;
        y *= scale;
        let bounds = text.getBounds();
        if (center) {
            let w = bounds.x;
            let h = bounds.y;
            x -= w / 2;
            y -= h / 2;
        }
        text.setPosition(x, y);
        this.mainContainer.addChild(text.getRenderObject());
    }

    /**
     * Get an image that has been loaded by the renderer, or a blank image if
     * the provided filename is invalid.
     * 
     * @param imgName The name of the image to load
     */
    public getSprite(imgName: string) {
        if (!PIXI.loader.resources[imgName]) {
            Logger.info("Unable to find graphics asset '" + imgName + "'");
            return new HtmlSprite("", new PIXI.Sprite());
        }
        return new HtmlSprite(imgName, new PIXI.Sprite(PIXI.loader.resources[imgName].texture));
    }

    /**
     * Return the current Frames-Per-Second of the renderer.  This is useful
     * when debugging
     */
    public getFPS(): number { return this.renderer.ticker.FPS; }

    /**
     * Create some text
     */
    public makeText(txt: string, opts: any) {
        return new HtmlText(new PIXI.Text(txt, opts));
    }

    makeDebugContext() { return new HtmlDebugSprite(); }

}


