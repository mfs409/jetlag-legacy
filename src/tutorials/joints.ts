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


    // Joints are a powerful concept.  We'll just do a little demonstration here
    // for revolute joints, which let one rigid body revolve around another.  In
    // this demo, we'll have limits to the joints, kind of like pinball flippers.
    else if (level == 81) {
    enableTilt(10, 10);
    welcomeMessage("The revolving obstacle will move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    let cfg = { cx: 5, cy: 8, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // Note: you must give density to the revolving part...
    let boxCfg = { cx: 1.5, cy: 4, width: 5, height: 1, fillColor: "#FF0000" };
    let revolving = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1 }),
      role: new Obstacle(),
    });

    cfg = { cx: 7.5, cy: 4, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
    let anchor = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1 }),
      role: new Obstacle(),
    });

    revolving.rigidBody!.setRevoluteJoint(anchor, 0, 0, 0, 2);
    // Add some limits, then give some speed to make it move
    revolving.rigidBody!.setRevoluteJointLimits(1.7, -1.7);
    revolving.rigidBody!.setRevoluteJointMotor(0.5, Number.POSITIVE_INFINITY);
    cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    // Notice that we can change the motor at any time...
    stage.world.timer.addEvent(new TimedEvent(5, false, () => {
      // The order in which we do these changes doesn't matter :)
      revolving.rigidBody!.setRevoluteJointMotor(-.5, Number.POSITIVE_INFINITY);
      revolving.rigidBody!.setRevoluteJointLimits(1.7, -.5);
    }));

    stage.score.setVictoryDestination(1);
  }

  // Here's another joint demo.  In this one, we weld an obstacle to the hero.
  // This might be useful if your hero needs to pick things up and move them
  // places.
  else if (level == 83) {
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // set up a hero and fuse an obstacle to it
    cfg = { cx: 4, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 1, cy: 1, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
    let o = Actor.Make({
      appearance: new ImageSprite(cfg),
      // Note that for the weld joint to work, you probably want the obstacle to
      // have a dynamic body.
      rigidBody: new CircleBody(cfg, stage.world, { dynamic: true }),
      movement: new StandardMovement(),
      role: new Obstacle(),
    });

    h.rigidBody!.setWeldJoint(o, 3, 0, 0, 0, 45);
  }

  // We saw revolute joints earlier.  In this level, we'll make a joint without
  // any limits.  We can use it to drive a wheel, which means we can have
  // somewhat realistic physical propulsion.
  else if (level == 87) {
    stage.world.setGravity(0, 10);
    // If the ground and wheels don't have friction, then this level won't work!
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    // We'll make the body of our car as a hero with just a red square
    let boxCfg = { cx: 1, cy: 8, width: 2, height: 0.5, fillColor: "#FF0000" };
    let truck = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1 }),
      role: new Hero(),
    });

    let cfg = { cx: 0.75, cy: 8.5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    let backWheel = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 3, friction: 1 }),
      role: new Obstacle(),
    });
    backWheel.rigidBody.setRevoluteJoint(truck, -1, 0.5, 0, 0);
    backWheel.rigidBody.setRevoluteJointMotor(10, 10);

    cfg = { cx: 2.75, cy: 8.5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    let frontWheel = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 3, friction: 1 }),
      role: new Obstacle(),
    });
    frontWheel.rigidBody.setRevoluteJoint(truck, 1, 0.5, 0, 0);
    frontWheel.rigidBody.setRevoluteJointMotor(10, 10);

    cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
