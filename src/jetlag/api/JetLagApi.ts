import { Animation } from "../support/Animation";
import { ScoreApi } from "./ScoreApi"
import { WorldApi } from "./WorldApi"
import { OverlayApi } from "./OverlayApi"
import { JetLagManager } from "../internal/JetLagManager"
import { NavigationApi } from "./NavigationApi"
import { JetLagStage } from "../internal/JetLagStage";
import { ProjectileApi } from "./ProjectileApi"
import { TimedEvent } from "../internal/support/TimedEvent";
import { JetLagKeys } from "../support/JetLagKeys";

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
 * The functionality is divided into five parts:
 * - World: This is where the Actors of the game are drawn
 * - Hud: A heads-up display onto which text and input controls can be drawn
 * - Score: This tracks all of the scoring-related aspects of a level
 * - Nav: This is for navigating among levels and doing level-wide configuration
 * - Projectiles: This is for configuring Projectiles within the world
 * 
 * Note that there are other scenes, which are managed indirectly:
 * - WelcomeScene: A quick scene to display before the level starts
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

    /** 
     * An interface to everything related to managing projectiles within the
     * game world 
     */
    readonly projectiles: ProjectileApi;

    /**
     *  An interface to navigating between Splash, Store, Levels, Help, and
     *  Chooser
     */
    readonly nav: NavigationApi;

    /** 
     * Construct the JetLag API
     *
     * @param manager The JetLagManager, for navigation
     * @param stage   The JetLagStage, for interacting with a level
     */
    constructor(manager: JetLagManager, private stage: JetLagStage) {
        this.world = new WorldApi(stage);
        this.hud = new OverlayApi(stage, stage.getHud());
        this.score = new ScoreApi(stage);
        this.nav = new NavigationApi(manager, stage);
        this.projectiles = new ProjectileApi(stage);
    }

    /** Return the current frames per second of the game */
    public getFPS() { return this.stage.device.getRenderer().getFPS(); }

    /**
     * Play the sound indicated by the given sound name
     * 
     * @param soundName The name of the sound asset to play
     */
    public playSound(soundName: string) {
        this.stage.device.getSpeaker().getSound(soundName).play();
    }

    /** Manage the state of Mute */
    public toggleMute() {
        let st = this.stage.device.getStorage();
        // volume is either 1 or 0
        if (st.getPersistent("volume", "1") === "1") {
            // set volume to 0, set image to 'unmute'
            st.setPersistent("volume", "0");
        } else {
            // set volume to 1, set image to 'mute'
            st.setPersistent("volume", "1");
        }
        // update all music
        let sp = this.stage.device.getSpeaker();
        sp.resetMusicVolume(parseInt(st.getPersistent("volume", "1")));
    }

    /**
     * Use this to determine if the game is muted or not. True corresponds to
     * not muted, false corresponds to muted.
     */
    public getVolume() {
        let st = this.stage.device.getStorage();
        return st.getPersistent("volume", "1") === "1";
    }

    /**
     * Set a behavior to happen when a keyboard key is released
     * 
     * @param key The KEY to handle
     * @param action The action to perform when the key is released
     */
    public setUpKeyAction(key: JetLagKeys, action: () => void) {
        this.stage.device.getKeyboard().setKeyUpHandler(key, action);
    }

    /**
     * Set a behavior to happen when a key is down-pressed
     *
     * @param key The KEY to handle
     * @param action The action to perform when the key is released
     */
    public setDownKeyAction(key: JetLagKeys, action: () => void) {
        this.stage.device.getKeyboard().setKeyDownHandler(key, action);
    }

    /**
     * Set the background music for this level
     *
     * @param musicName Name of the music file to play.  Remember: this file
     *                  must have been registered as Music, not as a Sound
     */
    public setMusic(musicName: string) {
        this.stage.setMusic(this.stage.device.getSpeaker().getMusic(musicName));
    }

    /**
     * Indicate that some code should run after a fixed amount of time passes
     * 
     * @param interval The time until the event happens (or happens again)
     * @param repeat Should the event repeat?
     * @param action The action to perform when the timer expires
     */
    public addTimer(interval: number, repeat: boolean, action: () => void) {
        let e = new TimedEvent(interval, repeat, action);
        this.stage.getWorld().getTimer().addEvent(e);
    }

    /**
     * Generate a random number x in the range [0,max)
     *
     * @param max The largest number returned will be one less than max
     * @return a random integer
     */
    public getRandom(max: number) {
        return Math.floor(Math.random() * max);
    }

    /**
     * Create a new animation that can be populated via the "to" function
     *
     * @param repeat True if the animation should repeat when it reaches the end
     * @return The animation
     */
    public makeComplexAnimation(repeat: boolean) {
        return new Animation(repeat, this.stage.device.getRenderer());
    }

    /**
     * Create a new animation that shows each of a set of images for the same
     * amount of time
     *
     * @param timePerFrame The time to show each image
     * @param repeat       True if the animation should repeat when it reaches
     *                     the end
     * @param imgNames     The names of the images that comprise the animation
     * 
     * @return The animation
     */
    public makeAnimation(timePerFrame: number, repeat: boolean, imgNames: string[]) {
        let a = new Animation(repeat, this.stage.device.getRenderer());
        for (let i of imgNames)
            a.to(i, timePerFrame);
        return a;
    }
}