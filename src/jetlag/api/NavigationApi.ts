import { JetLagManager } from "../internal/JetLagManager"
import { OverlayApi as OverlayApi } from "./OverlayApi"
import { JetLagStage } from "../internal/JetLagStage";

/**
 * NavigationApi provides all of the features needed for transitioning among
 * levels, and for moving between levels, chooser, help, store, and splash
 */
export class NavigationApi {
    /**
     * Construct the NavigationAPI
     *
     * @param manager The JetLagManager, for navigation
     * @param stage   The JetLagStage, for interacting with a level
     */
    constructor(private manager: JetLagManager, private stage: JetLagStage) { }

    /**
     * Load the level-chooser screen. Note that when the chooser is disabled, we
     * jump straight to level 1.
     *
     * @param whichChooser The chooser screen to create
     */
    public doChooser(whichChooser: number) {
        this.manager.doChooser(whichChooser);
    }

    /**
     * Load a help level.
     *
     * @param which The index of the help level to load
     */
    public doHelp(whichHelp: number) { this.manager.doHelp(whichHelp); }

    /** quit the game */
    public doQuit() { this.manager.doQuit(); }

    /** Cause Jetlag to advance to the next level */
    nextLevel() {
        this.stage.clearOverlayScene();
        this.manager.advanceLevel();
    }

    /** Cause Jetlag to repeat the current level */
    repeatLevel() {
        this.stage.clearOverlayScene();
        this.manager.repeatLevel();
    }

    /**
     * Explicitly dismiss any overlay scene.  This is most useful for clearing
     * Welcome, Win, and Lose scenes
     */
    dismissOverlayScene() { this.stage.clearOverlayScene(); }

    /**
     * load a playable level.
     *
     * @param which The index of the level to load
     */
    public doLevel(which: number) { this.manager.doPlay(which); }

    /**
     * load the splash screen
     * 
     * @param which The index of the splash level to load
     */
    public doSplash(index: number) { this.manager.doSplash(index); }

    /**
     * Provide code that can be used to create a "welcome" screen any time that
     * the corresponding level is played
     * 
     * @param builder The code to run to create the initial welcome screen
     */
    public setWelcomeSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.stage.setWelcomeSceneBuilder(builder);
    }

    /**
     * Provide code that can be used to create a quick "win" scene any time that
     * the corresponding level is won
     * 
     * @param builder The code to run to create the win scene
     */
    public setWinSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.stage.setWinSceneBuilder(builder);
    }

    /**
     * Provide code that can be used to create a quick "lose" scene any time
     * that the corresponding level is lost
     * 
     * @param builder The code to run to create the lose scene
     */
    public setLoseSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.stage.setLoseSceneBuilder(builder);
    }

    /**
     * Provide code that can be used to create a quick "pause" scene any time
     * that the corresponding level needs to be paused.
     * 
     * @param builder The code to run to create the pause scene
     */
    public setPauseSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.stage.setPauseSceneBuilder(builder);
    }
}