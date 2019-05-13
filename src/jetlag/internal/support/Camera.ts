import { JetLagConfig } from "../../support/JetLagConfig";
import { JetLagConsole } from "./Interfaces";

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
     * @param config The game-wide configuration object, used to get screen
     *               dimensions
     * @param console A console, for reporting errors and warnings
     */
    constructor(maxX: number, maxY: number, ratio: number, config: JetLagConfig, private console: JetLagConsole) {
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
    public getScale(): number { return this.ratio; }

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
     * NB: this is called (indirectly) by the render loop in order to make sure
     *     we don't go out of bounds.
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

        this.center.y = centerY;
        this.center.x = centerX;
        if (bottom > this.max.y)
            this.center.y = this.max.y - this.scaledVisibleRegionDims.h / 2;
        if (top < this.min.y)
            this.center.y = this.min.y + this.scaledVisibleRegionDims.h / 2;
        if (right > this.max.x)
            this.center.x = this.max.x - this.scaledVisibleRegionDims.w / 2;
        if (left < this.min.x)
            this.center.x = this.min.x + this.scaledVisibleRegionDims.w / 2;
    }

    /**
     * Determine whether a sprite is within the region being shown by the
     * camera, so that we can reduce the overhead on the renderer.
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

    /** Return the X coordinate of the left of the camera viewport */
    public getOffsetX() {
        return this.center.x - this.scaledVisibleRegionDims.w / 2;
    }

    /** Return the Y coordinate of the top of the camera viewport */
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
            this.console.urgent("Warning, the visible game area is less than the screen width");
        if (h < this.screenDims.h)
            this.console.urgent("Warning, the visible game area is less than the screen height");
    }
}