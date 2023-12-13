import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/Grid";

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

  // Here's where we name all the images/sounds/background music files.  Make
  // sure names don't have spaces or other funny characters, and make sure you
  // put the corresponding files in the folder identified by `resourcePrefix`.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(_level: number) {


      // We can make goodies "count" for more than one point... they can even count
    // for negative points.
    else if (level == 22) {
    // start with a hero who is controlled via Joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });

    addJoystickControl(stage.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // Set up a destination that requires 7 type-1 goodies
    cfg = { cx: 15, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination({ onAttemptArrival: () => { return stage.score.getGoodieCount(0) >= 7; } }),
    });

    stage.score.setVictoryDestination(1);

    // This goodie **reduces** your score
    cfg = { cx: 9, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(0, -2); return true; } }),
    });

    // This goodie **increases** your score
    cfg = { cx: 9, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(0, 9); return true; } }),
    });

    // print a goodie count to show how the count goes up and down
    makeText(stage.hud,
      { cx: 7, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 18, z: 2 },
      () => "Your score is: " + stage.score.getGoodieCount(0));

    welcomeMessage("Collect 'the right' blue balls to activate destination");
    winMessage("Great Job");
  }

}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
