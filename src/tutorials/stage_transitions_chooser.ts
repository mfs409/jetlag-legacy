import { Actor } from "../jetlag/Entities/Actor";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { stage } from "../jetlag/Stage";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { splashBuilder } from "./stage_transitions_splash";
import { gameBuilder } from "./stage_transitions_game";
import { MusicComponent } from "../jetlag/Components/Music";

/**
 * buildChooserScreen draws the level chooser screens.
 *
 * Since we have 9 levels, and we show 4 levels per screen, our chooser
 * will have 3 screens.
 *
 * @param level Which screen of the chooser should be displayed
 */
export function chooserBuilder(level: number) {
  // start the chooser music, pause the game music
  stage.levelMusic = new MusicComponent(stage.musicLibrary.getMusic("tune.ogg"));
  stage.gameMusic?.pause();

  // Paint the background white
  stage.backgroundColor = "#FFFFFF";

  // Draw a brown box at the top of the screen, put some text in it
  new Actor({
    appearance: new FilledBox({ width: 16, height: 2.3, fillColor: "#523216" }),
    rigidBody: new BoxBody({ cx: 8, cy: 1.15, width: 16, height: 2.3 }, { collisionsEnabled: false }),
  });
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", size: 120, color: "#FFFFFF" }, "Choose a Level"),
    rigidBody: new BoxBody({ cx: 8, cy: 1.15, width: .1, height: .1 }),
  });

  // Draw some buttons, based on which chooser "level" we're on
  if (level == 1) {
    // Levels 1-4
    drawLevelButton(5, 4, 1);
    drawLevelButton(11, 4, 2);
    drawLevelButton(5, 7, 3);
    drawLevelButton(11, 7, 4);
  }

  else if (level == 2) {
    // Levels 5-8
    drawLevelButton(5, 4, 5);
    drawLevelButton(11, 4, 6);
    drawLevelButton(5, 7, 7);
    drawLevelButton(11, 7, 8);
  }

  else {
    // Level 9
    drawLevelButton(8, 5.5, 9);
  }

  // Add a button for going to the next chooser screen, but only if this isn't
  // the last chooser screen
  if (level < 3) {
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "right_arrow.png" }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: 15.5, cy: 5.625 }),
      gestures: { tap: () => { stage.switchTo(chooserBuilder, level + 1); return true; } }
    });
  }
  // Add a button for going to the previous chooser screen, but only if this
  // isn't the first chooser screen
  if (level > 1) {
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "left_arrow.png" }),
      rigidBody: new BoxBody({ width: 1, height: 1, cx: .5, cy: 5.625 }),
      gestures: { tap: () => { stage.switchTo(chooserBuilder, level - 1); return true; } }
    });
  }

  // Add a button for returning to the splash screen
  new Actor({
    appearance: new ImageSprite({ width: 1, height: 1, img: "back_arrow.png" }),
    rigidBody: new BoxBody({ width: 1, height: 1, cx: 15.5, cy: 8.5 }),
    gestures: { tap: () => { stage.switchTo(splashBuilder, 1); return true; } }
  });
}

/**
 * Draw a button for that jumps to a level when tapped
 *
 * @param cx    X coordinate of the center of the button
 * @param cy    Y coordinate of the center of the button
 * @param level which level to play when the button is tapped
 */
function drawLevelButton(cx: number, cy: number, level: number) {
  // Drawing a tile.  Touching it goes to a level.
  new Actor({
    appearance: new ImageSprite({ width: 2, height: 2, img: "level_tile.png" }),
    rigidBody: new BoxBody({ cx, cy, width: 2, height: 2 }),
    gestures: { tap: () => { stage.switchTo(gameBuilder, level); return true; } }
  });
  // Put some text over it
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 56, z: 0 }, () => level + ""),
    rigidBody: new BoxBody({ cx, cy, width: .1, height: .1 }),
  });
}
