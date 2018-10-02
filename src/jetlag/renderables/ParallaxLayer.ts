import { JetLagSprite } from "../device/JetLagRenderer"
import { JetLagManager } from "../JetLagManager"

/**
 * This object holds the configuration information for a Parallax layer.
 */
export class ParallaxLayer {
    /** How fast should this layer scroll? */
    scrollSpeed: number;

    /** Is it a horizontal or vertical scroll? */
    isHoriz: boolean;

    /** Is this an "auto" scroll, or is it position-based */
    isAuto: boolean;

    /** The images to display */
    images: JetLagSprite[] = [];

    /** X coord of last render */
    lastX: number;

    /** Y coord of last render */
    lastY: number;

    /** Width of the image to display */
    width: number;

    /** Height of the image to display */
    height: number;

    /** Last camera X value */
    lastCamX = 0;

    /** Last camera Y value */
    lastCamY = 0;

    /**
     * Construct a ParallaxLayer that can be rendered correctly
     *
     * @param x       The X of the top left corner of the leftmost instance of the image
     * @param y       The Y of the top left corner of the topmost instance of the image
     * @param width   The width of the image being used as a background layer
     * @param height  The height of the image being used as a background layer
     * @param speed   Speed at which it scrolls.  Important values are 0, 1, and between.  Differs for auto and non-auto.
     * @param isX     True for X scrolling, false for Y scrolling
     * @param isAuto  True if this should scroll regardless of camera
     * @param imgName The name of the image file to use as the background
     * @param manager The JetLagManager
     */
    constructor(x: number, y: number, width: number, height: number, speed: number, isX: boolean, isAuto: boolean, imgName: string, manager: JetLagManager) {
        this.scrollSpeed = speed;
        this.isHoriz = isX;
        this.isAuto = isAuto;
        this.width = width;
        this.height = height;
        this.lastX = x;
        this.lastY = y;
        // figure out how many sprites we need to properly tile the image
        let num = 1;
        if (this.isHoriz) {
            let screenWidthMeters = manager.config.screenWidth / manager.config.pixelMeterRatio;
            num += Math.ceil(screenWidthMeters / this.width);
        }
        else {
            let screenHeightMeters = manager.config.screenHeight / manager.config.pixelMeterRatio;
            num += Math.ceil(screenHeightMeters / this.height);
        }
        for (let i = 0; i < num; ++i)
            this.images.push(manager.device.renderer.getSprite(imgName));
    }
}