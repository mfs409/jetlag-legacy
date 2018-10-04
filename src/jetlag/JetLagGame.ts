import { JetLagManager } from "./JetLagManager"
import { JetLagConfig } from "./JetLagConfig";
import { Logger } from "./misc/Logger";
import { HtmlDevice } from "./htmldevice/HtmlDevice"
import { HtmlConsole } from "./htmldevice/HtmlConsole"

/**
 * JetLagGame is the top-level wrapper for all of the functionality of JetLag.
 * JetLagGame also provides the entry point through which a web page can connect
 * game functionality to a div on the page.
 *
 * From a MVC perspective, JetLagGame is both the top-level interface to the
 * view, and also the top-level interface to the controller.  In terms of views,
 * JetLagGame provides a RENDERER, a VIBRATE feature, an output debug CONSOLE,
 * STORAGE, and a SPEAKER. In terms of controllers, JetLagGame provides
 * TOUCHSCREEN, KEYBOARD, and ACCELEROMETER.  Note that some of these features
 * need not route through JetLagGame explicitly, but doing so leads to a cleaner
 * abstraction for the rest of JetLag.
 *
 * Another way of thinking about JetLagGame is that it provides an interface to
 * an abstract game device, and routes events between a JetLagManager and the
 * abstract device.
 */
export class JetLagGame {
    /**
     * Given a valid config object and the name of a DIV tag, run the game as an
     * HTML5 game inside of that div
     *
     * @param domId The name of the DIV into which the game should be placed
     * @param cfg The game configuration object
     */
    public static runGameAsHtml(domId: string, cfg: JetLagConfig): void {
        // This is a bit dangerous, but we want to use the JetLagConsole
        // singleton consistently, so we have to use it before checking the
        // configuration:
        let errs = cfg.check();
        Logger.config(new HtmlConsole(cfg));
        if (errs.length > 0) {
            Logger.urgent("Warning: the following errors were found in your " +
                "configuration object.  Game behavior may not be as expected");
            for (let o of errs) {
                Logger.urgent("  " + o);
            }
        }

        if (cfg.adaptToScreenSize) {
            // as we compute the new screen width, height, and pixel ratio, we
            // need to be sure to remember the original ratio given in the game.
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

        let device = new HtmlDevice(cfg, domId);
        let manager = new JetLagManager(cfg, device);

        // The renderer will load our assets asynchronously, after which the
        // manager can initialize the first scene (it can't do that until the
        // assets are loaded, because it wants to draw pictures into the scene).
        // Then, once the first scene is actually loaded, the manager will ask
        // the renderer to launch the render loop.
        device.getRenderer().loadAssets(() => { manager.onAssetsLoaded() });
    }
}