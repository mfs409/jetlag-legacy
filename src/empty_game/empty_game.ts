import { initializeAndLaunch } from "../jetlag/Stage";
import { Config } from "../jetlag/Config";

/**
 * A single place for storing screen dimensions and other game configuration, as
 * well as the names of all the assets (images and sounds) used by this game.
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
  musicNames = [];
  soundNames = [];
  imageNames = [];

  // The name of the function that builds the initial screen of the game
  gameBuilder = build_game;
}

import { FilledSprite } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/GridSystem";

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

  stage.tilt.tiltMax.Set(10, 10);
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));

  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
  stage.tilt.tiltVelocityOverride = false;

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
