import fscreen from "fscreen"

import { JetLagConfig } from "../../support/JetLagConfig"
import { JetLagDevice, JetLagAccelerometerMode } from "../support/Interfaces"
import { HtmlTouchScreen } from "./HtmlTouchScreen"
import { HtmlAccelerometer } from "./HtmlAccelerometer"
import { HtmlKeyboard } from "./HtmlKeyboard"
import { HtmlVibration } from "./HtmlVibration"
import { HtmlSpeaker } from "./HtmlSpeaker"
import { HtmlRenderer } from "./HtmlRenderer"
import { HtmlProcess } from "./HtmlProcess"
import { HtmlStorage } from "./HtmlStorage"
import { HtmlConsole } from "./HtmlConsole";

/**
 * HtmlDevice is an implementation of JetLagDevice for desktop/laptop browsers.
 * It has only been tested on Chrome
 */
export class HtmlDevice implements JetLagDevice {
    /** touch controller, providing gesture inputs */
    private readonly touch: HtmlTouchScreen;

    /** keyboard controller, providing key event inputs */
    private readonly keyboard: HtmlKeyboard;

    /** accel provides access to the the device's accelerometer */
    private readonly accel: HtmlAccelerometer;

    /** video is where we draw the images we want the player to see */
    private readonly renderer: HtmlRenderer;

    /** vibe provides device-specific vibration features */
    private readonly vibe: HtmlVibration;

    /** speaker is where we play sounds and background music */
    private readonly speaker: HtmlSpeaker;

    /** The abstraction of an OS Process */
    private readonly process: HtmlProcess;

    /** 
     * storage interfaces with the device's persistent storage, and also 
     * provides volatile storage for levels and sessions
     */
    private readonly storage: HtmlStorage;

    /**
     * Create an HtmlDevice context to abstract away browser features
     *
     * @param cfg     The game-wide configuration object
     * @param domId   The Id of the DOM element where the game exists
     * @param console A console device, for debug messages
     */
    constructor(cfg: JetLagConfig, domId: string, private readonly console: HtmlConsole) {
        this.storage = new HtmlStorage(this.console);
        this.speaker = new HtmlSpeaker(cfg, this.console);
        this.touch = new HtmlTouchScreen(domId);
        this.keyboard = new HtmlKeyboard();
        this.accel = new HtmlAccelerometer(JetLagAccelerometerMode.DEFAULT_LANDSCAPE, cfg.forceAccelerometerOff, this.console);
        this.vibe = new HtmlVibration(this.console);
        this.process = new HtmlProcess();
        this.renderer = new HtmlRenderer(cfg, domId, this.console);
    }

    /** Getter for the touchscreen */
    getTouchScreen() { return this.touch; }

    /** Getter for the keyboard interface */
    getKeyboard() { return this.keyboard }

    /** Getter for the accelerometer */
    getAccelerometer() { return this.accel }

    /** Getter for the renderer */
    getRenderer() { return this.renderer }

    /** Getter for the vibration feature */
    getVibration() { return this.vibe }

    /** Getter for the speaker */
    getSpeaker() { return this.speaker }

    /** Getter for the key/value store */
    getStorage() { return this.storage }

    /** Getter for the interface to the OS process */
    getProcess() { return this.process }

    /** Getter for the Console */
    getConsole() { return this.console; }

    /**
     * Build an HtmlDevice object, and then pass it to the provided callback.
     *
     * @param domId  The name of the DIV into which the game should be placed
     * @param logger An HTML Console that can be used to print error messages
     * @param config The game configuration object
     * @param callback A callback to run once the device is ready
     */
    static initialize(domId: string, logger: HtmlConsole, config: JetLagConfig, callback: (config: JetLagConfig, device: JetLagDevice) => void) {
        // The addressbar lets us force the game into mobile mode (i.e.,
        // accelerometer on, full screen)
        let x = window.location + "";
        if (x.lastIndexOf("?mobile") == x.length - "?mobile".length) {
            config.forceAccelerometerOff = false;
            config.mobileMode = true;
        }

        // If we're in mobile mode, we need to let the user initiate full screen
        // before we compute the screen size
        if (config.mobileMode) {
            // try to lock orientation... This isn't working yet...
            (screen as any).orientation.lock((screen as any).orientation.type);

            // Put a message on screen about starting the game
            let elem = document.getElementById(domId);
            let d = document.createElement("div");
            d.innerHTML = "<b>Press Anywhere to Begin</b>";
            document.body.appendChild(d);

            // When the page is clicked, we will switch to full screen.  Then we
            // can infer the screen size and finish building the device.
            document.onclick = () => {
                // prevent double-touches from doing funny things
                document.onclick = null;
                // go full screen
                fscreen.requestFullscreen(elem);
                // Remove the message
                document.body.removeChild(d);
                // wait a second before finishing up the configuration of the
                // device
                setTimeout(() => {
                    // Adjust screen dimensions based on new fullscreen size,
                    // then make the device and run the callback
                    if (config.adaptToScreenSize) {
                        HtmlDevice.adjustScreenDimensions(config);
                    }
                    callback(config, new HtmlDevice(config, domId, logger));
                }, 1000);
            }
        }
        else {
            // Adjust screen dimensions based on new fullscreen size, then make
            // the device and run the callback
            if (config.adaptToScreenSize) {
                HtmlDevice.adjustScreenDimensions(config);
            }
            callback(config, new HtmlDevice(config, domId, logger));
        }
    }

    /**
     * If the game is supposed to fill the screen, this code will change the
     * config object to maximize the div in which the game is drawn
     *
     * @param config The JetLagConfig object
     */
    static adjustScreenDimensions(config: JetLagConfig) {
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
}