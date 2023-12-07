import { Actor } from "../jetlag/Entities/Actor";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { stage } from "../jetlag/Stage";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { buildSplashScreen } from "./Splash";
import { buildLevelScreen } from "./Levels";
import { MusicComponent } from "../jetlag/Components/Music";

/**
 * buildChooserScreen draws the level chooser screens.
 *
 * Since we have 92 demo levels, and we show 24 levels per screen, our chooser
 * will have 4 screens.
 *
 * @param index Which screen of the chooser should be displayed
 */
export function buildChooserScreen(index: number) {
  // By default, we have a level that is 1600x900 pixels (16x9 meters), with
  // no default gravitational forces

  // This line ensures that, no matter what level we draw, the ESCAPE key is
  // configured to go back to the Splash
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_ESCAPE, () => { stage.switchTo(buildSplashScreen, 1); });

  // start the music
  stage.levelMusic = new MusicComponent(stage.musicLibrary.getMusic("tune.ogg"));

  // Paint the background white
  stage.backgroundColor = "#FFFFFF";

  // Draw a brown box at the top of the screen, put some text in it
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: 2.3, fillColor: "#523216" }),
    rigidBody: new BoxBody({ cx: 8, cy: 1.15, width: 16, height: 2.3 }, stage.world, { collisionsEnabled: false }),
  });
  Actor.Make({
    appearance: new TextSprite({ center: true, face: "Arial", size: 120, color: "#FFFFFF" }, "Choose a Level"),
    rigidBody: new BoxBody({ cx: 8, cy: 1.15, width: .1, height: .1 }),
  });

  // We'll have margins of 1.25 on the left and right, a margin of 1 on
  // the bottom, and three rows of eight buttons each, with each button
  // 1.25x1.25 meters, and .5 meters between buttons

  for (let row = 0, y = 3.25, l = 24 * (index - 1) + 1; row < 3; ++row, y += 1.75) {
    let x = 1.25;
    for (let i = 0; i < 8; ++i, ++l, x += 1.75) {
      // Only draw a button if we're less than or equal to 90, since
      // that's our last level
      if (l <= 92) drawLevelButton(x, y, 1.25, 1.25, l);
    }
  }
  // draw the navigation buttons
  if (index < 4) drawNextButton(15, 5.125, 1, 1, index + 1);
  if (index > 1) drawPrevButton(0, 5.125, 1, 1, index - 1);
  drawSplashButton(15, 8, 1, 1);
}

/**
 * This is a helper function for drawing a level button.  The player can tap the
 * button to start a level.
 *
 * @param x           X coordinate of the top left corner of the button
 * @param y           Y coordinate of the top left corner of the button
 * @param width       width of the button
 * @param height      height of the button
 * @param whichLevel  which level to play when the button is tapped
 */
function drawLevelButton(x: number, y: number, width: number, height: number, whichLevel: number) {
  // for each button, start by drawing an obstacle
  let cfg = { cx: x + width / 2, cy: y + height / 2, width: width, height: height, img: "level_tile.png" };
  let tile = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg, stage.world),
  });

  // attach a callback and print the level number with a touchCallback, and then put text on top of it
  let tap = () => {
    stage.switchTo(buildLevelScreen, whichLevel); return true;
  };
  tile.gestures = { tap };
  Actor.Make({
    appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 56, z: 0 }, () => whichLevel + ""),
    rigidBody: new BoxBody(cfg, stage.world, { collisionsEnabled: false }),
  });
}

/**
 * This helper function is for drawing the button that takes us to the previous chooser screen
 *
 * @param x            X coordinate of top left corner of the button
 * @param y            Y coordinate of top left corner of the button
 * @param width        width of the button
 * @param height       height of the button
 * @param chooserLevel The chooser screen to create
 */
function drawPrevButton(x: number, y: number, width: number, height: number, chooserLevel: number) {
  let cfg = { cx: x + width / 2, cy: y + height / 2, width: width, height: height, img: "left_arrow.png" };
  let img = new ImageSprite(cfg);
  let btn = Actor.Make({
    appearance: img,
    rigidBody: new BoxBody(cfg, stage.world),
  });
  let tap = () => {
    stage.switchTo(buildChooserScreen, chooserLevel);
    return true;
  };
  btn.gestures = { tap };
}

/**
 * This helper function is for drawing the button that takes us to the next chooser screen
 *
 * @param x            X coordinate of top left corner of the button
 * @param y            Y coordinate of top left corner of the button
 * @param width        width of the button
 * @param height       height of the button
 * @param chooserLevel The chooser screen to create
 */
function drawNextButton(x: number, y: number, width: number, height: number, chooserLevel: number) {
  let cfg = { cx: x + width / 2, cy: y + height / 2, width: width, height: height, img: "right_arrow.png" };
  let img = new ImageSprite(cfg);
  let btn = Actor.Make({
    appearance: img,
    rigidBody: new BoxBody(cfg, stage.world),
  });
  let tap = () => {
    stage.switchTo(buildChooserScreen, chooserLevel);
    return true;
  };
  btn.gestures = { tap };
}

/**
 * This helper function is for drawing the button that takes us back to the splash screen
 *
 * @param x      X coordinate of top left corner of the button
 * @param y      Y coordinate of top left corner of the button
 * @param width  width of the button
 * @param height height of the button
 */
function drawSplashButton(x: number, y: number, width: number, height: number) {
  let cfg = { box: true, cx: x + width / 2, cy: y + height / 2, width: width, height: height, img: "back_arrow.png" };
  let img = new ImageSprite(cfg);
  let btn = Actor.Make({
    appearance: img,
    rigidBody: new BoxBody(cfg, stage.world),
  });
  let tap = () => {
    stage.switchTo(buildSplashScreen, 1);
    return true;
  };
  btn.gestures = { tap };
}