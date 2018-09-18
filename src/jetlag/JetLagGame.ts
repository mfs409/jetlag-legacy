import { Device } from "./device/Device"
import { JetLagManager } from "./JetLagManager"
import { JetLagConfig } from "./JetLagConfig";

/**
 * LolGame is the top-level wrapper for all of the functionality of Lol-TS.
 * LolGame also provides the entry point through which a web page can connect
 * game functionality to a div on the page.
 * 
 * From a MVC perspective, LolGame is both the top-level interface to the
 * view, and also the top-level interface to the controller.  In terms of
 * views, LolGame provides a RENDERER, a VIBRATE feature, and a SPEAKER.
 * In terms of controllers, LolGame provides TOUCHSCREEN, KEYBOARD, and
 * ACCELEROMETER.  Note that some of these features need not route through
 * LolGame explicitly, but doing so leads to a cleaner abstraction for the rest
 * of Lol-TS.
 * 
 * Another way of thinking about LolGame is that it provides an interface to an
 * abstract game device, and routes events between a StageManager and the
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