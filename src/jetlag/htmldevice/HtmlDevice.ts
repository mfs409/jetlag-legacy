import { JetLagConfig } from "../JetLagConfig"
import { JetLagDevice, JetLagAccelerometerMode } from "../misc/JetLagDevice"

import { HtmlTouchScreen } from "./HtmlTouchScreen"
import { HtmlAccelerometer } from "./HtmlAccelerometer"
import { HtmlKeyboard } from "./HtmlKeyboard"
import { HtmlVibration } from "./HtmlVibration"
import { HtmlSpeaker } from "./HtmlSpeaker"
import { HtmlRenderer } from "./HtmlRenderer"
import { HtmlProcess } from "./HtmlProcess"
import { HtmlStorage } from "./HtmlStorage"

/**
 * Device bundles the abstractions of the parts of a game device.  This lets the
 * rest of liblol-ts use Device, instead of needing to have references to the
 * various subsystems' abstractions.
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

    /**
     * Create a device context to abstract away browser features
     * 
     * @param cfg The game-wide configuration object
     * @param domId The Id of the DOM element where the game exists
     */
    constructor(cfg: JetLagConfig, domId: string) {
        this.storage = new HtmlStorage();
        this.speaker = new HtmlSpeaker(cfg);
        this.touch = new HtmlTouchScreen(domId);
        this.keyboard = new HtmlKeyboard();
        this.accel = new HtmlAccelerometer(JetLagAccelerometerMode.DEFAULT_LANDSCAPE, cfg.forceAccelerometerOff);
        this.vibe = new HtmlVibration();
        this.process = new HtmlProcess();
        this.renderer = new HtmlRenderer(cfg, domId);
    }
}