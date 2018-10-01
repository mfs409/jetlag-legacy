import { Device } from "./device/Device"
import { JetLagManager } from "./JetLagManager"
import { JetLagConfig } from "./JetLagConfig";

/**
 * JetLagGame is the top-level wrapper for all of the functionality of JetLag.
 * JetLagGame also provides the entry point through which a web page can connect
 * game functionality to a div on the page.
 *
 * From a MVC perspective, JetLagGame is both the top-level interface to the
 * view, and also the top-level interface to the controller.  In terms of views,
 * JetLagGame provides a RENDERER, a VIBRATE feature, and a SPEAKER. In terms of
 * controllers, JetLagGame provides TOUCHSCREEN, KEYBOARD, and ACCELEROMETER.
 * Note that some of these features need not route through JetLagGame
 * explicitly, but doing so leads to a cleaner abstraction for the rest of
 * JetLag.
 *
 * Another way of thinking about JetLagGame is that it provides an interface to
 * an abstract game device, and routes events between a JetLagManager and the
 * abstract device.
 */
export class JetLagGame {
    /**
     * Launch a game, as defined by its Config, and render it in appropriate DIV
     * 
     * @param domId The name of the DIV into which the game should be placed
     * @param cfg The game configuration object
     */
    public static runGame(domId: string, cfg: JetLagConfig): void {
        let errs = cfg.check();
        if (errs.length > 0) {
            console.log("Warning: the following errors were found in your configuration object.  Game behavior may not be as expected");
            for (let o of errs) {
                console.log("  " + o);
            }
        }

        if (cfg.adaptToScreenSize) {
            // as we compute the new screen width, height, and pixel ratio, we
            // need to be sure to preserve the original ratio given in the game.
            // JetLag can't stretch differently in X than in Y, becaues there is
            // only one pixel/meter ratio.
            let targetRatio = cfg.screenWidth / cfg.screenHeight;
            let screen = { x: window.innerWidth, y: window.innerHeight };
            let old = { x: cfg.screenWidth, y: cfg.screenHeight };
            if (screen.y * targetRatio < screen.x) {
                // vertical is constraining
                cfg.screenHeight = screen.y;
                cfg.screenWidth = screen.y * targetRatio;
            }
            else {
                cfg.screenWidth = screen.x;
                cfg.screenHeight = screen.x / targetRatio;
            }
            cfg.pixelMeterRatio = cfg.pixelMeterRatio * cfg.screenWidth / old.x;
        }

        let device = new Device(cfg, domId);
        let manager = new JetLagManager(cfg, device);

        // Things are a little bit convoluted here.  PIXI will load our assets
        // asynchronously, after which the manager can initialize the first scene
        // (it can't do that until the assets are loaded, because it wants to draw
        // pictures into the scene).  Then, once the first scene is actually loaded,
        // the manager can ask the renderer to launch the render loop.
        device.renderer.loadAssets(() => { manager.onAssetsLoaded() });
    }
}