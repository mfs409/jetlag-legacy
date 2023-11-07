// Last review: 08-10-2023

import { Actor } from "../jetlag/Entities/Actor";
import { ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import * as Helpers from "./helpers";
import { game } from "../jetlag/Stage";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { InertMovement } from "../jetlag/Components/Movement";
import { Passive } from "../jetlag/Components/Role";

/**
 * buildChooserScreen draws the level chooser screens.
 *
 * Since we have 90 demo levels, and we show 24 levels per screen, our chooser
 * will have 4 screens.
 *
 * @param index Which screen of the chooser should be displayed
 */
export function buildChooserScreen(index: number) {
  // By default, we have a level that is 1600x900 pixels (16x9 meters), with
  // no default gravitational forces

  // This line ensures that, no matter what level we draw, the ESCAPE key is
  // configured to go back to the Splash
  game.keyboard.setKeyUpHandler(KeyCodes.ESCAPE, () => { game.switchTo(game.config.splashBuilder, 1); });

  // screen 1: show levels 1 --> 24
  //
  // When you need maximum control, this style of code is best: you can
  // individually place each button exactly where you want it.
  if (index == 1) {
    // set up background and music
    Helpers.setMusic("tune.ogg");
    new Actor({
      scene: game.world,
      appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "chooser.png" }),
      rigidBody: RigidBodyComponent.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, game.world, { collisionsEnabled: false }),
      movement: new InertMovement(),
      role: new Passive(),
    });

    // We'll have margins of 1.25 on the left and right, a margin of 1 on
    // the bottom, and three rows of eight buttons each, with each button
    // 1.25x1.25 meters, and .5 meters between buttons
    drawLevelButton(1.25, 3.25, 1.25, 1.25, 1);
    drawLevelButton(3.0, 3.25, 1.25, 1.25, 2);
    drawLevelButton(4.75, 3.25, 1.25, 1.25, 3);
    drawLevelButton(6.5, 3.25, 1.25, 1.25, 4);
    drawLevelButton(8.25, 3.25, 1.25, 1.25, 5);
    drawLevelButton(10.0, 3.25, 1.25, 1.25, 6);
    drawLevelButton(11.75, 3.25, 1.25, 1.25, 7);
    drawLevelButton(13.5, 3.25, 1.25, 1.25, 8);

    drawLevelButton(1.25, 5, 1.25, 1.25, 9);
    drawLevelButton(3.0, 5, 1.25, 1.25, 10);
    drawLevelButton(4.75, 5, 1.25, 1.25, 11);
    drawLevelButton(6.5, 5, 1.25, 1.25, 12);
    drawLevelButton(8.25, 5, 1.25, 1.25, 13);
    drawLevelButton(10.0, 5, 1.25, 1.25, 14);
    drawLevelButton(11.75, 5, 1.25, 1.25, 15);
    drawLevelButton(13.5, 5, 1.25, 1.25, 16);

    drawLevelButton(1.25, 6.75, 1.25, 1.25, 17);
    drawLevelButton(3.0, 6.75, 1.25, 1.25, 18);
    drawLevelButton(4.75, 6.75, 1.25, 1.25, 19);
    drawLevelButton(6.5, 6.75, 1.25, 1.25, 20);
    drawLevelButton(8.25, 6.75, 1.25, 1.25, 21);
    drawLevelButton(10.0, 6.75, 1.25, 1.25, 22);
    drawLevelButton(11.75, 6.75, 1.25, 1.25, 23);
    drawLevelButton(13.5, 6.75, 1.25, 1.25, 24);

    // draw the navigation buttons
    drawNextButton(15, 5.125, 1, 1, 2);
    drawSplashButton(15, 8, 1, 1);
  }
  // Of course, if we don't need all that control, we can leverage the structure
  // that we're trying to achieve, and we can write a lot less code.  This block
  // does everything for screens 2, 3, and 4!
  else {
    // set up background and music
    Helpers.setMusic("tune.ogg");
    new Actor({
      scene: game.world,
      appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "chooser.png" }),
      rigidBody: RigidBodyComponent.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, game.world, { collisionsEnabled: false }),
      movement: new InertMovement(),
      role: new Passive(),
    });
    for (let row = 0, y = 3.25, l = 24 * (index - 1) + 1; row < 3; ++row, y += 1.75) {
      let x = 1.25;
      for (let i = 0; i < 8; ++i, ++l, x += 1.75) {
        // Only draw a button if we're less than or equal to 90, since
        // that's our last level
        if (l <= 90) drawLevelButton(x, y, 1.25, 1.25, l);
      }
    }
    // draw the navigation buttons
    if (index < 4) drawNextButton(15, 5.125, 1, 1, index + 1);
    drawPrevButton(0, 5.125, 1, 1, index - 1);
    drawSplashButton(15, 8, 1, 1);
  }
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
  let tile = new Actor({
    scene: game.world,
    appearance: new ImageSprite(cfg),
    rigidBody: RigidBodyComponent.Box(cfg, game.world),
    movement: new InertMovement(),
    role: new Passive(),
  });

  // attach a callback and print the level number with a touchCallback, and then put text on top of it
  let tap = () => {
    console.log("tap on " + whichLevel)
    game.switchTo(game.config.levelBuilder, whichLevel); return true;
  };
  tile.gestures = { tap };
  new Actor({
    scene: game.world,
    appearance: new TextSprite({ center: true, cx: x + width / 2, cy: y + width / 2, face: "Arial", color: "#FFFFFF", size: 56, z: 0 }, () => whichLevel + ""),
    rigidBody: RigidBodyComponent.Box(cfg, game.world, { collisionsEnabled: false }),
    movement: new InertMovement(),
    role: new Passive(),
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
  let btn = new Actor({
    scene: game.world,
    appearance: img,
    rigidBody: RigidBodyComponent.Box(cfg, game.world),
    movement: new InertMovement(),
    role: new Passive(),
  });
  let tap = () => {
    game.switchTo(game.config.chooserBuilder, chooserLevel);
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
  let btn = new Actor({
    scene: game.world,
    appearance: img,
    rigidBody: RigidBodyComponent.Box(cfg, game.world),
    movement: new InertMovement(),
    role: new Passive(),
  });
  let tap = () => {
    game.switchTo(game.config.chooserBuilder, chooserLevel);
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
  let btn = new Actor({
    scene: game.world,
    appearance: img,
    rigidBody: RigidBodyComponent.Box(cfg, game.world),
    movement: new InertMovement(),
    role: new Passive(),
  });
  let tap = () => {
    game.switchTo(game.config.splashBuilder, 1);
    return true;
  };
  btn.gestures = { tap };
}