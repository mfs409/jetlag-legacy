import { JetLagConfig } from "./JetLagConfig"
import { Device } from "./device/Device"
import { TouchReceiverHolder, TouchReceiver } from "./device/JetLagTouchScreen"
import { JetLagApi } from "./api/JetLagApi"
import { Stage } from "./stage/Stage"

/**
 * Modes of the game, which help decide which stage to show.  We can be showing
 * the main splash screens, the help screens, the level chooser screens, the
 * store screens, or the playable level screens
 */
enum MODES {
    SPLASH = 0, HELP = 1, CHOOSER = 2, STORE = 3, PLAY = 4, COUNT = 5
}

/**
 * JetLagManager choreographs the flow of the game by tracking which Stage is
 * currently active, and providing a means of navigating among Stages.
 * 
 * JetLagManager also routes all Device input events to the currently active 
 * Stage, and provides the currently active Stage with access to the Device
 * outputs.
 */
export class JetLagManager implements TouchReceiverHolder {
    /** The current state (e.g., are we showing a STORE) */
    private currentMode: number;

    /** 
     * The level within the mode (e.g., we are in PLAY scene 4, and will return
     * to CHOOSER 2) 
     */
    private readonly modeStates: number[] = [];

    /**
     * The game configuration object, which includes references to code for
     * creating the stages of the game.
     */
    readonly config: JetLagConfig;

    /** The abstract Device */
    readonly device: Device;

    /** The currently active stage, if any */
    private currStage: Stage;

    /**
     * Create the JetLagManager.  Note that there are many steps to take before
     * we can get the JetLagManager fully up and running.  In particular, a
     * constructed JetLagManager can't function until the device's renderer is
     * fully loaded.
     *
     * @param cfg The game config object
     * @param device The abstract device (with touch, sound, etc)
     */
    constructor(cfg: JetLagConfig, device: Device) {
        this.config = cfg;
        this.device = device;
        // Put each mode in state 1, since the first level is level 1
        for (let i = 0; i < MODES.COUNT; ++i) {
            this.modeStates.push(1);
        }
        // Register the manager with the device's gesture handler, so that all
        // gestures get routed through the manager to the stage.  See
        // TouchReceiverHolder for more information.
        this.device.touch.setTouchReceiverHolder(this);
    }

    /**
     * JetLagManager can't handle gestures itself, but its stage can.  The stage
     * changes over time (e.g., Play vs. Help), so JetLagManager has to be a
     * TouchReceiverHolder, not a TouchReceiver.  To satisfy the interface, we
     * need this method.  Note that the Stage is a TouchReceiver.
     */
    getTouchReceiver(): TouchReceiver { return this.currStage; }

    /** Getter for the current stage */
    getCurrStage() { return this.currStage; }

    /**
     * Once the renderer has finished loading all assets for the game, this will
     * run.  Its job is to create the initial stage (a SPLASH stage), configure
     * it, and kick off the renderer.
     */
    onAssetsLoaded() {
        // Be sure to refresh the mute state from the persistent storage
        this.device.speaker.resetMusicVolume(parseInt(this.device.storage.getPersistent("volume", "1")));
        this.currStage = new Stage(this);
        this.doSplash(this.modeStates[MODES.SPLASH]);
        this.device.renderer.startRenderLoop(this);
    }

    /**
     * Load the splash screen.  Note that whenever we load the splash screen, we
     * reset all other screen indexes to 1 (e.g., chooser and play go to 1).
     * This is important for those cases where the chooser is disabled, there
     * are many levels, and the player goes 'back' from a level > 1... When
     * 'Play' is pressed again, we should go to level 1!
     * 
     * @param index The index of the splash screen to load
     */
    doSplash(index: number): void {
        for (let i = 0; i < MODES.COUNT; ++i) {
            this.modeStates[i] = 1;
        }
        this.modeStates[MODES.SPLASH] = index;
        this.currentMode = MODES.SPLASH;
        this.currStage.onScreenChange();
        this.config.splashBuilder(index, new JetLagApi(this));
    }

    /**
     * Load a playable level.  Note that we keep the Chooser state as-is, for
     * easy returns
     *
     * @param index The index of the level to load
     */
    doPlay(index: number): void {
        this.modeStates[MODES.PLAY] = index;
        this.currentMode = MODES.PLAY;
        this.currStage.onScreenChange();
        this.config.levelBuilder(index, new JetLagApi(this));
    }

    /**
     * Load a help level
     *
     * @param index The index of the help level to load
     */
    doHelp(index: number): void {
        this.modeStates[MODES.HELP] = index;
        this.currentMode = MODES.HELP;
        this.currStage.onScreenChange();
        this.config.helpBuilder(index, new JetLagApi(this));
    }

    /**
     * Load a screen of the store.
     *
     * @param index The index of the help level to load
     */
    doStore(index: number): void {
        this.modeStates[MODES.STORE] = index;
        this.currentMode = MODES.STORE;
        this.currStage.onScreenChange();
        this.config.storeBuilder(index, new JetLagApi(this));
    }

    /**
     * Load the level-chooser screen. If the chooser is disabled, jump straight to level 1.
     *
     * @param index The chooser screen to create
     */
    doChooser(index: number): void {
        // if chooser disabled, then we either called this from splash, or from
        // a game level
        if (!this.config.enableChooser) {
            if (this.currentMode == MODES.PLAY) {
                this.doSplash(this.modeStates[MODES.SPLASH]);
            } else {
                this.doPlay(this.modeStates[MODES.PLAY]);
            }
            return;
        }
        // the chooser is not disabled
        this.modeStates[MODES.CHOOSER] = index;
        this.currentMode = MODES.CHOOSER;
        this.currStage.onScreenChange();
        this.config.chooserBuilder(index, new JetLagApi(this));
    }

    /**
     * Quit the game.  Stop the music, just to play it safe...
     */
    public doQuit() {
        this.currStage.world.stopMusic();
        this.device.process.exit();
    }

    /**
     * Move forward to the next level, if there is one, and otherwise go back to
     * the chooser.
     */
    public advanceLevel(): void {
        // Make sure to stop the music!
        if (this.modeStates[MODES.PLAY] == this.config.numLevels) {
            this.doChooser(1);
        } else {
            this.modeStates[MODES.PLAY]++;
            this.doPlay(this.modeStates[MODES.PLAY]);
        }
    }

    /** Start a level over again. */
    public repeatLevel(): void { this.doPlay(this.modeStates[MODES.PLAY]); }

    /**
     * This code is called repeatedly to update the game state and re-draw the
     * screen
     * 
     * @param millis The number of milliseconds that have passed since the last
     *               render
     */
    render(millis: number) {
        this.device.renderer.initFrame();
        this.currStage.render(this.device.renderer, millis);
        this.device.renderer.showFrame();
    }
}