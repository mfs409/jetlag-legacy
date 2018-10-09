import { ScoreApi as ScoreApi } from "./Score"
import { WorldApi as WorldApi } from "./World"
import { OverlayApi as OverlayApi } from "./Overlay"
import { JetLagManager } from "../JetLagManager"
import { NavigationApi as NavigationApi } from "./Navigation"
import { JetLagKeys } from "../support/Interfaces";
import { JetLagStage } from "../JetLagStage";
import { ProjectileApi } from "./Projectile"

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

    /** Projectiles are complex, so they get their own API */
    readonly projectiles: ProjectileApi;

    /** Everything else */
    readonly nav: NavigationApi;

    /** Construct the JetLag API from a manager object */
    constructor(manager: JetLagManager, private stage: JetLagStage) {
        this.world = new WorldApi(stage);
        this.hud = new OverlayApi(stage, stage.getHud());
        this.score = new ScoreApi(stage);
        this.nav = new NavigationApi(manager, stage);
    }

    /** Generate text indicating the current FPS */
    public getFPS(): number {
        return this.stage.device.getRenderer().getFPS();
    }

    /**
     * Play the sound indicated by the given sound name
     * 
     * @param soundName The name of the sound asset to play
     */
    public playSound(soundName: string) {
        this.stage.device.getSpeaker().getSound(soundName).play();
    }

    /**
     * Use this to manage the state of Mute
     */
    public toggleMute() {
        // volume is either 1 or 0
        if (this.stage.device.getStorage().getPersistent("volume", "1") === "1") {
            // set volume to 0, set image to 'unmute'
            this.stage.device.getStorage().setPersistent("volume", "0");
        } else {
            // set volume to 1, set image to 'mute'
            this.stage.device.getStorage().setPersistent("volume", "1");
        }
        // update all music
        this.stage.device.getSpeaker().resetMusicVolume(parseInt(this.stage.device.getStorage().getPersistent("volume", "1")));
    }

    /**
     * Use this to determine if the game is muted or not. True corresponds to not muted, false
     * corresponds to muted.
     */
    public getVolume() {
        return this.stage.device.getStorage().getPersistent("volume", "1") === "1";
    }

    /**
     * Set a behavior to happen when a key is released
     * 
     * @param key The KEY to handle
     * @param action The action to perform when the key is released
     */
    public setUpKeyAction(key: JetLagKeys, action: () => void) {
        this.stage.device.getKeyboard().setKeyUpHandler(key, action);
    }

    /**
     * Set a behavior to happen when a key is pressed
     * 
     * @param key The KEY to handle
     * @param action The action to perform when the key is released
     */
    public setDownKeyAction(key: JetLagKeys, action: () => void) {
        this.stage.device.getKeyboard().setKeyDownHandler(key, action);
    }

}