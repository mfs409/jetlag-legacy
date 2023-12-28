import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { levelController, enableTilt, boundingBox } from "./common";

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
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // Set up the level controller, so we can easily switch among levels
  levelController(level, 19, builder);

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
    boundingBox();

    // The actor who can move
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(), // This makes it dynamic
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: 0.4 }),
      role: new Obstacle(), // Defaults to static
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 4, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(), // The prior line overrides to kinematic
    });

    new Actor({
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

    enableTilt(10, 10);

    // The actor who can move
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(), // This makes it dynamic
      role: new Hero(),
    });

    let s = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: 0.4 }),
      role: new Obstacle(), // Defaults to static
    });

    let k = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 4, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });

    let d = new Actor({
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
    let k1 = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 2, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });
    let k2 = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 2, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });
    k1.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })
    k2.rigidBody.body.SetLinearVelocity({ x: -1, y: 0 })

    let d1 = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 6, radius: 0.4 }, { dynamic: true }),
      role: new Obstacle(),
    });
    let d2 = new Actor({
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

    let s = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: 0.4 }),
      role: new Obstacle(), // Defaults to static
    });

    let k = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 4, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(),
    });

    let d = new Actor({
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
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 1, cy: 1 }, { rotationSpeed: 5 }),
      role: new Obstacle(),
    });

    // Boxes have a width and a height
    new Actor({
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
    new Actor({
      appearance: new ImageSprite({ width: 2, height: 2, img: "blue_ball.png" }),
      rigidBody: new PolygonBody(
        { cx: 6, cy: 6, vertices: [-1, 0, -.5, .866, .5, .866, 1, 0, .5, -.866, -.5, -.866] },
        { rotationSpeed: .25 }),
      role: new Obstacle(),
    });

    // The polygon's center (x,y) need not be its true center:
    new Actor({
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
    let o = new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.15, img: "blue_ball.png" }),
      rigidBody: new BoxBody({ cx: 13, cy: 3, width: 0.75, height: 0.15, }),
      role: new Obstacle(),
    });
    o.rigidBody.setRotation(Math.PI / 4);

    // This actor can move around and experience the other actors' shapes
    new Actor({
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

    new Actor({
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

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }, { density: 5, friction: .3 }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 4, cy: 3, width: .8, height: .8 }, { density: 5, friction: .3 }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });

    let walls = boundingBox();
    walls.b.rigidBody.setPhysics({ friction: .4 });
    walls.l.rigidBody.setPhysics({ elasticity: .2 });
    // Be sure to play around with the arrow keys to make things collide
  }

  else if (level == 7) {
    enableTilt(10, 10);
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }, { density: 5, friction: .3 }),
      movement: new TiltMovement(),
      role: new Obstacle(),
    });
    new Actor({
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
    // This level shows that we can make entities that shrink or grow.  You
    // could probably put the shrinking / growing onto a timer.

    enableTilt(10, 10);
    boundingBox();

    // A hero, for exploring the world
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8, radius: 0.4, }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // A circle.  Tap it to make it shrink a little bit
    new Actor({
      appearance: new FilledCircle({ radius: .5, fillColor: "#FF0000" }),
      rigidBody: new CircleBody({ cx: 2, cy: 2, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (shrinkCircle) => { shrinkCircle.resize(.8); return true; } },
      role: new Obstacle(),
      extra: { radius: .5 }
    });

    // A box.  Tap it to make it shrink a little bit
    new Actor({
      appearance: new FilledBox({ width: 1, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 4, cy: 2, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (shrinkBox) => { shrinkBox.resize(.8); return true; } },
      role: new Obstacle(),
    });

    // A circle.  Tap it to make it grow a little bit
    new Actor({
      appearance: new FilledCircle({ radius: .5, fillColor: "#0000FF" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (growCircle) => { growCircle.resize(1.2); return true; } },
      role: new Obstacle(),
    });

    // A box.  Tap it to make it grow a little bit
    new Actor({
      appearance: new FilledBox({ width: 1, height: 2, fillColor: "#0000FF" }),
      rigidBody: new BoxBody({ cx: 4, cy: 5, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (growBox) => { growBox.resize(1.2); return true; } },
      role: new Obstacle(),
    });

    // A circle with an image.  Tap it to make it shrink a little bit
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 2, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (shrinkCircleImage) => { shrinkCircleImage.resize(.8); return true; } },
      role: new Obstacle(),
    });

    // A box with an image.  Tap it to make it shrink a little bit
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 2, img: "red_ball.png" }),
      rigidBody: new BoxBody({ cx: 8, cy: 2, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (shrinkBoxImage) => { shrinkBoxImage.resize(.8); return true; } },
      role: new Obstacle(),
    });

    // A circle with an image.  Tap it to make it grow a little bit
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 5, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (growCircleImage) => { growCircleImage.resize(1.2); return true; } },
      role: new Obstacle(),
    });

    // A box with an image.  Tap it to make it grow a little bit
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 2, img: "blue_ball.png" }),
      rigidBody: new BoxBody({ cx: 8, cy: 5, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (growBoxImage) => { growBoxImage.resize(1.2); return true; } },
      role: new Obstacle(),
    });

    // A circle with text.  Tap it to make it shrink a little bit
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#FF0000" }, "hello"),
      rigidBody: new CircleBody({ cx: 10, cy: 2, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (shrinkCircleText) => { shrinkCircleText.resize(.8); return true; } },
      role: new Obstacle(),
    });

    // A box with text.  Tap it to make it shrink a little bit
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#FF0000" }, "hello"),
      rigidBody: new BoxBody({ cx: 12, cy: 2, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (shrinkBoxText) => { shrinkBoxText.resize(.8); return true; } },
      role: new Obstacle(),
    });

    // A circle with text.  Tap it to make it grow a little bit
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#0000FF" }, "hello"),
      rigidBody: new CircleBody({ cx: 10, cy: 5, radius: .5 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (growCircleText) => { growCircleText.resize(1.2); return true; } },
      role: new Obstacle(),
    });

    // A box with text.  Tap it to make it grow a little bit
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", size: 24, color: "#0000FF" }, "hello"),
      rigidBody: new BoxBody({ cx: 12, cy: 5, width: 1, height: 2 }, { density: 5, friction: 0.6 }),
      gestures: { tap: (growBoxText) => { growBoxText.resize(1.2); return true; } },
      role: new Obstacle(),
    });

    // A polygon.  Tap it to make it shrink a little bit
    new Actor({
      appearance: new FilledPolygon({ vertices: [-1, -1, 0, 1, -1, 1], fillColor: "#FF0000" }),
      rigidBody: new PolygonBody({ cx: 14, cy: 2, vertices: [-1, -1, 0, 1, -1, 1] }),
      gestures: { tap: (shrinkPoly) => { shrinkPoly.resize(.8); return true; } },
      role: new Obstacle(),
    });

    // A polygon.  Tap it to make it grow a little bit
    new Actor({
      appearance: new FilledPolygon({ vertices: [-1, -1, 0, 1, -1, 1], fillColor: "#0000FF" }),
      rigidBody: new PolygonBody({ cx: 14, cy: 5, vertices: [-1, -1, 0, 1, -1, 1] }),
      gestures: { tap: (growPoly) => { growPoly.resize(1.2); return true; } },
      role: new Obstacle(),
    });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
