import { JetLagManager } from "../JetLagManager"
import { WorldScene } from "./WorldScene"
import { OverlayScene } from "./OverlayScene"
import { OverlayApi } from "../api/OverlayApi"
import { ParallaxScene } from "./ParallaxScene"
import { Score } from "../misc/Score"
import { Hero } from "../renderables/Hero"
import { Goodie } from "../renderables/Goodie"
import { Enemy } from "../renderables/Enemy"
import { Logger } from "../misc/Logger";
import { JetLagRenderer } from "../misc/JetLagDevice";

/**
 * Stage is a fully interactive portion of the game.  It has several scenes, 
 * of which more than one may be active at a time.
 */
export class Stage {
    /** The top-level StageManager, with access to all device features */
    private stageManager: JetLagManager;

    /** The physics world in which all actors exist */
    world: WorldScene;

    /** A heads-up display */
    hud: OverlayScene;

    /** Any pause, win, or lose scene that supercedes the world and hud */
    overlay: OverlayScene;

    /** Should gestures route to the HUD first, or to the WORLD first? */
    gestureHudFirst = true;

    /** Background color for the stage being drawn; defaults to black */
    backgroundColor = 0xFFFFFF;

    /** The function for creating this level's pre-scene */
    welcomeSceneBuilder: (overlay: OverlayApi) => void = null;

    /** The function for creating this level's win scene */
    winSceneBuilder: (overlay: OverlayApi) => void = null;

    /** The function for creating this level's lose scene */
    loseSceneBuilder: (overlay: OverlayApi) => void = null;

    /** The function for creating this level's pause scene */
    pauseSceneBuilder: (overlay: OverlayApi) => void = null;

    /** Track all the scores */
    score: Score = new Score();

    /** Text to display when a Lose Countdown completes */
    loseCountdownText: string;

    /** Text to display when a Win Countdown completes */
    winCountdownText: string;

    /** The background layers */
    background: ParallaxScene;

    /** The foreground layers */
    foreground: ParallaxScene;

    /**
     * Construct the LolManager, build the scenes, set up the state machine, and clear the scores.
     *
     * @param manager The top-level StageManager
     */
    constructor(manager: JetLagManager) {
        this.stageManager = manager;
        // build scenes and facts
        this.createScenes();
        this.resetScores();
    }

    /**
     * Handle a TAP event
     * 
     * @param screenX The x coordinate of the tap, in pixels
     * @param screenY The y coordinate of the tap, in pixels
     */
    tap(screenX: number, screenY: number) {
        // If we have an overlay scene right now, let it handle the tap
        if (this.overlay != null) {
            this.overlay.tap(screenX, screenY);
            return;
        }

        if (this.stageManager.config.debugMode) {
            let worldcoord = this.world.camera.screenToMeters(screenX, screenY);
            let hudcoord = this.hud.camera.screenToMeters(screenX, screenY);
            Logger.info("World Touch: (" + worldcoord.x + ", " + worldcoord.y + ")");
            Logger.info("HUD Touch: (" + hudcoord.x + ", " + hudcoord.y + ")");
        }
        if (this.gestureHudFirst) {
            if (this.hud.tap(screenX, screenY))
                return;
            else
                this.world.tap(screenX, screenY);
        }
        else {
            if (this.world.tap(screenX, screenY))
                return;
            else
                this.hud.tap(screenX, screenY);
        }
    }

    /** 
     * Handle the start of a pan
     */
    panStart(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.panStart(screenX, screenY);
            return;
        }
        this.hud.panStart(screenX, screenY);
    }

    /** 
     * Handle pan move
     */
    panMove(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.panMove(screenX, screenY);
            return;
        }
        this.hud.panMove(screenX, screenY);
    }

    /** 
     * Handle the end of a pan
     */
    panStop(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.panStop(screenX, screenY);
            return;
        }
        this.hud.panStop(screenX, screenY);
    }

    /** 
     * Handle a touch down event
     */
    touchDown(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.touchDown(screenX, screenY);
            return;
        }
        this.hud.touchDown(screenX, screenY);
    }

    /** 
     * Handle when a touch ends (is released)
     */
    touchUp(screenX: number, screenY: number) {
        if (this.overlay != null) {
            this.overlay.touchUp(screenX, screenY);
            return;
        }
        this.hud.touchUp(screenX, screenY);
    }

    /** 
     * Handle swipe events
     */
    swipe(screenX0: number, screenY0: number, screenX1: number, screenY1: number, time: number) {
        this.hud.swipe(screenX0, screenY0, screenX1, screenY1, time);
    }

    /**
     * Create all scenes for a playable level.
     */
    private createScenes(): void {
        // Create the main scene and hud
        this.world = new WorldScene(this.stageManager);
        this.hud = new OverlayScene(this.stageManager);
        // Set up the parallax scenes
        this.background = new ParallaxScene(this.stageManager);
        this.foreground = new ParallaxScene(this.stageManager);
    }

    /** 
     * Hide the current overlay scene that is showing
     */
    clearOverlayScene() {
        this.overlay = null;
    }

    /**
     * This code is called every 1/45th of a second to update the game state and re-draw the screen
     * 
     * @param elapsedTime The milliseconds since the previous render
     */
    render(renderer: JetLagRenderer, elapsedTime: number) {
        // Handle pauses due to pre, pause, or post scenes.  Note that these handle their own screen
        // touches, and that win and lose scenes should come first.
        if (this.welcomeSceneBuilder) {
            this.overlay = new OverlayScene(this.stageManager);
            this.welcomeSceneBuilder(new OverlayApi(this.overlay));
            this.welcomeSceneBuilder = null;
        }
        if (this.pauseSceneBuilder) {
            this.overlay = new OverlayScene(this.stageManager);
            this.pauseSceneBuilder(new OverlayApi(this.overlay));
            this.pauseSceneBuilder = null;
        }
        if (this.overlay) {
            this.overlay.render(renderer, elapsedTime);
            return;
        }

        renderer.setFrameColor(this.backgroundColor);

        // Make sure the music is playing... Note that we start music before the PreScene shows
        this.world.playMusic();

        // Update the win/lose timers
        // Check the countdown timers
        if (this.score.mLoseCountDownRemaining != -100) {
            this.score.mLoseCountDownRemaining -= elapsedTime / 1000;
            if (this.score.mLoseCountDownRemaining < 0) {
                this.endLevel(false);
            }
        }
        if (this.score.mWinCountRemaining != -100) {
            this.score.mWinCountRemaining -= elapsedTime / 1000;
            if (this.score.mWinCountRemaining < 0) {
                // TODO:
                this.endLevel(true);
            }
        }
        if (this.score.mStopWatchProgress != -100) {
            this.score.mStopWatchProgress += elapsedTime / 1000;
        }

        // handle accelerometer stuff... note that accelerometer is effectively disabled during a
        // popup... we could change that by moving this to the top, but that's probably not going to
        // produce logical behavior
        this.world.handleTilt(this.stageManager.device.getAccelerometer().get().x, this.stageManager.device.getAccelerometer().get().y);

        // Advance the physics world by 1/45 of a second.
        //
        // NB: in Box2d, This is the recommended rate for phones, though it seems like we should be
        //     using /elapsedTime/ instead of 1/45f
        this.world.world.Step(1 / 45, 8, 3);

        // Execute any one time events, then clear the list
        for (let e of this.world.oneTimeEvents)
            e();
        this.world.oneTimeEvents.length = 0;

        // handle repeat events
        for (let e of this.world.repeatEvents)
            e();

        // Determine the center of the camera's focus
        this.world.adjustCamera();

        // The world is now static for this time step... we can display it!
        // draw parallax backgrounds
        this.background.render(renderer, this.world.camera, elapsedTime);
        // draw the world
        this.world.render(renderer, elapsedTime);
        // draw parallax foregrounds
        this.foreground.render(renderer, this.world.camera, elapsedTime);
        // draw Controls
        this.hud.render(renderer, elapsedTime);
    }

    /**
     * Reset all scores.  This should be called at the beginning of every level.
     */
    resetScores(): void {
        this.score.reset();
        this.loseCountdownText = "";
        this.winCountdownText = "";
        this.stageManager.device.getStorage().clearLevelFacts();
    }

    /**
     * Before we call programmer code to load a new scene, we call this to ensure that everything is
     * in a clean state.
     */
    onScreenChange(): void {
        this.world.stopMusic();
        this.resetScores();

        // Reset default values
        this.gestureHudFirst = true;
        this.backgroundColor = 0xFFFFFF;
        this.welcomeSceneBuilder = null;
        this.winSceneBuilder = null;
        this.loseSceneBuilder = null;
        this.pauseSceneBuilder = null;

        this.world.pauseMusic();
        this.createScenes();
    }

    /**
     * Indicate that a hero has been defeated
     *
     * @param enemy The enemy who defeated the hero
     */
    defeatHero(enemy: Enemy, hero: Hero): void {
        this.score.mHeroesDefeated++;
        if (this.score.mHeroesDefeated == this.score.mHeroesCreated) {
            if (enemy.onDefeatHero)
                enemy.onDefeatHero(enemy, hero);
            this.endLevel(false);
        }
    }

    /**
    * Indicate that a goodie has been collected
    *
    * @param goodie The goodie that was collected
    */
    onGoodieCollected(goodie: Goodie): void {
        if (this.score.onGoodieCollected(goodie))
            this.endLevel(true);
    }

    /**
     * Indicate that a hero has reached a destination
     */
    onDestinationArrive(): void {
        if (this.score.onDestinationArrive())
            this.endLevel(true);
    }

    /**
     * Indicate that an enemy has been defeated
     */
    onDefeatEnemy(): void {
        if (this.score.onEnemyDefeated()) {
            this.endLevel(true);
        }
    }

    /**
     * Returns number of enemies defeated
     */
    getEnemiesDefeated(): number {
        return this.score.mEnemiesDefeated;
    }

    /**
     * When a level ends, we run this code to shut it down, print a message, and
     * then let the user resume play
     *
     * @param win true if the level was won, false otherwise
     */
    endLevel(win: boolean): void {
        if (win) {
            if (this.winSceneBuilder) {
                this.overlay = new OverlayScene(this.stageManager);
                this.winSceneBuilder(new OverlayApi(this.overlay));
                this.winSceneBuilder = null;
            }
            else {
                this.stageManager.advanceLevel();
            }
        }
        else {
            if (this.loseSceneBuilder) {
                this.overlay = new OverlayScene(this.stageManager);
                this.loseSceneBuilder(new OverlayApi(this.overlay));
                this.loseSceneBuilder = null;
            }
            else {
                this.stageManager.repeatLevel();
            }
        }
    }

}