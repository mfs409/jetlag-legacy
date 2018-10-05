import { JetLagManager } from "./JetLagManager"
import { JetLagConfig } from "./JetLagConfig";
import { HtmlDevice } from "./device/HtmlDevice"
import { HtmlConsole } from "./device/HtmlConsole"

/**
 * Given a valid config object and the name of a DIV tag, run the game as an
 * HTML5 game inside of that div
 *
 * @param domId  The name of the DIV into which the game should be placed
 * @param config The game configuration object
 */
export function runGameAsHtml(domId: string, config: JetLagConfig) {
    // This is a bit dangerous, but we want to use the JetLagConsole singleton
    // consistently, so we have to use it before checking the configuration:
    let errs = config.check();
    let logger = new HtmlConsole(config);
    if (errs.length > 0) {
        logger.urgent("Warning: the following errors were found in your " +
            "configuration object.  Game behavior may not be as expected");
        for (let o of errs) {
            logger.urgent("  " + o);
        }
    }

    if (config.adaptToScreenSize) {
        // as we compute the new screen width, height, and pixel ratio, we need
        // to be sure to remember the original ratio given in the game. JetLag
        // can't stretch differently in X than in Y, becaues there is only one
        // pixel/meter ratio.
        let targetRatio = config.screenWidth / config.screenHeight;
        let screen = { x: window.innerWidth, y: window.innerHeight };
        let old = { x: config.screenWidth, y: config.screenHeight };
        if (screen.y * targetRatio < screen.x) {
            // vertical is constraining
            config.screenHeight = screen.y;
            config.screenWidth = screen.y * targetRatio;
        }
        else {
            config.screenWidth = screen.x;
            config.screenHeight = screen.x / targetRatio;
        }
        config.pixelMeterRatio =
            config.pixelMeterRatio * config.screenWidth / old.x;
    }

    let device = new HtmlDevice(config, domId, logger);
    let manager = new JetLagManager(config, device);

    // The renderer will load our assets asynchronously, after which the manager
    // can initialize the first scene (it can't do that until the assets are
    // loaded, because it wants to draw pictures into the scene). Then, once the
    // first scene is actually loaded, the manager will ask the renderer to
    // launch the render loop.
    device.getRenderer().loadAssets(() => { manager.onAssetsLoaded() });
}