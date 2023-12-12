import { JetLagGameConfig } from "../jetlag/Config";
import { initializeAndLaunch } from "../jetlag/Stage";
import { splashBuilder } from "./stage_transitions_splash";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
    // It's very unlikely that you'll want to change these next four values.
    // Hover over them to see what they mean.
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true;

    // When you deploy your game, you'll want to change all of these
    canVibrate = true;
    forceAccelerometerOff = true;
    storageKey = "--no-key--";
    hitBoxes = true;

    // Here's where we name all the images/sounds/background music files.  You'll
    // probably want to delete these files from the assets folder, remove them
    // from these lists, and add your own.
    resourcePrefix = "./assets/";
    musicNames = ["tune.ogg", "tune2.ogg"];
    soundNames = ["high_pitch.ogg", "low_pitch.ogg", "lose_sound.ogg", "win_sound.ogg", "slow_down.ogg", "woo_woo_woo.ogg", "flap_flap.ogg"];
    // We use spritesheets to reduce the amount of loading...
    imageNames = [
        "sprites.json", "back.png", "mid.png", "noise.png",
    ];
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), splashBuilder);