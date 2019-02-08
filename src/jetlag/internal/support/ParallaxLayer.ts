import { JetLagSprite, JetLagDevice, JetLagRenderer } from "./Interfaces";
import { JetLagConfig } from "../../support/JetLagConfig";
import { Camera } from "./Camera";
import { b2Vec2 } from "box2d.ts";

/**
 * A ParallaxLayer is a layer that seems to scroll and repeat at a velocity that
 * gives a sense of depth.
 */
export class ParallaxLayer {
    /** How fast should this layer scroll? */
    private scrollSpeed: number;

    /** Is it a horizontal or vertical scroll? */
    private isHoriz: boolean;

    /** Is this an "auto" scroll, or is it position-based */
    private isAuto: boolean;

    /** The images to display */
    private images: JetLagSprite[] = [];

    /** coords of last render */
    private last = new b2Vec2(0, 0);

    /** Width of the image to display */
    private width: number;

    /** Height of the image to display */
    private height: number;

    /** Last camera position */
    private lastCam = new b2Vec2(0, 0);

    /**
     * Construct a ParallaxLayer that can be rendered correctly
     *
     * @param x       The X of the top left corner of the leftmost instance of
     *                the image
     * @param y       The Y of the top left corner of the topmost instance of
     *                the image
     * @param width   The width of the image being used as a background layer
     * @param height  The height of the image being used as a background layer
     * @param speed   Speed at which it scrolls.  Important values are 0, 1, and
     *                between.  Differs for auto and non-auto.
     * @param isX     True for X scrolling, false for Y scrolling
     * @param isAuto  True if this should scroll regardless of camera
     * @param imgName The name of the image file to use as the background
     * @param config  The game-wide configuration
     * @param device  The device on which we're running, so that we can get
     *                images from the renderer
     */
    constructor(x: number, y: number, width: number, height: number, speed: number, isX: boolean, isAuto: boolean, imgName: string, config: JetLagConfig, device: JetLagDevice) {
        this.scrollSpeed = speed;
        this.isHoriz = isX;
        this.isAuto = isAuto;
        this.width = width;
        this.height = height;
        this.last.Set(x, y);
        // figure out how many sprites we need to properly tile the image
        let num = 1;
        if (this.isHoriz) {
            let screenWidthMeters = config.screenWidth / config.pixelMeterRatio;
            num += Math.ceil(screenWidthMeters / this.width);
        }
        else {
            let screenHeightMeters = config.screenHeight / config.pixelMeterRatio;
            num += Math.ceil(screenHeightMeters / this.height);
        }
        for (let i = 0; i < num; ++i)
            this.images.push(device.getRenderer().getSprite(imgName));
    }

    /**
     * Render all of the layers of this parallax scene
     *
     * @param renderer    The renderer
     * @param worldCamera The camera for the world that these layers accompany
     * @param elapsed     The time since the last render
     * @param config  The game-wide configuration
     */
    public render(renderer: JetLagRenderer, worldCamera: Camera, elapsed: number, config: JetLagConfig) {
        if (this.isAuto) {
            this.renderAuto(renderer, worldCamera, elapsed, config);
        } else {
            this.renderRelative(renderer, worldCamera, config);
        }
    }

    /**
     * Draw a layer that moves in a fixed velocity in the X dimension
     *
     * @param renderer The renderer
     * @param worldCamera The camera for the world that these layers accompany
     * @param elapsed  The elapsed time since we last drew this layer
     * @param config   The game-wide configuration
     */
    private renderAuto(renderer: JetLagRenderer, worldCamera: Camera, elapsed: number, config: JetLagConfig) {
        // Determine the position of a reference tile of the image
        if (this.isHoriz) {
            this.last.x += this.scrollSpeed * elapsed;
        }
        else {
            this.last.y += this.scrollSpeed * elapsed;
        }
        this.normalizeAndRender(renderer, worldCamera, config);
    }

    /**
     * This is how we actually figure out where to draw the background
     * 
     * @param renderer    The renderer
     * @param worldCamera The camera for the world that these layers accompany
     * @param config      The game-wide configuration
     */
    private normalizeAndRender(renderer: JetLagRenderer, worldCamera: Camera, config: JetLagConfig) {
        let x = worldCamera.getOffsetX(); // left of viewport
        let y = worldCamera.getOffsetY(); // top of viewport
        let camW = config.screenWidth / config.pixelMeterRatio;
        let camH = config.screenHeight / config.pixelMeterRatio;
        // Normalize the reference tile
        if (this.isHoriz) {
            while (this.last.x > x + camW)
                this.last.x -= this.width;
            while (this.last.x + this.width < x)
                this.last.x += this.width;
            while (this.last.x > x)
                this.last.x -= this.width;
        }
        else {
            while (this.last.y > y + camH)
                this.last.y -= this.height;
            while (this.last.y + this.height < y)
                this.last.y += this.height;
            while (this.last.y > y)
                this.last.y -= this.height;
        }
        // save camera for next render
        this.lastCam.x = x;
        this.lastCam.y = y;
        this.renderVisibleTiles(renderer, worldCamera, config);
    }

    /**
     * Draw a layer that moves in relation to the camera center point
     * 
     * NB: the efficiency of this code derives from the assumption that the
     *     camera does not move suddenly
     *
     * @param renderer    The renderer
     * @param worldCamera The camera for the world that these layers accompany
     * @param config      The game-wide configuration
     */
    private renderRelative(renderer: JetLagRenderer, worldCamera: Camera, config: JetLagConfig) {
        // Determine the change in camera
        let x = worldCamera.getOffsetX(); // left of viewport
        let y = worldCamera.getOffsetY(); // top of viewport
        let dx = x - this.lastCam.x;
        let dy = y - this.lastCam.y;
        // Determine the relative change to the reference tile
        if (this.isHoriz) {
            this.last.x = this.last.x + dx * this.scrollSpeed;
        }
        else {
            this.last.y = this.last.y + dy * this.scrollSpeed;
        }
        this.normalizeAndRender(renderer, worldCamera, config);
    }

    /**
     * Given the x,y coordinates of a reference tile, render the tiles of a
     * layer that are visible
     *
     * @param renderer    The renderer
     * @param worldCamera The camera for the world that these layers accompany
     * @param config      The game-wide configuration
     */
    private renderVisibleTiles(srenderer: JetLagRenderer, worldCamera: Camera, config: JetLagConfig) {
        let x = worldCamera.getOffsetX(); // left of viewport
        let y = worldCamera.getOffsetY(); // top of viewport
        let camW = config.screenWidth / config.pixelMeterRatio;
        let camH = config.screenHeight / config.pixelMeterRatio;
        if (this.isHoriz) {
            let i = 0;
            let plx = this.last.x;
            while (plx < x + camW) {
                this.images[i].setPosition(plx, this.last.y);
                this.images[i].setHeight(this.height);
                this.images[i].setWidth(this.width);
                srenderer.addPictureToFrame(this.images[i], worldCamera);
                plx += this.width;
                i++;
            }
        }
        else {
            let i = 0;
            let ply = this.last.y;
            while (ply < y + camH) {
                this.images[i].setPosition(this.last.x, ply);
                this.images[i].setHeight(this.height);
                this.images[i].setWidth(this.width);
                srenderer.addPictureToFrame(this.images[i], worldCamera);
                ply += this.height;
                i++;
            }
        }
    }
}