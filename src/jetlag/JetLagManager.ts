import { JetLagConfig } from "./JetLagConfig"
import { JetLagDevice, JetLagTouchReceiverHolder, JetLagTouchReceiver } from "./support/Interfaces"
import { JetLagApi as JetLagApi } from "./api/JetLag"
import { JetLagStage } from "./JetLagStage"

/** Types of stages in the game */
enum StageTypes {
    SPLASH = 0, HELP = 1, CHOOSER = 2, STORE = 3, PLAY = 4, COUNT = 5
}

/**
 * JetLagManager choreographs the flow of the game by tracking which Stage is
 * currently active, and providing a means of navigating among Stages.
 *
 * By virtue of it being a JetLagTouchReceiverHolder, JetLagManager also routes
 * all Device input events to the currently active Stage (which is a
 * JetLagTouchReceiver).
 */
export class JetLagManager implements JetLagTouchReceiverHolder {
    /** The current type of stage that we are showing */
    private stageType = StageTypes.SPLASH;

    /** The level within the current stage */
    private stageNum = 1;

    /** The currently active stage, if any */
    private stage: JetLagStage;

    /**
     * Create the JetLagManager.  Note that there are many steps to take before
     * we can get the JetLagManager fully up and running.  In particular, a
     * constructed JetLagManager can't function until the device's renderer is
     * fully loaded.
     *
     * @param cfg    The game config object
     * @param device The abstract device (with touch, sound, etc)
     */
    constructor(private readonly config: JetLagConfig, private readonly device: JetLagDevice) {
        // Register the manager with the device's gesture handler, so that all
        // gestures get routed through the manager to the stage.  See
        // TouchReceiverHolder for more information.
        this.device.getTouchScreen().setTouchReceiverHolder(this);
    }

    /**
     * JetLagManager can't handle gestures itself, but its stage can.  The stage
     * changes over time (e.g., Play vs. Help), so JetLagManager has to behave
     * as a TouchReceiverHolder, not a TouchReceiver.  Note that the Stage is a
     * TouchReceiver.
     */
    public getTouchReceiver(): JetLagTouchReceiver { return this.stage; }

    /**
     * Once the renderer has finished loading all assets for the game, this will
     * run.  Its job is to create the initial stage (a SPLASH stage), configure
     * it, and kick off the renderer.
     */
    public onAssetsLoaded() {
        // Be sure to refresh the mute state from the persistent storage
        this.device.getSpeaker().resetMusicVolume(parseInt(this.device.getStorage().getPersistent("volume", "1")));
        this.stage = new JetLagStage(this, this.device, this.config);
        this.doSplash(1);
        this.device.getRenderer().startRenderLoop(this);
    }

    /**
     * Load the splash screen
     *
     * @param index The index of the splash screen to load
     */
    public doSplash(index: number) {
        this.stageNum = index;
        this.stageType = StageTypes.SPLASH;
        this.stage.onScreenChange();
        this.config.splashBuilder(index, new JetLagApi(this, this.stage));
    }

    /**
     * Load a playable level
     *
     * @param index The index of the level to load
     */
    public doPlay(index: number) {
        this.stageNum = index;
        this.stageType = StageTypes.PLAY;
        this.stage.onScreenChange();
        this.config.levelBuilder(index, new JetLagApi(this, this.stage));
    }

    /**
     * Load a help level
     *
     * @param index The index of the help level to load
     */
    public doHelp(index: number): void {
        this.stageNum = index;
        this.stageType = StageTypes.HELP;
        this.stage.onScreenChange();
        this.config.helpBuilder(index, new JetLagApi(this, this.stage));
    }

    /**
     * Load a screen of the store
     *
     * @param index The index of the help level to load
     */
    public doStore(index: number): void {
        this.stageNum = index;
        this.stageType = StageTypes.STORE;
        this.stage.onScreenChange();
        this.config.storeBuilder(index, new JetLagApi(this, this.stage));
    }

    /**
     * Load the level-chooser screen
     *
     * @param index The chooser screen to create
     */
    public doChooser(index: number): void {
        // if chooser disabled, then it's either Splash=>Play or Play=>Splash
        if (!this.config.enableChooser) {
            if (this.stageType == StageTypes.PLAY) {
                this.doSplash(1);
            } else {
                this.doPlay(1);
            }
            return;
        }
        // the chooser is not disabled
        this.stageNum = index;
        this.stageType = StageTypes.CHOOSER;
        this.stage.onScreenChange();
        this.config.chooserBuilder(index, new JetLagApi(this, this.stage));
    }

    /** Quit the game.  Stop the music before quitting. */
    public doQuit() {
        this.stage.stopMusic();
        this.device.getProcess().exit();
    }

    /**
     * Move forward to the next level, if there is one, or else go back to the
     * chooser.
     */
    public advanceLevel() {
        if (this.stageNum == this.config.numLevels) {
            this.doChooser(1);
        } else {
            this.doPlay(++this.stageNum);
        }
    }

    /** Start a level over again. */
    public repeatLevel() { this.doPlay(this.stageNum); }

    /**
     * This code is called at a fixed interval (i.e., every 1/45 of a second) to
     * update the game state and re-draw the screen
     *
     * @param millis The number of milliseconds that have passed since the last
     *               render
     */
    render(millis: number) {
        this.device.getRenderer().initFrame();
        this.stage.render(this.device.getRenderer(), millis);
        this.device.getRenderer().showFrame();
    }
}