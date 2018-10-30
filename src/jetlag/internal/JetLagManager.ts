import { JetLagConfig } from "../support/JetLagConfig"
import { JetLagDevice } from "./support/Interfaces"
import { JetLagApi } from "../api/JetLagApi"
import { JetLagStage } from "./JetLagStage"

/** Types of stages in the game */
enum StageTypes {
    SPLASH = 0, HELP = 1, CHOOSER = 2, STORE = 3, PLAY = 4, COUNT = 5
}

/**
 * JetLagManager choreographs the flow of the game by tracking what is being
 * shown in the JetLagStage, and providing a structured way of switching what is
 * shown in the JetLagStage.
 */
export class JetLagManager {
    /** The current type of stage that we are showing */
    private stageType = StageTypes.SPLASH;

    /** The level within the current stage */
    private stageNum = 1;

    /** The currently active stage, if any */
    private stage: JetLagStage;

    /**
     * Create the JetLagManager.  Note that there are many steps to take before
     * we can get the JetLagManager up and running.  In particular, a
     * constructed JetLagManager can't function until the device's renderer is
     * fully loaded.
     *
     * @param cfg    The game config object
     * @param device The abstract device (with touch, sound, etc)
     */
    constructor(private readonly config: JetLagConfig, private readonly device: JetLagDevice) { }

    /**
     * Once the renderer has finished loading all assets for the game, this will
     * run.  Its job is to create the initial stage (a SPLASH stage), configure
     * it, and kick off the renderer.
     */
    public onAssetsLoaded() {
        // Be sure to refresh the mute state from the persistent storage
        let storage = this.device.getStorage();
        let speaker = this.device.getSpeaker();
        speaker.resetMusicVolume(parseInt(storage.getPersistent("volume", "1")));
        // Build the stage, wire it for touches
        this.stage = new JetLagStage(this, this.device, this.config);
        this.device.getTouchScreen().setTouchReceiver(this.stage);
        // Draw a splash scene, then we can actually start the render loop
        this.doSplash(1);
        this.device.getRenderer().startRenderLoop(this.stage);
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
    public doHelp(index: number) {
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
    public doStore(index: number) {
        this.stageNum = index;
        this.stageType = StageTypes.STORE;
        this.stage.onScreenChange();
        this.config.storeBuilder(index, new JetLagApi(this, this.stage));
    }

    /**
     * Load the level-chooser screen
     *
     * @param index The index of the chooser screen to create
     */
    public doChooser(index: number) {
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
}