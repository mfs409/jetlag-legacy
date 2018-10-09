import { Animation } from "../support/Animation";
import { ScoreApi as ScoreApi } from "./Score"
import { WorldApi as WorldApi } from "./World"
import { OverlayApi as OverlayApi } from "./Overlay"
import { JetLagManager } from "../JetLagManager"
import { NavigationApi as NavigationApi } from "./Navigation"
import { JetLagKeys } from "../support/Interfaces";
import { JetLagStage } from "../JetLagStage";
import { ProjectileApi } from "./Projectile"
import { TimedEvent } from "../support/TimedEvent";

/**
 * ImageConfig wraps all of the basic configuration for a non-actor image.  It
 * consists of the following mandatory fields:
 * - x and y: for the coordinates of the top-left corner
 * - width and height: for the dimensions of the image
 * - img: the name of the image file to use for this image
 *
 * It also provides the following optional fields:
 * - z: the z index of the image (-2, -1, 0, 1, or 2).  If none is provided, 0
 *   will be used.
 */
export class ImageConfig {
    /** X coordinate of the top left corner */
    x = 0;
    /** Y coordinate of the top left corner */
    y = 0;
    /** Width of the image */
    width = 0;
    /** Height of the image */
    height = 0;
    /** The name of the image to use for this actor */
    img?= "";
    /** Z index of the image */
    z?= 0;
}

/**
 * TextConfig wraps all of the basic configuration for text on the screen.  It
 * consists of the following mandatory fields:
 * - x and y: for the coordinates of either the top-left corner (default), or
 *   the center of the image (when the optional 'center' field is true)
 * - face, color, and size: for configuring the font to use.  Note that color
 *   should be an HTML hex code, e.g., "#FF0000"
 * - producer: a function that makes the text to display
 *
 * It also provides the following optional fields:
 * - z: the z index of the text (-2, -1, 0, 1, or 2).  If none is provided, 0
 *   will be used
 * - center: true if the X and Y coordinates should be for the center of the
 *   text, false (or not provided) if the X and Y coordinates should be for the
 *   top left corner of the text.
 */
export class TextConfig {
    /** X coordinate of the top left corner or center*/
    x = 0;
    /** Y coordinate of the top left corner or center */
    y = 0;
    /** Should the text be centered at X,Y (true) or is (X,Y) top-left (false) */
    center?= false;
    /** Font to use */
    face = "Arial";
    /** Color for the text */
    color = "#FFFFFF";
    /** Font size */
    size = 22;
    /** A function that produces the text to display */
    producer: () => string = () => { return "" };
    /** Z index of the text */
    z?= 0;
}

/**
 * Check an ImageConfig object, and set default values for optional fields
 * 
 * @param c The ImageConfig object to check
 */
export function checkImageConfig(c: ImageConfig) {
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
    if (!c.img) c.img = "";
}

/**
 * Check a TextConfig object, and set default values for optional fields
 * 
 * @param c The TextConfig object to check
 */
export function checkTextConfig(c: TextConfig) {
    if (!c.center) c.center = false;
    if (!c.z) c.z = 0;
    if (c.z < -2) c.z = -2;
    if (c.z > 2) c.z = 2;
}

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
     * Use this to determine if the game is muted or not. True corresponds to
     * not muted, false corresponds to muted.
     */
    public getVolume() {
        return this.stage.device.getStorage().getPersistent("volume", "1") === "1";
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
     * Set a behavior to happen when a key is downpressed
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
     * @param musicName Name of the music file to play.  Remember: this file must
     *                  have been registered as Music, not as a Sound
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
        this.stage.getWorld().timer.addEvent(new TimedEvent(interval, repeat, action));
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