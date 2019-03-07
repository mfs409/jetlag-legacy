import { JetLagConfig, JetLagVerbosity } from "../jetlag/support/JetLagConfig"
import { buildChooserScreen } from "./Chooser"
import { buildLevelScreen } from "./Levels";
import { buildStoreScreen } from "./Store";
import { buildHelpScreen } from "./Help";
import { buildSplashScreen } from "./Splash";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
export class GameConfig extends JetLagConfig {
  /**
   * The GameConfig object is used to pass configuration information to the
   * JetLag system.
   *
   * To see documentation for any of these variables, hover your mouse over the
   * word on the left side of the equals sign.
   */
  constructor() {
    super(); // Always start with this line

    // The size of the screen, and some game behavior configuration
    this.screenWidth = 1600;
    this.screenHeight = 900;
    this.adaptToScreenSize = true;
    this.pixelMeterRatio = 100;
    this.canVibrate = true;
    this.debugMode = true;
    this.forceAccelerometerOff = true;
    this.verbosity = JetLagVerbosity.LOUD;

    // Chooser configuration
    this.numLevels = 1;
    this.enableChooser = false;
    this.storageKey = "jetlag.outreach.prefs";

    // Set up the resource prefix
    this.resourcePrefix = "./assets/";

    // list the images that the game will use
    this.imageNames = [
      "audio_off.png", "audio_on.png", "splash.png", "board.png", "bottom.png",
      "bottom_mini.png",
      "walker1.png", "walker2.png", "walker3.png", "walker4.png",
      "jumper1.png", "jumper2.png", "jumper3.png", "jumper4.png",
      "pause.png", "book.png", "bricks.png", "trampoline.png", "flag.png"
    ];

    // list the sound effects that the game will use
    this.soundNames = ["win.mp3", "lose.mp3", "jump.mp3", "goodie.mp3",];

    // list the background music files that the game will use
    this.musicNames = ["tune.ogg",];

    // don't change these lines unless you know what you are doing
    this.levelBuilder = buildLevelScreen;
    this.chooserBuilder = buildChooserScreen;
    this.helpBuilder = buildHelpScreen;
    this.splashBuilder = buildSplashScreen;
    this.storeBuilder = buildStoreScreen;
  }
}