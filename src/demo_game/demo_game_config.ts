import { buildSplashScreen } from "./Splash";
import { GameConfig } from "../jetlag/Config";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
export class DemoGameConfig implements GameConfig {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "com.me.my_jetlag_game.storage";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  You'll
  // probably want to delete these files from the assets folder, remove them
  // from these lists, and add your own.
  resourcePrefix = "./assets/";
  musicNames = ["tune.ogg"];
  soundNames = ["high_pitch.ogg", "low_pitch.ogg", "lose_sound.ogg", "win_sound.ogg", "slow_down.ogg", "woo_woo_woo.ogg", "flap_flap.ogg"];
  // We use spritesheets to reduce the amount of loading...
  imageNames = [
    "sprites.json", "alien.json", "lizard.json", "back.png", "mid.png", "noise.png",
  ];

  // The name of the function that builds the initial screen of the game
  gameBuilder = buildSplashScreen;
}
