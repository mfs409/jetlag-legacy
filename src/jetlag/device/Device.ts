import { TouchScreen } from "./TouchScreen"
import { Accelerometer } from "./Accelerometer"
import { AccelerometerMode } from "./Accelerometer"
import { Keyboard } from "./Keyboard"
import { Vibration } from "./Vibration"
import { Speaker } from "./Speaker"
import { Renderer } from "./Renderer"
import { Process } from "./Process"
import { JLStorage } from "./Storage"
import { Console } from "./Console"
import { JetLagConfig } from "../JetLagConfig"

/**
 * Device bundles the abstractions of the parts of a game device.  This lets the
 * rest of liblol-ts use Device, instead of needing to have references to the
 * various subsystems' abstractions.
 */
export class Device {
    /** touch controller, providing gesture inputs */
    readonly touch: TouchScreen;

    /** keyboard controller, providing key event inputs */
    readonly keyboard: Keyboard;

    /** accel provides access to the the device's accelerometer */
    readonly accel: Accelerometer;

    /** video is where we draw the images we want the player to see */
    readonly renderer: Renderer;

    /** vibe provides device-specific vibration features */
    readonly vibe: Vibration;

    /** speaker is where we play sounds and background music */
    readonly speaker: Speaker;

    /** console is for printing messages to the device console */
    readonly console: Console;

    /** 
     * storage interfaces with the device's persistent storage, and also 
     * provides volatile storage for levels and sessions
     */
    readonly storage: JLStorage = new JLStorage();

    /** The abstraction of an OS Process */
    readonly process: Process;

    /**
     * Create a device context to abstract away browser features
     * 
     * @param cfg The game-wide configuration object
     * @param domId The Id of the DOM element where the game exists
     */
    constructor(cfg: JetLagConfig, domId: string) {
        this.console = new Console(cfg);
        this.speaker = new Speaker(cfg);
        this.touch = new TouchScreen(domId);
        this.keyboard = new Keyboard();
        this.accel = new Accelerometer(AccelerometerMode.DEFAULT_LANDSCAPE, cfg.forceAccelerometerOff);
        this.vibe = new Vibration();
        this.process = new Process();
        this.renderer = new Renderer(cfg, domId);
    }
}