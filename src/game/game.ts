import { initializeAndLaunch } from "../jetlag/Stage";
import { GameConfig } from "../jetlag/Config";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/Grid";
import { FilledBox, FilledCircle, FilledPolygon } from "../jetlag/Components/Appearance";

/**
 * A single place for storing screen dimensions and other game configuration, as
 * well as the names of all the assets (images and sounds) used by this game.
 */
export class Config implements GameConfig {
  // If your game is in landscape mode, it's very unlikely that you'll want to
  // change these next values. Hover over them to see what they mean.  If your
  // game is in portrait mode, you probably will want to swap the width and
  // height.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  canVibrate = true;            // Turn off except for some mobile games
  forceAccelerometerOff = true; // Turn on except for some mobile games
  storageKey = "--no-key--";    // This needs to be globally unique to your game
  hitBoxes = true;              // Turn off before deploying!

  resourcePrefix = "./assets/"; // All sounds and images go in this subfolder
  musicNames = [];              // Audio files that you want to loop
  soundNames = [];              // Short audio files that you don't want to loop
  imageNames = [];              // All image files and sprite sheet json files

  // The name of the function that builds the initial screen of the game
  gameBuilder = game;
}


/**
 * This function draws the first scene that shows when the game starts. In our
 * case, it's a very simple "game", consisting of an interactive world that
 * cannot be won or lost.  After your game starts becoming more polished, you
 * will probably want to use several functions like this one as a way to
 * organize the parts of your game (levels, chooser, welcome screen, store,
 * etc).
 *
 * @param level Which level of the game should be displayed
 */
export function game(_level: number) {
  // Draw a grid on the screen, to help us think about the positions of actors.
  // Remember that when `hitBoxes` is true, clicking the screen will show
  // coordinates in the developer console.
  GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 16, y: 9 });

  // Make a "hero" who moves via tilt and appears as a circle
  Actor.Make({
    rigidBody: new CircleBody({ cx: 5, cy: 2, radius: .5 }, stage.world),
    appearance: new FilledCircle({ radius: .5, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Hero(),
    movement: new TiltMovement(),
  })

  // Configure tilt: arrow keys will simulate gravitational force, with a
  // maximum of +- 10 in the X and Y dimensions.
  stage.tilt.tiltMax.Set(10, 10);
  // Pressing a key will induce a force, releasing will stop inducing that force
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));

  // Make an obstacle that is a rectangle
  Actor.Make({
    rigidBody: new BoxBody({ cx: 3, cy: 4, width: 1, height: 1 }, stage.world),
    appearance: new FilledBox({ width: 1, height: 1, fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Obstacle(),
  })

  // Make an obstacle that is a polygon
  Actor.Make({
    rigidBody: new PolygonBody({ cx: 10, cy: 5, vertices: [0, -.5, .5, 0, 0, .5, -1, 0] }, stage.world),
    appearance: new FilledPolygon({ vertices: [0, -.5, .5, 0, 0, .5, -1, 0], fillColor: "#ff0000", lineWidth: 4, lineColor: "#00ff00" }),
    role: new Obstacle(),
  })
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config());
