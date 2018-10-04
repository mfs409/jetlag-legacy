import { ScoreApi } from "./ScoreApi"
import { WorldApi } from "./WorldApi"
import { OverlayApi } from "./OverlayApi"
import { JetLagManager } from "../JetLagManager"
import { NavigationApi } from "./NavigationApi"
import { JetLagConfig } from "../JetLagConfig";
import { JetLagDevice, JetLagKeys } from "../misc/JetLagDevice";
import { Stage } from "../stage/Stage";
import { OverlayScene } from "../stage/OverlayScene";
import { Score } from "../misc/Score";

/**
 * JetLagApi provides a broad, public, declarative interface to the core
 * functionality of JetLag.
 *
 * Game designers will spend most of their time writing the functions for
 * creating the levels of the Chooser, Help, Levels, Splash, and Store screens.
 * Within those functions, a JetLagApi object is available.  It corresponds to a
 * pre-configured, blank, interactive portion of the game.  By calling functions
 * of the JetLagApi, a programmer can realize their game.
 * 
 * The functionality is divided into four parts:
 * - World: This is where the Actors of the game are drawn
 * - Hud: A heads-up display onto which text and input controls can be drawn
 * - Score: This tracks all of the scoring-related aspects of a level
 * - Nav: This is for navigating among levels and doing level-wide configuration
 * 
 * Note that there are other scenes, which are managed indirectly:
 * - PreScene: A quick scene to display before the level starts
 * - PauseScene: A scene to show when the game is paused
 * - WinScene: A scene to show when the game is won
 * - LoseScene: A scene to show when the game is lost
 */
export class JetLagApi {
    /** An interface to everything related to scores */
    readonly score: ScoreApi;

    /** An interface to everything related to putting things in the game world */
    readonly world: WorldApi;

    /** An interface to everything related to the heads-up display */
    readonly hud: OverlayApi;

    /** Everything else */
    readonly nav: NavigationApi;

    /** Construct the JetLag API from a manager object */
    constructor(manager: JetLagManager, config: JetLagConfig, private device: JetLagDevice, stage: Stage, hud: OverlayScene, score: Score) {
        this.world = new WorldApi(device, config, stage, score);
        this.hud = new OverlayApi(hud, device, stage);
        this.score = new ScoreApi(device, stage, score);
        this.nav = new NavigationApi(manager, stage);
    }

    /** Generate text indicating the current FPS */
    public getFPS(): number {
        return this.device.getRenderer().getFPS();
    }

    /**
     * Play the sound indicated by the given sound name
     * 
     * @param soundName The name of the sound asset to play
     */
    public playSound(soundName: string) {
        this.device.getSpeaker().getSound(soundName).play();
    }

    /**
     * Use this to manage the state of Mute
     */
    public toggleMute() {
        // volume is either 1 or 0
        if (this.device.getStorage().getPersistent("volume", "1") === "1") {
            // set volume to 0, set image to 'unmute'
            this.device.getStorage().setPersistent("volume", "0");
        } else {
            // set volume to 1, set image to 'mute'
            this.device.getStorage().setPersistent("volume", "1");
        }
        // update all music
        this.device.getSpeaker().resetMusicVolume(parseInt(this.device.getStorage().getPersistent("volume", "1")));
    }

    /**
     * Use this to determine if the game is muted or not. True corresponds to not muted, false
     * corresponds to muted.
     */
    public getVolume() {
        return this.device.getStorage().getPersistent("volume", "1") === "1";
    }

    /**
     * Set a behavior to happen when a key is released
     * 
     * @param key The KEY to handle
     * @param action The action to perform when the key is released
     */
    public setUpKeyAction(key: JetLagKeys, action: () => void) {
        this.device.getKeyboard().setKeyUpHandler(key, action);
    }

    /**
     * Set a behavior to happen when a key is pressed
     * 
     * @param key The KEY to handle
     * @param action The action to perform when the key is released
     */
    public setDownKeyAction(key: JetLagKeys, action: () => void) {
        this.device.getKeyboard().setKeyDownHandler(key, action);
    }

}