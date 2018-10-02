import { JetLagTouchScreen } from "./JetLagTouchScreen"
import { JetLagAccelerometer } from "./JetLagAccelerometer"
import { AccelerometerMode } from "./JetLagAccelerometer"
import { JetLagKeyboard } from "./JetLagKeyboard"
import { JetLagVibration } from "./JetLagVibration"
import { JetLagSpeaker } from "./JetLagSpeaker"
import { JetLagRenderer } from "./JetLagRenderer"
import { JetLagProcess } from "./JetLagProcess"
import { JetLagStorage } from "./JetLagStorage"
import { JetLagConfig } from "../JetLagConfig"

/**
 * Device bundles the abstractions of the parts of a game device.  This lets the
 * rest of liblol-ts use Device, instead of needing to have references to the
 * various subsystems' abstractions.
 */
export class Device {
    /** touch controller, providing gesture inputs */
    readonly touch: JetLagTouchScreen;

    /** keyboard controller, providing key event inputs */
    readonly keyboard: JetLagKeyboard;

    /** accel provides access to the the device's accelerometer */
    readonly accel: JetLagAccelerometer;

    /** video is where we draw the images we want the player to see */
    readonly renderer: JetLagRenderer;

    /** vibe provides device-specific vibration features */
    readonly vibe: JetLagVibration;

    /** speaker is where we play sounds and background music */
    readonly speaker: JetLagSpeaker;

    /** 
     * storage interfaces with the device's persistent storage, and also 
     * provides volatile storage for levels and sessions
     */
    readonly storage: JetLagStorage;

    /** The abstraction of an OS Process */
    readonly process: JetLagProcess;

    /**
     * Create a device context to abstract away browser features
     * 
     * @param cfg The game-wide configuration object
     * @param domId The Id of the DOM element where the game exists
     */
    constructor(cfg: JetLagConfig, domId: string) {
        this.storage = new JetLagStorage();
        this.speaker = new JetLagSpeaker(cfg);
        this.touch = new JetLagTouchScreen(domId);
        this.keyboard = new JetLagKeyboard();
        this.accel = new JetLagAccelerometer(AccelerometerMode.DEFAULT_LANDSCAPE, cfg.forceAccelerometerOff);
        this.vibe = new JetLagVibration();
        this.process = new JetLagProcess();
        this.renderer = new JetLagRenderer(cfg, domId);
    }
}