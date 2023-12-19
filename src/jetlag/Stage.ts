import { Scene } from "./Entities/Scene";
import { ParallaxSystem } from "./Systems/Parallax";
import { GestureService } from "./Services/Gesture";
import { AudioLibraryService } from "./Services/AudioLibrary";
import { MusicComponent } from "./Components/Music";
import { ScoreSystem } from "./Systems/Score";
import { JetLagGameConfig } from "./Config";
import { ConsoleService } from "./Services/Console";
import { KeyboardService } from "./Services/Keyboard";
import { RendererService } from "./Services/Renderer";

import { AccelerometerMode, AccelerometerService } from "./Services/Accelerometer";
import { StorageService } from "./Services/Storage";
import { TiltSystem } from "./Systems/Tilt";
import { AdvancedCollisionSystem, BasicCollisionSystem } from "./Systems/Collisions";
import { ImageLibraryService } from "./Services/ImageLibrary";
import { ImageSprite } from "./Components/Appearance";

/**
 * Stage is the container for all of the functionality for the playable portion
 * of a game.  Stage has several components:
 * - The world, where all the action of the game happens
 * - The heads-up display (HUD), where the user interface of the game is drawn.
 * - The Score object
 * - The background music and background color
 * - The background and foreground parallax layers
 * - The code for building, managing, and dismissing the win/lose/pause/welcome
 *   scenes
 *
 * Stage is effectively a singleton: On any transition from one stage to another
 * in the game, we don't make a new Stage object... instead we clear out the
 * existing one and reuse it.
 *
 * Stage does not manage transitions between scenes on its own. Instead, it has
 * mechanisms (onScreenChange and endLevel) for resetting itself at the
 * beginning of a stage, and cleaning itself up at the end of a stage.
 */
export class Stage {
  /** The physics world in which all actors exist */
  public world!: Scene;
  /** A heads-up display */
  public hud!: Scene;
  /** The tilt system for the stage */
  readonly tilt: TiltSystem;
  /** Any pause, win, or lose scene that supersedes the world and hud */
  public overlay?: Scene;
  /** Background color for the stage being drawn.  Defaults to white */
  public backgroundColor = "#ffffff";
  /** The background layers */
  public background!: ParallaxSystem;
  /** The foreground layers */
  public foreground!: ParallaxSystem;
  /** Everything related to music that is controlled on one level at a time */
  public levelMusic: MusicComponent | undefined;
  /** The Score, suitable for use throughout JetLag */
  readonly score = new ScoreSystem();
  /** A console device, for debug messages */
  readonly console: ConsoleService;
  /** touch controller, providing gesture inputs */
  public gestures!: GestureService;
  /** keyboard controller, providing key event inputs */
  readonly keyboard: KeyboardService;
  /** access to the the device's accelerometer */
  readonly accelerometer: AccelerometerService;
  /** rendering support, for drawing to the screen */
  readonly renderer: RendererService;
  /** A library of sound and music files */
  readonly musicLibrary: AudioLibraryService;
  /** A library of images */
  readonly imageLibrary: ImageLibraryService;
  /** Background music that doesn't stop when the level changes */
  public gameMusic: MusicComponent | undefined;
  /** Persistent storage + volatile storage for a game session and a level */
  readonly storage: StorageService;
  /** Amount to scale fonts so everything fits on the screen. */
  fontScaling = 1;
  /** The real screen width */
  screenWidth: number;
  /** The real screen height */
  screenHeight: number;
  /** The real pixel-meter ratio */
  pixelMeterRatio: number;
  /** Code to run at the end of the next render step */
  private afterRender?: () => void;

  /**
   * Request that an overlay be put on top of the game.  This is *not* the HUD.
   * It's something that goes on top of everything else, and prevents the game
   * from playing, such as a pause scene, a win/lose scene, or a welcome scene.
   *
   * @param builder           Code for creating the overlay
   * @param requestScreenshot Should the overlay delay for a cycle or two, so a
   *                          screenshot can be taken first?
   */
  public requestOverlay(builder: (overlay: Scene, screenshot?: ImageSprite) => void, requestScreenshot: boolean) {
    if (!requestScreenshot) {
      this.overlay = new Scene(this.pixelMeterRatio, new BasicCollisionSystem());
      builder(this.overlay, undefined);
      return;
    }

    // clear the last screenshot, request a new one
    if (this.renderer.mostRecentScreenShot) {
      this.renderer.mostRecentScreenShot.destroy(true);
      this.renderer.mostRecentScreenShot = undefined;
    }
    this.renderer.screenshotRequested = true;

    let action = () => {
      if (this.renderer.mostRecentScreenShot) {
        let screenshot = new ImageSprite({ width: 16, height: 9, img: "", z: -2 });
        screenshot.overrideImage(this.renderer.mostRecentScreenShot);
        this.overlay = new Scene(this.pixelMeterRatio, new BasicCollisionSystem());
        builder(this.overlay, screenshot);
        this.afterRender = undefined;
      }
      else {
        this.afterRender = action;
      }
    }
    this.afterRender = action;
  }

  /** Remove the current overlay scene, if any */
  public clearOverlay() { this.overlay = undefined; }

  /**
   * This code is called dozens of times per second to update the game state and
   * re-draw the screen
   *
   * @param elapsedMs The time in milliseconds since the previous render
   */
  public render(elapsedMs: number) {
    // If we've got an overlay, show it and do nothing more
    if (this.overlay) {
      this.overlay.physics!.world.Step(elapsedMs / 1000, { velocityIterations: 8, positionIterations: 3 });
      this.overlay.timer.advance(elapsedMs);
      this.overlay.runRendertimeEvents();
      // NB:  The timer might cancel the overlay, so we can't assume it's still
      //      valid...
      this.overlay?.camera.render(elapsedMs);
      return;
    }

    // Only set the color and play music if we don't have an overlay showing
    this.renderer.setFrameColor(this.backgroundColor as any);
    this.levelMusic?.play();

    // Update the win/lose countdown timers and the stopwatch.  This might end
    // the level.
    this.score.onClockTick(elapsedMs);

    // handle accelerometer stuff... note that accelerometer is effectively
    // disabled during an overlay... we could change that by moving this to the
    // top, but that's probably not going to produce logical behavior
    this.tilt.handleTilt();

    // Advance the physics world
    this.world.physics!.world.Step(elapsedMs / 1000, { velocityIterations: 8, positionIterations: 3 })

    // Run any pending world events, and clear one-time events
    this.world.runRendertimeEvents();

    // Determine the center of the camera's focus
    this.world.camera.adjustCamera();

    // The world is now static for this time step... we can display it!
    // Order is background, world, foreground, hud
    this.background.render(this.world.camera, elapsedMs);
    this.world.timer.advance(elapsedMs);
    this.world.camera.render(elapsedMs);
    this.renderer.applyFilter(false, false, false);
    this.foreground.render(this.world.camera, elapsedMs);

    this.hud.physics!.world.Step(elapsedMs / 1000, { velocityIterations: 8, positionIterations: 3 });
    this.hud.runRendertimeEvents();
    this.hud.timer.advance(elapsedMs);
    this.hud.camera.render(elapsedMs);

    if (this.afterRender)
      this.afterRender();
  }

  /**
   * Before we call programmer code to load a new stage, we call this to
   * ensure that everything is in a clean state.
   */
  public switchTo(builder: (index: number, stage: Stage) => void, index: number) {
    // reset music
    this.levelMusic?.stop();
    this.levelMusic = undefined;

    // reset score and storage
    this.score.reset();
    this.storage.clearLevelStorage();

    // reset keyboard and gesture handlers, since they aren't part of the world
    this.keyboard.clearHandlers();
    this.gestures.reset();

    // reset other fields to default values
    this.backgroundColor = "#ffffff";

    // Just re-make the scenes and systems, instead of clearing the old ones
    this.world = new Scene(this.pixelMeterRatio, new AdvancedCollisionSystem());
    (this.world.physics as AdvancedCollisionSystem).setScene(this.world);
    this.hud = new Scene(this.pixelMeterRatio, new BasicCollisionSystem());
    this.background = new ParallaxSystem();
    this.foreground = new ParallaxSystem();
    this.tilt.reset();

    // Now run the level
    builder(index, this);
  }

  /**
   * Set up the stage
   *
   * @param config  The game-wide configuration object
   * @param domId   The Id of the DOM element where the game exists
   * @param builder A function for building the first visible level of the game
   */
  constructor(readonly config: JetLagGameConfig, domId: string, builder: (level: number) => void) {
    this.console = new ConsoleService(config);

    this.pixelMeterRatio = config.pixelMeterRatio;
    this.screenWidth = config.screenDimensions.width;
    this.screenHeight = config.screenDimensions.height;

    // Check if the config needs to be adapted, then check for errors
    if (config.pixelMeterRatio <= 0) this.console.log("Invalid `pixelMeterRatio` in game config object");
    if (config.adaptToScreenSize) this.adjustScreenDimensions();
    if (this.screenWidth <= 0) this.console.log("`width` must be greater than zero in game config object");
    if (this.screenHeight <= 0) this.console.log("`height` must be greater than zero in game config object");

    // Configure the services
    this.storage = new StorageService();
    this.musicLibrary = new AudioLibraryService(config);
    this.keyboard = new KeyboardService();
    this.accelerometer = new AccelerometerService(AccelerometerMode.LANDSCAPE, config.forceAccelerometerOff);
    this.renderer = new RendererService(this.screenWidth, this.screenHeight, domId, this.config.hitBoxes);
    this.imageLibrary = new ImageLibraryService(config);

    // make sure the volume is reset to its old value
    this.musicLibrary.resetMusicVolume(parseInt(this.storage.getPersistent("volume") ?? "1"));

    // Configure any systems that should be running
    this.tilt = new TiltSystem;

    // For the sake of tutorials, we can do a little bit of querystring parsing
    // to override the default level
    let level = 1;
    let url = window.location.href;
    let qs_level = url.split("?")[1]; // Level from query string
    if (qs_level) {
      level = parseInt(qs_level);
      if (isNaN(level)) level = 1;
    }

    // Load the images asynchronously, then start rendering
    this.imageLibrary.loadAssets(() => {
      this.gestures = new GestureService(domId, this);
      this.switchTo(builder, level);
      this.renderer.startRenderLoop();
    });
  }

  /**
   * If the game is supposed to fill the screen, this code will change the
   * config object to maximize the div in which the game is drawn
   */
  private adjustScreenDimensions() {
    // as we compute the new screen width, height, and pixel ratio, we need
    // to be sure to remember the original ratio given in the game. JetLag
    // can't stretch differently in X than in Y, because there is only one
    // pixel/meter ratio.
    let targetRatio = this.screenWidth / this.screenHeight;
    let screen = { x: window.innerWidth, y: window.innerHeight };
    let old = { x: this.screenWidth, y: this.screenHeight };
    if (screen.y * targetRatio < screen.x) {
      // vertical is constraining
      this.screenHeight = screen.y;
      this.screenWidth = screen.y * targetRatio;
    } else {
      this.screenWidth = screen.x;
      this.screenHeight = screen.x / targetRatio;
    }
    this.pixelMeterRatio *= this.screenWidth / old.x;
    // NB: the ratio above is also the font scaling ratio
    this.fontScaling = this.screenWidth / old.x;
  }

  /**
   * Close the window to exit the game
   *
   * TODO: This probably needs special versions for Capacitor and Electron
   */
  public exit() {
    this.levelMusic?.stop();
    window.close();
  }

  /**
   * Cause the device to vibrate for a fixed number of milliseconds, or print
   * a message if the device does not support vibration
   *
   * @param ms The number of milliseconds for which to vibrate
   */
  vibrate(ms: number) {
    if (!!navigator.vibrate) navigator.vibrate(ms);
    else this.console.log("Simulating " + ms + "ms of vibrate");
  }
}

/**
 * Start a game
 *
 * @param domId   The name of the DIV into which the game should be placed
 * @param config  The game configuration object
 * @param builder A function for building the first visible level of the game
 */
export function initializeAndLaunch(domId: string, config: JetLagGameConfig, builder: (level: number) => void) {
  stage = new Stage(config, domId, builder);
}

/** A global reference to the Stage, suitable for use throughout JetLag */
export let stage: Stage;
