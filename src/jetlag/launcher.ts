import { JetLagManager } from "./JetLagManager"
import { JetLagConfig } from "./JetLagConfig";
import { HtmlDevice } from "./device/HtmlDevice"
import { HtmlConsole } from "./device/HtmlConsole"
import fscreen from "fscreen"

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

    // The addressbar lets us force the game into mobile mode (i.e.,
    // accelerometer on, full screen)
    let x = window.location + "";
    if (x.lastIndexOf("?mobile") == x.length - "?mobile".length) {
        config.forceAccelerometerOff = false;
        config.mobileMode = true;
    }

    // If we're in mobile mode, we need to let the user initiate full screen,
    // which requires a callback.
    if (config.mobileMode) {
        // try to lock orientation... This isn't working yet...
        (screen as any).orientation.lock((screen as any).orientation.type);
        // Put a message on screen about starting the game
        let elem = document.getElementById(domId);
        let d = document.createElement("div");
        d.innerHTML = "<b>Press Anywhere to Begin</b>";
        document.body.appendChild(d);
        document.onclick = () => {
            // In response to the user gesture, we can remove the message, turn
            // on full screen mode, and start the game
            document.body.removeChild(d);
            fscreen.requestFullscreen(elem);
            launchGame(config, logger, domId);
        }
    }
    else {
        launchGame(config, logger, domId);
    }
}

/**
 * This internal method is actually responsible for launching the game
 * 
 * @param config The JetLagConfig object
 * @param logger A logger, for printing debug messages
 * @param domId  The Id of the DOM element where the game should be drawn
 */
function launchGame(config: JetLagConfig, logger: HtmlConsole, domId: string) {
    // Should we change the screen dimensions and font size based on the 
    // size of the screen?
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
        config.pixelMeterRatio *= config.screenWidth / old.x;
        // NB: the ratio above is also the font scaling ratio
        config.fontScaling = config.screenWidth / old.x;
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