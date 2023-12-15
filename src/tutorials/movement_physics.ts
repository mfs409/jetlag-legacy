import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { BasicChase, GravityMovement, ManualMovement, Path, PathMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { b2Vec2 } from "@box2d/core";

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
  imageNames = ["sprites.json", "mid.png"];
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

/** Draw a bounding box that surrounds the default world viewport */
function boundingBox() {
  // Draw a box around the world
  let t = Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  let b = Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  let l = Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  let r = Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  return { t, b, l, r };
}

/**
 * Set the +/- keys to move among the levels of the tutorial
 * @param curr  The current level
 * @param max   The largest level
 */
function levelController(curr: number, max: number) {
  let next = () => {
    if (curr == max) stage.switchTo(builder, 1);
    else stage.switchTo(builder, curr + 1);
  };
  let prev = () => {
    if (curr == 1) stage.switchTo(builder, max);
    else stage.switchTo(builder, curr - 1);
  }
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_EQUAL, next);
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_MINUS, prev);
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // Set up the level controller, so we can easily switch among levels
  levelController(level, 19);

  if (level == 1) {
    // There are three types of physical bodies in Box2D.
    // - Static bodies don't move at all, ever.
    // - Kinematic bodies can move, but are not subject to forces
    // - Dynamic bodies can move, and are subject to forces
    //
    // To illustrate the difference, we'll have a hero who moves via tilt.  It's
    // dynamic, of course.  Make it collide with each kind of body to see what
    // happens.

    // We will use tilt to control the hero, with arrow keys simulating
    // tilt on devices that lack an accelerometer
    enableTilt(10, 10);

    // The actor who can move
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(), // This makes it dynamic
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: 0.4 }),
      role: new Obstacle(), // Defaults to static
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 4, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(), // The prior line overrides to kinematic
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 4, radius: 0.4 }, { dynamic: true }),
      role: new Obstacle(), // This one is overridden to be dynamic
    });
  }

  else if (level == 2) {
    // Hmm, kinematic and static looked the same!  This time, let's explicitly
    // give things a velocity, and watch what happens

    // Let's have a bounding box
    boundingBox();

    let s = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: 0.4 }),
      role: new Obstacle(), // Defaults to static
    });

    let k = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 4, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });

    let d = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 4, radius: 0.4 }, { dynamic: true }),
      role: new Obstacle(),
    });

    k.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })
    d.rigidBody.body.SetLinearVelocity({ x: -1, y: 0 })
    s.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })

    // The static one did not move.  The kinematic one did not experience a
    // transfer of momentum.  The dynamic one did.

    // To convince ourselves, let's repeat the experiment with two kinematics,
    // and again with two dynamics:
    let k1 = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 2, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });
    let k2 = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 2, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });
    k1.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })
    k2.rigidBody.body.SetLinearVelocity({ x: -1, y: 0 })

    let d1 = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 6, radius: 0.4 }, { dynamic: true }),
      role: new Obstacle(),
    });
    let d2 = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 6, radius: 0.4 }, { dynamic: true }),
      role: new Obstacle(),
    });
    d1.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })
    d2.rigidBody.body.SetLinearVelocity({ x: -1, y: 0 })

    // Be sure to let this run for a while, so you can see how the middle row
    // behaves very oddly when things reach the boundary.
  }

  else if (level == 3) {
    // It's also the case that gravity doesn't affect kinematic bodies!
    boundingBox();
    // Note: you could have negative gravity, to make things float upward...
    stage.world.setGravity(0, 10);

    let s = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: 0.4 }),
      role: new Obstacle(), // Defaults to static
    });

    let k = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 4, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });

    let d = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 4, radius: 0.4 }, { dynamic: true }),
      role: new Obstacle(),
    });

    k.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })
    d.rigidBody.body.SetLinearVelocity({ x: -1, y: 0 })
    s.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })

    // Later on, we'll see that sometimes we want code to run when a collision
    // happens.  An additional requirement is that the collision won't be
    // detected unless at least one body is dynamic.
  }

  else if (level == 4) {
    // Now let's look at the different kinds of bodies.  Keep in mind that the
    // shape of the rigidBody is completely unrelated to the appearance.  Focus
    // on the appearance of the hitbox, not the blue balls.

    // Also, note that when we make a rigidBody, we can provide some "extra"
    // configuration.  In this case, we'll make things rotate

    // Circles need a radius.
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 1, cy: 1 }, { rotationSpeed: 5 }),
      role: new Obstacle(),
    });

    // Boxes have a width and a height
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 2, img: "blue_ball.png" }),
      rigidBody: new BoxBody({ width: 1, height: 2, cx: 3, cy: 2 }, { rotationSpeed: -.25 }),
      role: new Obstacle(),
    });

    // To make a polygon, we provide an array with the vertices.  Note that two
    // entries in a row will represent x and y coordinates of a vertex.
    //
    // Polygons can have as many points as you want (but more than 8 is usually
    // crazy), but the polygon needs to be convex.  Points are described in
    // terms of their distance from the center.  So, for example, here's a
    // circular image with a hexagonal body.
    Actor.Make({
      appearance: new ImageSprite({ width: 2, height: 2, img: "blue_ball.png" }),
      rigidBody: new PolygonBody(
        { cx: 6, cy: 6, vertices: [-1, 0, -.5, .866, .5, .866, 1, 0, .5, -.866, -.5, -.866] },
        { rotationSpeed: .25 }),
      role: new Obstacle(),
    });

    // The polygon's center (x,y) need not be its true center:
    Actor.Make({
      appearance: new ImageSprite({ width: 2, height: 2, img: "blue_ball.png" }),
      rigidBody: new PolygonBody(
        { cx: 13, cy: 6, vertices: [-1, 0, 0, 1, 1, 0] },
        { rotationSpeed: .25 }),
      role: new Obstacle(),
    });

    // Turn on tilt and put a box around the world
    enableTilt(10, 10);
    boundingBox();

    // Let's also draw an obstacle that is oblong (due to its width and height)
    // and that is rotated. Note that this should be a box, or it will not have
    // the right underlying shape.
    let o = Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 0.15, img: "blue_ball.png" }),
      rigidBody: new BoxBody({ cx: 13, cy: 3, width: 0.75, height: 0.15, }),
      role: new Obstacle(),
    });
    o.rigidBody.setRotation(Math.PI / 4);

    // This actor can move around and experience the other actors' shapes
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(), // This makes it dynamic
      role: new Obstacle(),
    });
  }

  else if (level == 5) {
    // In the last level, watch what happens if you change the last actor's
    // role.  Suddenly, it goes through everything else, even though it's
    // dynamic!  There's a bit more at play.  The first thing is that some
    // `roles` are defined not to interact with each other (or with anything).
    // The other is that the default role is "Passive", which doesn't collide
    // with *anything*.
    //
    // We can get that behavior in any actor.  So, for example, this hero will
    // go through the walls, even though it's not Passive:

    boundingBox();
    enableTilt(10, 10);
    // While we're at it, we're going to change how tilt works... let's make it
    // affect velocity directly, instead of inducing forces:
    stage.tilt.tiltVelocityOverride = true;

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }, { collisionsEnabled: false }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });
  }

  else if (level == 6) {
    // There are many other customizations we can put into that second field.
    // Let's look at density, elasticity, and friction
    enableTilt(10, 10);

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }, { density: 5, friction: .3 }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 4, cy: 3, width: .8, height: .8 }, { density: 5, friction: .3 }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });

    boundingBox();
    // Be sure to play around with the arrow keys to make things collide
  }

  else if (level == 7) {
    enableTilt(10, 10);
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }, { density: 5, friction: .3 }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 4, cy: 3, width: .8, height: .8 }, { density: 5, friction: .3 }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });

    // The way that the ball glided across the floor was odd.  Let's give the walls friction...
    let walls = boundingBox();
    walls.l.rigidBody.setPhysics({ friction: .6 })
    walls.r.rigidBody.setPhysics({ friction: .6 })
    walls.t.rigidBody.setPhysics({ friction: .6 })
    walls.b.rigidBody.setPhysics({ friction: .6 })

    // Note that the default is for everything to have density=1, elasticity=0,
    // and friction=0.  You should make same-sized actors with different
    // densities, and watch what happens when they collide!  You should also
    // watch what happens when you make elasticity too big (try 100, for
    // example...)
  }

  else if (level == 8) {
    // TODO: text and polygon resize is really buggy

    // This level shows that we can make entities that shrink or grow.  You
    // could probably put the shrinking / growing onto a timer.

    enableTilt(10, 10);
    boundingBox();

    // A hero, for exploring the world
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8, radius: 0.4, }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // A circle.  Tap it to make it shrink a little bit
    let shrinkCircle = Actor.Make({
      appearance: new FilledCircle({ radius: .5, fillColor: "#FF0000" }),
      rigidBody: new CircleBody({ cx: 2, cy: 2, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { shrinkCircle.extra.radius *= .8; shrinkCircle.resize(2, 2, 2 * shrinkCircle.extra.radius, 2 * shrinkCircle.extra.radius); return true; } },
      role: new Obstacle(),
      extra: { radius: .5 }
    });

    // A box.  Tap it to make it shrink a little bit
    let shrinkBox = Actor.Make({
      appearance: new FilledBox({ width: 1, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 4, cy: 2, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { shrinkBox.extra.w *= .8; shrinkBox.extra.h *= .8; shrinkBox.resize(4, 2, shrinkBox.extra.w, shrinkBox.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 1, h: 2 }
    });

    // A circle.  Tap it to make it grow a little bit
    let growCircle = Actor.Make({
      appearance: new FilledCircle({ radius: .5, fillColor: "#0000FF" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { growCircle.extra.radius *= 1.2; growCircle.resize(2, 5, 2 * growCircle.extra.radius, 2 * growCircle.extra.radius); return true; } },
      role: new Obstacle(),
      extra: { radius: .5 }
    });

    // A box.  Tap it to make it grow a little bit
    let growBox = Actor.Make({
      appearance: new FilledBox({ width: 1, height: 2, fillColor: "#0000FF" }),
      rigidBody: new BoxBody({ cx: 4, cy: 5, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { growBox.extra.w *= 1.2; growBox.extra.h *= 1.2; growBox.resize(4, 5, growBox.extra.w, growBox.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 1, h: 2 }
    });

    // A circle with an image.  Tap it to make it shrink a little bit
    let shrinkCircleImage = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 2, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { shrinkCircleImage.extra.radius *= .8; shrinkCircleImage.resize(6, 2, 2 * shrinkCircleImage.extra.radius, 2 * shrinkCircleImage.extra.radius); return true; } },
      role: new Obstacle(),
      extra: { radius: .5 }
    });

    // A box with an image.  Tap it to make it shrink a little bit
    let shrinkBoxImage = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 2, img: "red_ball.png" }),
      rigidBody: new BoxBody({ cx: 8, cy: 2, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { shrinkBoxImage.extra.w *= .8; shrinkBoxImage.extra.h *= .8; shrinkBoxImage.resize(8, 2, shrinkBoxImage.extra.w, shrinkBoxImage.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 1, h: 2 }
    });

    // A circle with an image.  Tap it to make it grow a little bit
    let growCircleImage = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 5, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { growCircleImage.extra.radius *= 1.2; growCircleImage.resize(6, 5, 2 * growCircleImage.extra.radius, 2 * growCircleImage.extra.radius); return true; } },
      role: new Obstacle(),
      extra: { radius: .5 }
    });

    // A box with an image.  Tap it to make it grow a little bit
    let growBoxImage = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 2, img: "blue_ball.png" }),
      rigidBody: new BoxBody({ cx: 8, cy: 5, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { growBoxImage.extra.w *= 1.2; growBoxImage.extra.h *= 1.2; growBoxImage.resize(8, 5, growBoxImage.extra.w, growBoxImage.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 1, h: 2 }
    });

    // A circle with text.  Tap it to make it shrink a little bit
    let shrinkCircleText = Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#FF0000" }, "hello"),
      rigidBody: new CircleBody({ cx: 10, cy: 2, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { shrinkCircleText.extra.radius *= .8; shrinkCircleText.resize(10, 2, 2 * shrinkCircleText.extra.radius, 10 * shrinkCircleText.extra.radius); return true; } },
      role: new Obstacle(),
      extra: { radius: .5 }
    });

    // A box with text.  Tap it to make it shrink a little bit
    let shrinkBoxText = Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#FF0000" }, "hello"),
      rigidBody: new BoxBody({ cx: 12, cy: 2, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { shrinkBoxText.extra.w *= .8; shrinkBoxText.extra.h *= .8; shrinkBoxText.resize(12, 2, shrinkBoxText.extra.w, shrinkBoxText.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 1, h: 2 }
    });

    // A circle with text.  Tap it to make it grow a little bit
    let growCircleText = Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#0000FF" }, "hello"),
      rigidBody: new CircleBody({ cx: 10, cy: 5, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { growCircleText.extra.radius *= 1.2; growCircleText.resize(10, 5, 2 * growCircleText.extra.radius, 2 * growCircleText.extra.radius); return true; } },
      role: new Obstacle(),
      extra: { radius: .5 }
    });

    // A box with text.  Tap it to make it grow a little bit
    let growBoxText = Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#0000FF" }, "hello"),
      rigidBody: new BoxBody({ cx: 12, cy: 5, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: () => { growBoxText.extra.w *= 1.2; growBoxText.extra.h *= 1.2; growBoxText.resize(12, 5, growBoxText.extra.w, growBoxText.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 1, h: 2 }
    });

    // A polygon.  Tap it to make it shrink a little bit
    let shrinkPoly = Actor.Make({
      appearance: new FilledPolygon({ vertices: [-1, -1, 0, 1, -1, 1], fillColor: "#FF0000" }),
      rigidBody: new PolygonBody({ cx: 14, cy: 2, vertices: [-1, -1, 0, 1, -1, 1] }),
      gestures: { tap: () => { shrinkPoly.extra.w *= .8; shrinkPoly.extra.h *= .8; shrinkPoly.resize(14, 2, shrinkPoly.extra.w, shrinkPoly.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 2, h: 2 }
    });

    // A polygon.  Tap it to make it grow a little bit
    let growPoly = Actor.Make({
      appearance: new FilledPolygon({ vertices: [-1, -1, 0, 1, -1, 1], fillColor: "#0000FF" }),
      rigidBody: new PolygonBody({ cx: 14, cy: 5, vertices: [-1, -1, 0, 1, -1, 1] }),
      gestures: { tap: () => { growPoly.extra.w *= 1.2; growPoly.extra.h *= 1.2; growPoly.resize(14, 5, growPoly.extra.w, growPoly.extra.h); return true; } },
      role: new Obstacle(),
      extra: { w: 2, h: 2 }
    });
  }

  else if (level == 9) {
    // There's lots more we can explore in the configuration of rigid bodies,
    // but having some better ways of moving the hero would make it easier for
    // us to explore them, so let's switch gears and start looking at ways to
    // move an actor.  We've already seen Tilt, which is nice and
    // straightforward.  We've also seen "Inert", the default movement policy.

    // A rather uninteresting movement is the "GravityMovement".  This isn't
    // really a movement at all... it just says that gravity will affect the
    // actor.  It's not really any different from making the body "dynamic", but
    // sometimes it's useful.  Let's try it out here.  We'll make "enemies" that
    // fall from the sky, and the "hero" needs to dodge them.  When enemies
    // collide with the ground, they'll disappear.  Don't worry if some of this
    // doesn't make sense yet... we'll explain it all later.
    enableTilt(10, 0); // Now tilt will only control left/right
    let walls = boundingBox();
    (walls.b.role as Obstacle).enemyCollision = (_thisActor: Actor, enemy: Actor) => {
      (enemy.role as Enemy).defeat(false);
    }
    walls.t.enabled = false; // No top wall

    // Downward gravity
    stage.world.setGravity(0, 10);

    // Falling enemies
    stage.world.timer.addEvent(new TimedEvent(1, true, () => Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cy: -.5, cx: .5 + (Math.random() * 15) }),
      role: new Enemy(),
      movement: new GravityMovement(),
    })));

    // A hero moving via tilt.  Notice that the ball "rolls" on the ground, even
    // though there's no friction.  That's because of gravity.
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8.6, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // Any time it's possible to "lose", we need to tell JetLag what to do if the level is lost
    stage.score.onLose = { level, builder }
  }

  else if (level == 10) {
    // Let's look at "path" movement.  This lets us specify a set of waypoints,
    // and the actor will move from one to the next.  We even can let paths
    // repeat.

    // Moving around in the world will make this more interesting!
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8.6, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    enableTilt(10, 10);

    // This actor moves to a position and stops
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: .5, cy: .5 }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(.5, .5).to(15.5, .5), 2, false),
    });

    // This actor loops, and is faster.  Also, actors on paths don't have to be
    // obstacles, they can have any role...
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 1.5, cy: 1.5 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(.5, 1.5).to(15.5, 1.5), 5, true),
    });

    // Since there's an enemy, we need a way to lose...
    stage.score.onLose = { level, builder }

    // The last one was a bit odd.  This one has *three* points.
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 1.5 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(.5, 2.5).to(15.5, 2.5).to(.5, 2.5), 5, true),
    });

    // Of course, paths can go from anywhere to anywhere... even off the screen.
    // The default is that Actors on paths are kinematic, so they can go through
    // walls.
    boundingBox();
    // Since we're going to make a complex path, let's use some code to make it:
    let p = new Path();
    let lastX = -.5;
    let lastY = 2;
    let up = true;
    while (lastX <= 16.5) {
      p.to(lastX, lastY);
      lastX += 1;
      if (up) lastY += 1; else lastY -= 1;
      up = !up;
    }
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p.getPoint(0).x, cy: p.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p, 5, true),
    });

    // If a point on the path is directly between two other points, you won't
    // notice it's there.  The velocity is all that matters
    let p2 = new Path().to(-.5, 5).to(8, 5).to(16.5, 5).to(-.5, 5);
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p2.getPoint(0).x, cy: p2.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p2, 5, true),
    });

    // But once we've done that, we can re-use the path, letting the next actor
    // jump forward by a waypoint:
    let a2 = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p2.getPoint(0).x, cy: p2.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p2, 5, true),
    });
    (a2.movement as PathMovement).skip_to(1);
    // Notice that we didn't get cx and cy right.  That's OK, as long as you
    // don't have too many dynamic things with the same cx/cy.

    // We can make actors on paths dynamic.  This is usually a bad idea if
    // collisions are enabled (which is, of course, the default).  Try colliding
    // with this.  It will mess up the whole path system.
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 1.5 }, { dynamic: true }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(.5, 6.5).to(15.5, 6.5).to(.5, 6.5), 5, true),
    });

    // Lastly, let's observe that we can run code whenever an actor reaches a
    // waypoint.  In this example, we'll only do something on the second
    // waypoint (waypoint #1):
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 7.5 }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(-.5, 7.5).to(8, 8.5).to(16.5, 7.5).to(8, 8.5).to(-.5, 7.5), 5, true, (which: number) => {
        if (which == 1 || which == 3) {
          Actor.Make({
            appearance: new ImageSprite({ width: .5, height: .5, img: "grey_ball.png" }),
            rigidBody: new CircleBody({ radius: .25, cx: 1.5 - Math.random(), cy: 1.5 - Math.random() }, { dynamic: true }),
            role: new Goodie(),
          });
        }
      }),
    });
  }

  else if (level == 11) {
    // Another way of moving things is via "chase".  Chase isn't incredibly
    // complicated... we just cast a line from the chasing actor to the actor it
    // is chasing.  Surprisingly, this can seem like a really smart "AI" in some
    // games.

    boundingBox();
    enableTilt(10, 10);

    // Make a hero who we control via tilt
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // create an enemy who chases the hero
    Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 1, radius: 0.25 }),
      movement: new BasicChase({ speed: 1, target: h }),
      role: new Enemy(),
    });

    stage.score.onLose = { level, builder }
  }

  else if (level == 12) {
    // Chasing in only one dimension can be useful for neat UI effects, or for
    // things like a soccer goalie.  We'll try it out here.

    boundingBox();
    enableTilt(10, 10);

    // Make a hero who moves via tilt
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 5.25, cy: 5.25, radius: 0.4, }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // These obstacles chase the hero, but only in one dimension
    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 0, cy: 2.5, radius: 0.5 }),
      movement: new BasicChase({ speed: 10, target: h, chaseInX: false }),
      role: new Obstacle(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 0, radius: 0.5, }),
      movement: new BasicChase({ speed: 10, target: h, chaseInY: false }),
      role: new Obstacle(),
    });
  }

  else if (level == 13) {
    // Sometimes we only want chasing in one direction.
    enableTilt(10, 0);
    stage.world.setGravity(0, 10);
    boundingBox();

    // Just for fun, we'll have an auto-scrolling background, to make it look
    // like we're moving all the time
    stage.background.addLayer({ cx: 8, cy: 4.5 }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: -5 / 1000, isAuto: true });

    // Make a hero and an enemy that slowly moves toward the hero
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      role: new Hero(),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }),
      movement: new TiltMovement(),
      gestures: { tap: () => { h.rigidBody.setVelocity(new b2Vec2(h.rigidBody.getVelocity().x, -10)); return true; } }
    });

    // This enemy will slowly move toward the hero
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      role: new Obstacle(),
      rigidBody: new CircleBody({ cx: 15, cy: 2, radius: 0.4 }, { dynamic: true }),
      movement: new BasicChase({ target: h, chaseInY: false, speed: 0.9 })
    });
  }

  else if (level == 14) {
    // Most of the movements we've looked at so far have been kind of automatic.
    // Now let's look at the last movement technique, ManualMovement.  This is
    // for when you want complete control over the movement of the actor.
    stage.world.setGravity(0, 0);
    boundingBox();

    // First, make the hero with ManualMovement as its movement component
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 8, radius: 0.25 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    // Now let's say that pressing a key should update its velocity, and
    // releasing should set that part of the velocity to 0:
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

    // We'll use the 'a' and 's' keys to rotate counterclockwise and clockwise
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_A, () => (hero.movement as ManualMovement).increaseRotation(-0.05))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_S, () => (hero.movement as ManualMovement).increaseRotation(0.05))
  }

  else if (level == 15) {
    // We can use ManualMovement along with fixed speeds, so that there's only
    // control in one dimension
    boundingBox();

    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4, }, { disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).addVelocity(5, 0);

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
  }

  else if (level == 16) {
    // In the last level, there was a "disableRotation" parameter.  This can be
    // very useful, especially in platformer-type games.
    stage.world.setGravity(0, 10);
    boundingBox();

    // If we don't have the `disableRotation` option here, then if the hero just
    // barely nicks the corner of the platform, it will rotate as it falls!
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 1, cy: 5.25, width: .8, height: .8 }, { disableRotation: false }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new FilledBox({ width: 2, height: .25, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ width: 2, height: .25, cx: 4, cy: 7 }),
      role: new Obstacle(),
    });

    // "jumping" is a special behavior, and it's part of the *hero*, not the
    // *movement*.
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => ((hero.role as Hero).jump(0, -7.5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
  }

  else if (level == 17) {
    // Sometimes, we want to make an actor move when we press a control, but when
    // we release we don't want an immediate stop. This shows how to achieve that
    // effect.
    stage.world.setGravity(0, 0);
    boundingBox();

    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.75, height: 1.5, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 2, cy: 4, width: 0.75, height: 1.5, }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    // Be sure to turn off each of these, and watch what happens as the hero moves
    (hero.movement as ManualMovement).setDamping(1);
    (hero.movement as ManualMovement).setAngularDamping(1);

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_A, () => ((hero.movement as ManualMovement).updateAngularVelocity(-1)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_S, () => ((hero.movement as ManualMovement).updateAngularVelocity(1)));

    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
  }

  else if (level == 18) {
    // Another neat feature in ManualMovement is that we can force an actor to
    // be immune to gravity.
    stage.world.setGravity(0, 10);
    boundingBox();

    // Destinations default to having collisions disabled.  We don't want this
    // to fly off screen, so we need to re-enable collisions, and we need to
    // make it dynamic.
    let d = Actor.Make({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 4, radius: 0.5 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Destination(),
    });
    (d.movement as ManualMovement).setAbsoluteVelocity(-2, 0);
    d.rigidBody.setCollisionsEnabled(true);

    // But now that it's dynamic, gravity affects it, and it falls.  This fixes
    // it:
    (d.movement as ManualMovement).setGravityDefy();
  }

  else if (level == 19) {
    // Since we can attach ManualMovement to any actor, let's put it all
    // together by making a block breaking game!
    boundingBox();

    // make a hero who is always moving... note there is no friction,
    // anywhere, and the hero is elastic... it won't ever stop...
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 7, radius: 0.25 }, { elasticity: 1, friction: 0.1 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (h.movement as ManualMovement).addVelocity(0, 8);

    // make an obstacle and then connect it to some controls
    let boxCfg = { cx: 8, cy: 8.75, width: 2, height: 0.5, fillColor: "#FF0000" };
    let o = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, { density: 10, elasticity: 1, friction: 0.1 }),
      movement: new ManualMovement(),
      role: new Obstacle(),
    });

    let colors = ["#FF0000", "#FFFF00", "#FF00FF", "#00FF00", "#00FFFF", "#0000FF"];
    for (let r = .25; r < 4.25; r += .5) {
      for (let c = .5; c < 16; c += 1) {
        Actor.Make({
          appearance: new FilledBox({ width: 1, height: .5, fillColor: colors[Math.trunc(Math.random() * 6)] }),
          rigidBody: new BoxBody({ cx: c, cy: r, width: 1, height: .5 }, { density: 1 }),
          role: new Obstacle({ heroCollision: (thisActor: Actor) => thisActor.enabled = false })
        });
      }
    }

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((o.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((o.movement as ManualMovement).updateXVelocity(5)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((o.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((o.movement as ManualMovement).updateXVelocity(0)));

    // This is far from perfect... in particular, it's possible in our current
    // physics configuration to get the ball to move left-right in an infinite
    // cycle.  We'd probably want heroCollisions on the walls, to correct for
    // bad velocities.  But still, it's a nice start!
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
