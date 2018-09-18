import { JetLagManager } from "../JetLagManager"
import { OverlayApi } from "./OverlayApi"

/**
 * NavigationApi is the "kitchen sink".  It has everything for moving between
 * levels, moving between chooser, store, levels, etc., and also a few 
 * miscellaneous things, like sounds.
 */
export class NavigationApi {
    /**
     * Construct a level.  Since Level is merely a facade, this method need only
     * store references to the actual game objects.
     *
     * @param manager the JetLagManager for the game
     */
    constructor(private manager: JetLagManager) { }

    /**
     * load the level-chooser screen. Note that when the chooser is disabled, we jump straight to
     * level 1.
     *
     * @param whichChooser The chooser screen to create
     */
    public doChooser(whichChooser: number) {
        this.manager.doChooser(whichChooser);
    }

    /**
     * load a help level.
     *
     * @param which The index of the help level to load
     */
    public doHelp(whichHelp: number) {
        this.manager.doHelp(whichHelp);
    }

    /**
     * quit the game
     */
    public doQuit() {
        this.manager.doQuit();
    }

    /**
     * Cause Jetlag to advance to the next level
     */
    nextLevel() {
        this.manager.getCurrStage().clearOverlayScene();
        this.manager.advanceLevel();
    }

    /**
     * Cause Jetlag to repeat the current level
     */
    repeatLevel() {
        this.manager.getCurrStage().clearOverlayScene();
        this.manager.repeatLevel();
    }

    /**
     * Explicitly dismiss any overlay scene.  Only use this when a PreScene or
     * PauseScene is showing.
     */
    dismissOverlayScene() {
        this.manager.getCurrStage().clearOverlayScene();
    }

    /**
     * Use this to manage the state of Mute
     */
    public toggleMute() {
        // volume is either 1 or 0
        if (this.manager.device.storage.getPersistent("volume", "1") === "1") {
            // set volume to 0, set image to 'unmute'
            this.manager.device.storage.setPersistent("volume", "0");
        } else {
            // set volume to 1, set image to 'mute'
            this.manager.device.storage.setPersistent("volume", "1");
        }
        // update all music
        this.manager.device.speaker.resetMusicVolume(parseInt(this.manager.device.storage.getPersistent("volume", "1")));
    }

    /**
     * Use this to determine if the game is muted or not. True corresponds to not muted, false
     * corresponds to muted.
     */
    public getVolume() {
        return this.manager.device.storage.getPersistent("volume", "1") === "1";
    }

    /**
     * load a playable level.
     *
     * @param which The index of the level to load
     */
    public doLevel(which: number) {
        this.manager.doPlay(which);
    }

    /**
     * load the splash screen
     */
    public doSplash(index: number) {
        this.manager.doSplash(index);
    }

    /**
     * Provide code that can be used to create a "welcome" screen any time that
     * the corresponding level is played
     * 
     * @param builder The code to run to create the initial welcome screen
     */
    public setWelcomeSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.manager.getCurrStage().welcomeSceneBuilder = builder;
    }

    /**
     * Provide code that can be used to create a quick "win" scene any time that
     * the corresponding level is won
     * 
     * @param builder The code to run to create the win scene
     */
    public setWinSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.manager.getCurrStage().winSceneBuilder = builder;
    }

    /**
     * Provide code that can be used to create a quick "lose" scene any time
     * that the corresponding level is won
     * 
     * @param builder The code to run to create the lose scene
     */
    public setLoseSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.manager.getCurrStage().loseSceneBuilder = builder;
    }

    /**
     * Provide code that can be used to create a quick "pause" scene any time
     * that the corresponding level needs to be paused.
     * 
     * @param builder The code to run to create the pause scene
     */
    public setPauseSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.manager.getCurrStage().pauseSceneBuilder = builder;
    }

    /**
     * Play the sound indicated by the given sound name
     * 
     * @param soundName The name of the sound asset to play
     */
    public playSound(soundName: string) {
        this.manager.device.speaker.getSound(soundName).play();
    }

    /**
     * Generate text indicating the current FPS
     */
    public getFPS(): number {
        return this.manager.device.renderer.getFPS();
    }
}