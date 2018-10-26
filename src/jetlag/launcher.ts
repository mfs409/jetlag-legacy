import { JetLagManager } from "./internal/JetLagManager"
import { JetLagConfig } from "./support/JetLagConfig";
import { HtmlDevice } from "./internal/device/HtmlDevice"
import { HtmlConsole } from "./internal/device/HtmlConsole"
import { JetLagDevice } from "./internal/support/Interfaces";

/**
 * Given a valid config object and the name of a DIV tag, run the game as an
 * HTML5 game inside of that div
 *
 * @param domId  The name of the DIV into which the game should be placed
 * @param config The game configuration object
 */
export function runGameAsHtml(domId: string, config: JetLagConfig) {
    // This is a bit dangerous, but we want to use the JetLagConsole singleton
    // everywhere, so we have to use while checking the configuration, before
    // the rest of the JetLagDevice is ready:
    let errs = config.check();
    let logger = new HtmlConsole(config);
    if (errs.length > 0) {
        logger.urgent("Warning: the following errors were found in your " +
            "configuration object.  Game behavior may not be as expected");
        for (let o of errs) {
            logger.urgent("  " + o);
        }
    }

    // For HTML games, we use HtmlDevice.initialize to create the device.  When
    // the device is ready, it will call the callback we provide, which can then
    // go and create the JetLagManager, load the device assets, and launch the
    // game.
    HtmlDevice.initialize(domId, logger, config, (config: JetLagConfig, device: JetLagDevice) => {
        let manager = new JetLagManager(config, device);

        // The renderer will load our assets asynchronously, after which the manager
        // can initialize the first scene (it can't do that until the assets are
        // loaded, because it wants to draw pictures into the scene). Then, once the
        // first scene is actually loaded, the manager will ask the renderer to
        // launch the render loop.
        device.getRenderer().loadAssets(() => { manager.onAssetsLoaded() });
    });
}