import { JetLagConfig } from "../jetlag/JetLagConfig"
import { buildChooserScreen } from "./Chooser"
import { buildLevelScreen } from "./Levels";
import { buildStoreScreen } from "./Store";
import { buildHelpScreen } from "./Help";
import { buildSplashScreen } from "./Splash";

/**
 * MyConfig stores things like screen dimensions, default text, font 
 * configuration, and the names of all the assets (images and sounds) used by 
 * the game.
 */
export class MyConfig extends JetLagConfig {

  /**
   * The MyConfig object is used to pass configuration information to the LOL
   * system.
   *
   * To see documentation for any of these variables, hover your mouse over the
   * word on the left side of the equals sign.
   */
  constructor() {
    // Always start with this line
    super();

    // The size of the screen, and some game behavior configuration
    this.screenWidth = 1600;
    this.screenHeight = 900;
    this.pixelMeterRatio = 100;
    this.canVibrate = true;
    this.debugMode = true;
    this.forceAccelerometerOff = true;

    // Chooser configuration
    this.numLevels = 92;
    this.enableChooser = true;
    this.storageKey = "com.me.myjetlaggame.prefs";

    // Font configuration
    this.defaultFontFace = "Arial";
    this.defaultFontSize = 32;
    this.defaultFontColor = "#FFFFFF";

    // Set up the resource prefix
    this.resourcePrefix = "/assets/";

    // list the images that the game will use
    this.imageNames = [
      // The non-animated actors in the game
      "greenball.png", "mustardball.png", "redball.png", "blueball.png",
      "purpleball.png", "greyball.png",
      // Images that we use for buttons in the Splash and Chooser
      "leftarrow.png", "rightarrow.png", "backarrow.png", "leveltile.png",
      "audio_on.png", "audio_off.png",
      // Some raw colors
      "red.png", "black.png",
      // Background images for OverlayScenes
      "msg2.png", "fade.png",
      // The backgrounds for the Splash and Chooser
      "splash.png", "chooser.png",
      // Layers for Parallax backgrounds and foregrounds
      "mid.png", "front.png", "back.png",
      // The animation for a star with legs
      "legstar1.png", "legstar2.png", "legstar3.png", "legstar4.png",
      "legstar5.png", "legstar6.png", "legstar7.png", "legstar8.png",
      // The animation for the star with legs, with each image flipped
      "fliplegstar1.png", "fliplegstar2.png", "fliplegstar3.png", "fliplegstar4.png",
      "fliplegstar5.png", "fliplegstar6.png", "fliplegstar7.png", "fliplegstar8.png",
      // The flying star animation
      "flystar1.png", "flystar2.png",
      // Animation for a star that expands and then disappears
      "starburst1.png", "starburst2.png", "starburst3.png", "starburst4.png",
      // eight colored stars
      "colorstar1.png", "colorstar2.png", "colorstar3.png", "colorstar4.png",
      "colorstar5.png", "colorstar6.png", "colorstar7.png", "colorstar8.png",
      // background noise, and buttons
      "noise.png", "pause.png"
    ];

    // list the sound effects that the game will use
    this.soundNames = [
      "hipitch.ogg", "lowpitch.ogg",
      "losesound.ogg", "winsound.ogg",
      "slowdown.ogg", "woowoowoo.ogg", "fwapfwap.ogg",
    ];

    // list the background music files that the game will use
    this.musicNames = [
      "tune.ogg"
    ];

    // don't change these lines unless you know what you are doing
    this.levelBuilder = buildLevelScreen;
    this.chooserBuilder = buildChooserScreen;
    this.helpBuilder = buildHelpScreen;
    this.splashBuilder = buildSplashScreen;
    this.storeBuilder = buildStoreScreen;
  }
}
