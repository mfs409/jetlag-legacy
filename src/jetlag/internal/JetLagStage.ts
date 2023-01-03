import { JetLagManager } from "./JetLagManager"
import { WorldScene } from "./scene/WorldScene"
import { OverlayScene } from "./scene/OverlayScene"
import { OverlayApi } from "../api/OverlayApi"
import { ParallaxScene } from "./scene/ParallaxScene"
import { Score } from "./support/Score"
import { JetLagDevice, JetLagSound, JetLagRenderer } from "./support/Interfaces";
import { JetLagConfig } from "../support/JetLagConfig";
import { ProjectilePool } from "./support/ProjectilePool";

/**
 * JetLagStage is the container for all of the functionality for the playable
 * portion of a game.  JetLagStage has several components:
 * - The WorldScene, where all the action of the game happens
 * - The heads-up display (HUD), where the user interface of the game is drawn.
 * - The Score object
 * - The background music and background color
 * - The background and foreground parallax layers
 * - The code for building, managing, and dismissing the win/lose/pause/welcome
 *   scenes
 *
 * JetLagStage is effectively a singleton: we re-use it for every stage that
 * gets displayed.
 *
 * JetLagStage is also the unit that receives all gestures, and forwards them to
 * either the hud, the world, or one of the overlay scenes.  (Note: strictly
 * speaking, the HUD is just an overlay scene.)
 *
 * JetLagStage does not manage transitions between stages on its own. Instead,
 * it has mechanisms (onScreenChange and endLevel) for resetting itself at the
 * beginning of a stage, and cleaning itself up at the end of a stage.
 */
export class JetLagStage {
    /** The physics world in which all actors exist */
    private world!: WorldScene;

    /** A heads-up display */
    private hud!: OverlayScene;

    /** Any pause, win, or lose scene that supercedes the world and hud */
    private overlay?: OverlayScene;

    /** The function for creating this level's pre-scene */
    private welcomeSceneBuilder?: (overlay: OverlayApi) => void;

    /** The function for creating this level's win scene */
    private winSceneBuilder?: (overlay: OverlayApi) => void;

    /** The function for creating this level's lose scene */
    private loseSceneBuilder?: (overlay: OverlayApi) => void;

    /** The function for creating this level's pause scene */
    private pauseSceneBuilder?: (overlay: OverlayApi) => void;

    /** 
     * Background color for the stage being drawn when no overlay. defaults to
     * black 
     */
    private backgroundColor = 0xFFFFFF;

    /** The background layers */
    private background!: ParallaxScene;

    /** The foreground layers */
    private foreground!: ParallaxScene;

    /** Track all the scores */
    public readonly score: Score;

    /** The music, if any */
    private music?: JetLagSound;

    /** Whether the music is playing or not */
    private musicPlaying = false;

    /** A pool of projectiles for use by the hero */
    private projectilePool?: ProjectilePool;

    /** Should gestures go to the HUD first, or to the WORLD first? */
    private gestureHudFirst = true;

    /**
     * Construct the JetLagStage container, into which we inject any stage we
     * ever have.
     *
     * Note that a stage is not usable until onScreenChange() has been called.
     *
     * @param manager The JetLagManager object, which transitions among stages
     * @param device  The JetLagDevice object, which abstracts away all device
     *                details
     * @param config  The JetLagConfig object, which stores all configuration
     *                for this game
     */
    constructor(private manager: JetLagManager, readonly device: JetLagDevice, readonly config: JetLagConfig) {
        this.score = new Score(this);
    }

    /** Return the projectile pool for the current stage */
    public getProjectilePool() { return this.projectilePool; }

    /** Return the main world for the current stage */
    public getWorld() { return this.world; }

    /** Return the heads-up display for the current stage */
    public getHud() { return this.hud; }

    /** Return the background layers for the current stage */
    public getBackground() { return this.background; }

    /** Return the foreground layers for the current stage */
    public getForeground() { return this.foreground; }

    /** 
     * Provide code that builds a "Welcome" overlay when the stage starts
     * 
     * @param builder A callback that builds the welcome scene
     */
    public setWelcomeSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.welcomeSceneBuilder = builder;
    }

    /** 
     * Provide code that builds a "Win" overlay when the stage is won
     * 
     * @param builder A callback that builds the win scene
     */
    public setWinSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.winSceneBuilder = builder;
    }

    /** 
     * Provide code that builds a "Lose" overlay when the stage is lost
     * 
     * @param builder A callback that builds the lose scene
     */
    public setLoseSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.loseSceneBuilder = builder;
    }

    /** 
     * Provide code that builds a "Pause" overlay on demand
     * 
     * @param builder A callback that builds the pause scene
     */
    public setPauseSceneBuilder(builder: (overlay: OverlayApi) => void) {
        this.pauseSceneBuilder = builder;
    }

    /** 
     * Control whether the HUD or World gets to process gestures first
     *
     * @param val True if the HUD should process gestures first, false if the
     *            World should
     */
    public setGestureHudFirst(val: boolean) { this.gestureHudFirst = val; }

    /** 
     * Set the background color of the stage
     *
     * @param color The numerical ("hex") value for the background color.
     *              #FFFFFF means white, #000000 means black, etc.
     */
    public setBackgroundColor(color: number) { this.backgroundColor = color; }

    /** 
     * Attach a projectile pool to the current stage
     * 
     * @param pool The projectile pool to assign to the stage
     */
    public setProjectilePool(pool: ProjectilePool) {
        this.projectilePool = pool;
    }

    /** 
     * Set the music for the stage
     * 
     * @param music The music to assign to the stage
     */
    public setMusic(music: JetLagSound) { this.music = music; }

    /**
     * Handle a TAP event
     * 
     * @param screenX The x coordinate of the tap, in pixels
     * @param screenY The y coordinate of the tap, in pixels
     */
    public tap(screenX: number, screenY: number) {
        // If we have an overlay scene right now, let it handle the tap
        if (this.overlay != null) {
            this.overlay.tap(screenX, screenY);
            return;
        }
        // Log the event?
        if (this.config.debugMode) {
            let worldcoord = this.world.getCamera().screenToMeters(screenX, screenY);
            let hudcoord = this.hud.getCamera().screenToMeters(screenX, screenY);
            this.device.getConsole().info("World Touch: (" + worldcoord.x + ", "
                + worldcoord.y + ")");
            this.device.getConsole().info("HUD Touch: (" + hudcoord.x + ", "
                + hudcoord.y + ")");
        }
        // Handle in hud or world
        if (this.gestureHudFirst) {
            if (this.hud.tap(screenX, screenY))
                return;
            this.world.tap(screenX, screenY);
        }
        else {
            if (this.world.tap(screenX, screenY))
                return;
            this.hud.tap(screenX, screenY);
        }
    }

    /**
     * Handle a PAN START event
     * 
     * @param screenX The x coordinate where the pan started, in pixels
     * @param screenY The y coordinate where the pan started, in pixels
     */
    public panStart(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.panStart(screenX, screenY);
            return;
        }
        this.hud.panStart(screenX, screenY);
    }

    /**
     * Handle a PAN MOVE event
     * 
     * @param screenX The x coordinate where the pan moved, in pixels
     * @param screenY The y coordinate where the pan moved, in pixels
     */
    public panMove(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.panMove(screenX, screenY);
            return;
        }
        this.hud.panMove(screenX, screenY);
    }

    /**
     * Handle a PAN END event
     * 
     * @param screenX The x coordinate where the pan ended, in pixels
     * @param screenY The y coordinate where the pan ended, in pixels
     */
    public panStop(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.panStop(screenX, screenY);
            return;
        }
        this.hud.panStop(screenX, screenY);
    }

    /**
     * Handle a TOUCH DOWN event.  This is a low-level event, but it's useful
     * for detecting "hold" events.
     *
     * @param screenX The x coordinate of the touch down, in pixels
     * @param screenY The y coordinate of the touch down, in pixels
     */
    public touchDown(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.touchDown(screenX, screenY);
            return;
        }
        this.hud.touchDown(screenX, screenY);
    }

    /**
     * Handle a TOUCH UP event.  This is a low-level event, but it's useful
     * for detecting "hold" events.
     *
     * @param screenX The x coordinate of the touch release, in pixels
     * @param screenY The y coordinate of the touch release, in pixels
     */
    public touchUp(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.touchUp(screenX, screenY);
            return;
        }
        this.hud.touchUp(screenX, screenY);
    }

    /**
     * Handle a SWIPE event.  This is a blocking event.
     * 
     * @param screenX0 The x coordinate where the swipe started
     * @param screenY0 The y coordinate where the swipe started
     * @param screenX1 The x coordinate where the swipe ended
     * @param screenY1 The y coordinate where the swipe ended
     * @param time The duration (in milliseconds) of the swipe
     */
    public swipe(screenX0: number, screenY0: number, screenX1: number, screenY1: number, time: number) {
        this.hud.swipe(screenX0, screenY0, screenX1, screenY1, time);
    }

    /** Hide the current overlay scene that is showing */
    public clearOverlayScene() {
        this.overlay = undefined;
    }

    /**
     * This code is called every 1/45th of a second to update the game state and
     * re-draw the screen
     *
     * @param elapsedMillis The time in milliseconds since the previous render
     */
    public render(renderer: JetLagRenderer, elapsedMillis: number) {
        renderer.initFrame();
        // Handle overlays due to pre, pause, win, or lose scenes.  Note that
        // these handle their own screen touches.
        if (this.welcomeSceneBuilder) {
            this.overlay = new OverlayScene(this.config, this.device);
            this.welcomeSceneBuilder(new OverlayApi(this, this.overlay));
            // null it out so it won't run again
            this.welcomeSceneBuilder = undefined;
        }
        if (this.pauseSceneBuilder) {
            this.overlay = new OverlayScene(this.config, this.device);
            this.pauseSceneBuilder(new OverlayApi(this, this.overlay));
            this.pauseSceneBuilder = undefined;
        }
        // NB: win and lose scenes might already be showing :)
        if (this.overlay) {
            this.overlay.render(renderer, elapsedMillis);
            renderer.showFrame();
            return;
        }

        // Only set the color and play music if we don't have an overlay showing
        renderer.setFrameColor(this.backgroundColor);
        this.playMusic();

        // Update the win/lose countdown timers and the stopwatch
        let t = this.score.onClockTick(elapsedMillis);
        if (t == -1) {
            this.endLevel(false);
        }
        if (t == 1) {
            this.endLevel(true);
        }

        // handle accelerometer stuff... note that accelerometer is effectively
        // disabled during a popup... we could change that by moving this to the
        // top, but that's probably not going to produce logical behavior
        let a = this.device.getAccelerometer().get();
        this.world.handleTilt(a.x, a.y);

        // Advance the physics world by 1/45 of a second.
        //
        // NB: in Box2d, This is the recommended rate for phones, though it
        //     seems like we should be using /elapsedTime/ instead of 1/45f
        this.world.advanceWorld(1 / 45, 8, 3);

        // Run any pending events, and clear one-time events
        this.world.runEvents();

        // Determine the center of the camera's focus
        this.world.adjustCamera();

        // The world is now static for this time step... we can display it!
        // Order is background, world, foreground, hud
        this.background.render(renderer, this.world.getCamera(), elapsedMillis);
        this.world.render(renderer, elapsedMillis);
        this.foreground.render(renderer, this.world.getCamera(), elapsedMillis);
        this.hud.render(renderer, elapsedMillis);
        renderer.showFrame();
    }

    /**
     * Before we call programmer code to load a new stage, we call this to
     * ensure that everything is in a clean state.
     */
    public onScreenChange() {
        // reset music
        this.stopMusic();
        this.music = undefined;

        // reset score
        this.score.reset();
        this.device.getStorage().clearLevelFacts();

        // reset keyboard handlers, since they aren't part of the world
        this.device.getKeyboard().clearHandlers();

        // reset other fields to default values
        this.projectilePool = undefined;
        this.gestureHudFirst = true;
        this.backgroundColor = 0xFFFFFF;
        this.welcomeSceneBuilder = undefined;
        this.winSceneBuilder = undefined;
        this.loseSceneBuilder = undefined;
        this.pauseSceneBuilder = undefined;

        // Just re-make the scenes, instead of clearing the old ones
        this.world = new WorldScene(this.config, this.device);
        this.hud = new OverlayScene(this.config, this.device);
        this.background = new ParallaxScene(this.config);
        this.foreground = new ParallaxScene(this.config);
    }

    /**
     * When a playable level ends, we run this code to shut it down, show an
     * overlay, and then invoke the JetLagManager to choose the next stage
     *
     * @param win true if the level was won, false otherwise
     */
    public endLevel(win: boolean) {
        if (win) {
            if (this.winSceneBuilder) {
                this.overlay = new OverlayScene(this.config, this.device);
                this.winSceneBuilder(new OverlayApi(this, this.overlay));
                this.winSceneBuilder = undefined;
            }
            else {
                this.manager.advanceLevel();
            }
        }
        else {
            if (this.loseSceneBuilder) {
                this.overlay = new OverlayScene(this.config, this.device);
                this.loseSceneBuilder(new OverlayApi(this, this.overlay));
                this.loseSceneBuilder = undefined;
            }
            else {
                this.manager.repeatLevel();
            }
        }
    }

    /** If the level has music attached to it, this starts playing it */
    public playMusic() {
        if (!this.musicPlaying && this.music) {
            this.musicPlaying = true;
            this.music.play();
        }
    }

    /** If the level has music attached to it, this pauses it */
    public pauseMusic() {
        if (this.musicPlaying) {
            this.musicPlaying = false;
            this.music!.stop();
        }
    }

    /** If the level has music attached to it, this stops it */
    public stopMusic() {
        if (this.musicPlaying) {
            this.musicPlaying = false;
            this.music!.stop();
        }
    }
}