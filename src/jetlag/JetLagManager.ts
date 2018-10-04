import { JetLagConfig } from "./JetLagConfig"
import { JetLagDevice, JetLagTouchReceiverHolder, JetLagTouchReceiver } from "./misc/JetLagDevice"
import { JetLagApi } from "./api/JetLagApi"
import { Stage } from "./stage/Stage"

/** Types of stages in the game */
enum StageTypes {
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
export class JetLagManager implements JetLagTouchReceiverHolder {
    /** The current type of stage that we are showing */
    private currStageType: number;

    /** The level within the current stage */
    private currStageNum: number;

    /** The currently active stage, if any */
    private currStage: Stage;

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
        // Start in stage 1 of whatever we're going into
        this.currStageNum = 1;
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
    getTouchReceiver(): JetLagTouchReceiver { return this.currStage; }

    /** Getter for the current stage */
    getCurrStage() { return this.currStage; }

    /**
     * Once the renderer has finished loading all assets for the game, this will
     * run.  Its job is to create the initial stage (a SPLASH stage), configure
     * it, and kick off the renderer.
     */
    onAssetsLoaded() {
        // Be sure to refresh the mute state from the persistent storage
        this.device.getSpeaker().resetMusicVolume(parseInt(this.device.getStorage().getPersistent("volume", "1")));
        this.currStage = new Stage(this, this.device, this.config);
        this.doSplash(1);
        this.device.getRenderer().startRenderLoop(this);
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
        this.currStageNum = index;
        this.currStageType = StageTypes.SPLASH;
        this.currStage.onScreenChange();
        this.config.splashBuilder(index, new JetLagApi(this, this.config, this.device));
    }

    /**
     * Load a playable level.  Note that we keep the Chooser state as-is, for
     * easy returns
     *
     * @param index The index of the level to load
     */
    doPlay(index: number): void {
        this.currStageNum = index;
        this.currStageType = StageTypes.PLAY;
        this.currStage.onScreenChange();
        this.config.levelBuilder(index, new JetLagApi(this, this.config, this.device));
    }

    /**
     * Load a help level
     *
     * @param index The index of the help level to load
     */
    doHelp(index: number): void {
        this.currStageNum = index;
        this.currStageType = StageTypes.HELP;
        this.currStage.onScreenChange();
        this.config.helpBuilder(index, new JetLagApi(this, this.config, this.device));
    }

    /**
     * Load a screen of the store.
     *
     * @param index The index of the help level to load
     */
    doStore(index: number): void {
        this.currStageNum = index;
        this.currStageType = StageTypes.STORE;
        this.currStage.onScreenChange();
        this.config.storeBuilder(index, new JetLagApi(this, this.config, this.device));
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
            if (this.currStageType == StageTypes.PLAY) {
                this.doSplash(1);
            } else {
                this.doPlay(1);
            }
            return;
        }
        // the chooser is not disabled
        this.currStageNum = index;
        this.currStageType = StageTypes.CHOOSER;
        this.currStage.onScreenChange();
        this.config.chooserBuilder(index, new JetLagApi(this, this.config, this.device));
    }

    /** Quit the game.  Stop the music, just to play it safe... */
    public doQuit() {
        this.currStage.world.stopMusic();
        this.device.getProcess().exit();
    }

    /**
     * Move forward to the next level, if there is one, or else go back to the
     * chooser.
     */
    public advanceLevel(): void {
        if (this.currStageNum == this.config.numLevels) {
            this.doChooser(1);
        } else {
            this.doPlay(++this.currStageNum);
        }
    }

    /** Start a level over again. */
    public repeatLevel(): void { this.doPlay(this.currStageNum); }

    /**
     * This code is called repeatedly to update the game state and re-draw the
     * screen
     * 
     * @param millis The number of milliseconds that have passed since the last
     *               render
     */
    render(millis: number) {
        this.device.getRenderer().initFrame();
        this.currStage.render(this.device.getRenderer(), millis);
        this.device.getRenderer().showFrame();
    }
}