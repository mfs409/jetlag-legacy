import { Actor } from "../jetlag/Entities/Actor";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { stage } from "../jetlag/Stage";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { splashBuilder } from "./stage_transitions_splash";

/**
 * helpBuilder is for drawing the help screens.  These are no different from
 * game screens... except that you probably don't want them to involve "winning"
 * and "losing". 
 *
 * In this demonstration, we just provide a bit of information about the demo
 * game, and how to get started.  This is also often a good place to put
 * credits.
 *
 * For the purposes of this demonstration, there are two Help screens.  That
 * way, we can show how to move from one to the next.
 *
 * @param level Which help screen should be displayed
 */
export function helpBuilder(level: number) {
  if (level == 1) {
    // Our first scene describes the color coding that we use for the different
    // entities in the game

    stage.backgroundColor = "#19698e"; // Light blue background

    // put some information and pictures on the screen
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 56, }, "The levels of this game demonstrate JetLag features"),
      rigidBody: new BoxBody({ cx: 8, cy: 1, width: .1, height: .1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 2.5, radius: 0.375 }),
    });
    Actor.Make({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "You control the hero"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 2.25, width: .1, height: .1, }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 3.5, radius: 0.375 }),
    });
    Actor.Make({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "Collect these goodies"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 3.25, width: .1, height: .1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 4.5, radius: 0.375 }),
    });
    Actor.Make({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "Avoid or defeat enemies"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 4.25, width: .1, height: .1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 5.5, radius: 0.375 }),
    });
    Actor.Make({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "Reach the destination"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 5.25, width: .1, height: .1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 6.5, radius: 0.375 }),
    });
    Actor.Make({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "These are obstacles"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 6.25, width: .1, height: .1 }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 7.5, radius: 0.375 }),
    });
    Actor.Make({
      appearance: new TextSprite({ center: false, face: "Arial", color: "#000000", size: 24 }, "toss projectiles"),
      rigidBody: new BoxBody({ cx: 1.5, cy: 7.25, width: .1, height: .1 }),
    });

    // Tap anywhere to go to the next screen
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }), // the fourth "00" is the alpha channel, for invisibility
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }),
      gestures: { tap: () => { stage.switchTo(helpBuilder, 2); return true; } }
    });
  }

  else if (level == 2) {
    // Our second help scene is just here to show that it is possible to have
    // more than one help scene. This is just like the previous screen, but with
    // different text

    stage.backgroundColor = "#19698e";
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 56 }, "That's All"),
      rigidBody: new BoxBody({ cx: 8, cy: 1, width: .1, height: .1 }),
    });
    let big_text = `We hope you enjoy learning about game development!

If you publish a game based on JetLag, please be sure to let us know.`;
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 32 }, big_text),
      rigidBody: new BoxBody({ cx: 8, cy: 5, width: .1, height: .1 }),
    });

    // Tap anywhere to go back to the splash screen
    Actor.Make({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }),
      gestures: { tap: () => { stage.switchTo(splashBuilder, 1); return true; } }
    });
  }
}
