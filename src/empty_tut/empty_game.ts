// TODO: Populate this with instructions on how to get started making a tutorial

import { initializeAndLaunch } from "../jetlag/Stage";
import { Config } from "../jetlag/Config";
import { FilledSprite } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/GridSystem";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
export class EmptyGameConfig implements Config {
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
  imageNames = [
    "grid.png",
    // The non-animated actors in the game
    "green_ball.png", "mustard_ball.png", "red_ball.png", "blue_ball.png", "purple_ball.png", "grey_ball.png",

    // Images that we use for buttons in the Splash and Chooser
    "left_arrow.png", "right_arrow.png", "back_arrow.png", "level_tile.png", "audio_on.png", "audio_off.png",

    // Some raw colors
    "black.png", "red.png", // TODO: stop needing these!

    // Background images for OverlayScenes
    "msg2.png", "fade.png",

    // The backgrounds for the Splash and Chooser
    "splash.png", "chooser.png",

    // Layers for Parallax backgrounds and foregrounds
    "mid.png", "front.png", "back.png",

    // The animation for a star with legs
    "leg_star_1.png", "leg_star_2.png", "leg_star_3.png", "leg_star_4.png", "leg_star_5.png", "leg_star_6.png", "leg_star_7.png", "leg_star_8.png",

    // The animation for the star with legs, with each image flipped
    "flip_leg_star_1.png", "flip_leg_star_2.png", "flip_leg_star_3.png", "flip_leg_star_4.png", "flip_leg_star_5.png", "flip_leg_star_6.png", "flip_leg_star_7.png", "flip_leg_star_8.png",

    // The flying star animation
    "fly_star_1.png", "fly_star_2.png",

    // Animation for a star that expands and then disappears
    "star_burst_1.png", "star_burst_2.png", "star_burst_3.png", "star_burst_4.png",

    // eight colored stars
    "color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png", "color_star_5.png", "color_star_6.png", "color_star_7.png", "color_star_8.png",

    // background noise, and buttons
    "noise.png", "pause.png",
  ];

  // The name of the function that builds the initial screen of the game
  gameBuilder = build_game;
}


/**
 * buildSplashScreen is used to draw the scene that we see when the game starts.
 * In our case, it's just a menu.  The splash screen is mostly just branding: it
 * usually just has a big logo and then buttons for going to the level chooser,
 * the store, and the help scenes.  On a phone, it should also have a button for
 * quitting the app.
 *
 * There is usually only one splash screen, but JetLag allows for many, so there
 * is an index parameter.  In this code, we just ignore the index.
 *
 * @param level Which splash screen should be displayed
 */
export function build_game(_level: number) {
  // Draw a grid on the screen, to help us think about the positions of actors
  GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 16, y: 9 });

  stage.world.tilt!.tiltMax.Set(10, 10);
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));

  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
  stage.world.tilt!.tiltVelocityOverride = false;

  Actor.Make({
    rigidBody: RigidBodyComponent.Box({ cx: 3, cy: 4, width: 1, height: 1 }, stage.world),
    appearance: FilledSprite.Box({ width: 1, height: 1, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Obstacle(),
  })

  Actor.Make({
    rigidBody: RigidBodyComponent.Circle({ cx: 5, cy: 2, radius: .5 }, stage.world),
    appearance: FilledSprite.Circle({ radius: .5, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Hero(),
    movement: new TiltMovement(),
  })

  Actor.Make({
    rigidBody: RigidBodyComponent.Polygon({ cx: 10, cy: 5, vertices: [0, -.5, .5, 0, 0, .5, -.5, 0], width: 1, height: 1 }, stage.world),
    appearance: FilledSprite.Polygon({ vertices: [0, -.5, .5, 0, 0, .5, -.5, 0], fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Obstacle(),
  })
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new EmptyGameConfig());