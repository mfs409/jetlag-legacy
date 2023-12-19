import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { TimedEvent } from "../jetlag/Systems/Timer";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "--no-key--";
  hitBoxes = true;
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = ["sprites.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // JetLag does not really do much to make Joints easy to use.  There are a few
  // demonstrations below, but if you need to use joints, you will probably want
  // to look at references like https://www.iforce2d.net/b2dtut/joints-overview,
  // and then figure out how to translate that code from C++ to TypeScript.

  if (level == 1) {
    // In this level, a joint relates the rectangle to the circle.  The circle
    // is the pivot point, and the rectangle rotates around it
    let revolving = Actor.Make({
      appearance: new FilledBox({ width: 5, height: 1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 1.5, cy: 4, width: 5, height: 1, }),
      role: new Obstacle(),
    });

    let anchor = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 7.5, cy: 4, radius: 0.5 }),
      role: new Obstacle(),
    });

    revolving.rigidBody!.setRevoluteJoint(anchor, 0, 0, 0, 2);
    // Add some limits, then give some speed to make it move
    revolving.rigidBody!.setRevoluteJointLimits(1.7, -1.7);
    revolving.rigidBody!.setRevoluteJointMotor(0.5, Number.POSITIVE_INFINITY);

    // Notice that we can change the motor at any time...
    stage.world.timer.addEvent(new TimedEvent(5, false, () => {
      // The order in which we do these changes doesn't matter :)
      revolving.rigidBody!.setRevoluteJointMotor(-.5, Number.POSITIVE_INFINITY);
      revolving.rigidBody!.setRevoluteJointLimits(1.7, -.5);
    }));
  }

  else if (level == 2) {
    // In this demo, we have a joint that welds one actor to another
    enableTilt(10, 10);
    stage.world.setGravity(0, 10);
    boundingBox();

    // Set up a hero
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 8.5, radius: 0.4 }, { disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // When the hero collides with this box, it will stick to the hero
    Actor.Make({
      appearance: new FilledBox({ width: .5, height: .5, fillColor: "#FF0000" }),
      // Note that for the weld joint to work, you probably want the obstacle to
      // have a dynamic body.
      rigidBody: new BoxBody({ width: .5, height: .5, cx: 7, cy: 8.5 }, { dynamic: true }),
      role: new Obstacle({
        heroCollision: (o: Actor, h: Actor) => {
          h.rigidBody!.setWeldJoint(o, -.25, 0, .4, 0, 0);
        }
      }),
    });
  }

  else if (level == 3) {
    // Revolute joints without limits can be the foundation for things like cars
    stage.world.setGravity(0, 10);

    // If the ground and wheels don't have friction, then this level won't work!
    let sides = boundingBox();
    sides.b.rigidBody.setPhysics({ friction: 1 });

    // We'll make the body of our car as a hero with just a red square
    let car = Actor.Make({
      appearance: new FilledBox({ width: 2, height: 0.5, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 1, cy: 8, width: 2, height: 0.5 }),
      role: new Hero(),
    });

    // Connect a back wheel... heavy tires make for good traction
    let backWheel = Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.75, cy: 8.5, radius: 0.25 }, { density: 3, friction: 1 }),
      role: new Obstacle(),
    });
    backWheel.rigidBody.setRevoluteJoint(car, -1, 0.5, 0, 0);
    backWheel.rigidBody.setRevoluteJointMotor(10, 10);

    // Connect a front wheel... it'll be all-wheel drive :)
    let frontWheel = Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.75, cy: 8.5, radius: 0.25 }, { density: 3, friction: 1 }),
      role: new Obstacle(),
    });
    frontWheel.rigidBody.setRevoluteJoint(car, 1, 0.5, 0, 0);
    frontWheel.rigidBody.setRevoluteJointMotor(10, 10);
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);

/** Draw a bounding box that surrounds the default world viewport */
function boundingBox() {
  // Draw a box around the world
  let l = Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  let r = Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  let t = Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  let b = Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  return { l, r, t, b };
}

/**
 * Enable Tilt, and set up arrow keys to simulate it
 *
 * @param xMax  The maximum X force
 * @param yMax  The maximum Y force
 */
function enableTilt(xMax: number, yMax: number) {
  stage.tilt.tiltMax.Set(xMax, yMax);
  if (!stage.accelerometer.tiltSupported) {
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
  }
}
