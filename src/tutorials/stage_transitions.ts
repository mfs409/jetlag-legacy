import { JetLagGameConfig } from "../jetlag/Config";
import { AccelerometerMode } from "../jetlag/Services/Accelerometer";
import { initializeAndLaunch } from "../jetlag/Stage";
import { splashBuilder } from "./stage_transitions_splash";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true;
    canVibrate = true;
    accelerometerMode = AccelerometerMode.DISABLED;
    storageKey = "--no-key--";
    hitBoxes = true;
    resourcePrefix = "./assets/";
    musicNames = ["tune.ogg", "tune2.ogg"];
    soundNames = ["high_pitch.ogg", "low_pitch.ogg", "lose_sound.ogg", "win_sound.ogg", "slow_down.ogg", "woo_woo_woo.ogg", "flap_flap.ogg"];
    imageNames = ["sprites.json", "back.png", "mid.png", "noise.png"];
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), splashBuilder);