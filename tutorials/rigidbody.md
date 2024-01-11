# Rigid Bodies and Physics

This tutorial discusses important issues related to rigid body types,
physics properties, gravity, shapes, and tilt.

## Preliminary Setup

In this tutorial, we're going to primarily work in the `builder` function.
Let's set up the rest of `game.ts` first, so that we don't have distractions
later.

The first step is to clean out your `game.ts` file.  Erase everything, and
replace it with this:

```typescript
import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { AccelerometerMode } from "../jetlag/Services/Accelerometer";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;
  canVibrate = true;
  accelerometerMode = AccelerometerMode.DISABLED;
  storageKey = "--no-key--";
  hitBoxes = true;
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
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config(), builder);
```

Next, let's set up the assets that we'll use throughout these tutorials.
Download these files to your `assets` folder:

- [green_ball.png](rigidbody/green_ball.png)
- [purple_ball.png](rigidbody/purple_ball.png)
- [blue_ball.png](rigidbody/blue_ball.png)
- [red_ball.png](rigidbody/red_ball.png)
- [grey_ball.png](rigidbody/grey_ball.png)
- [mustard_ball.png](rigidbody/mustard_ball.png)
- [mid.png](rigidbody/mid.png)

Then update your 'Config' object:

```typescript
  imageNames = ["green_ball.png", "purple_ball.png", "blue_ball.png", "red_ball.png", "grey_ball.png", "mustard_ball.png", "mid.png"];
```

Most of the mini-games in this tutorial are going to use tilt, and most of them
will also need to surround the 16x9 world with obstacles that keep the actors
from going off screen.  We can put two functions at the bottom of `game.ts` so
that we don't have to write that code over and over again:

```typescript
/** Draw a bounding box that surrounds the default world viewport */
function boundingBox() {
  // Draw a box around the world
  let t = new Actor({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: -.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  let b = new Actor({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  let l = new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  let r = new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16.05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  // Return the four sides as an object with fields "t", "b", "l", and "r" 
  // (for top/bottom/left/right)
  return { t, b, l, r };
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
```

Now it's time to get started!

## Types Of Rigid Bodies

In Box2D, a rigid body can have one of three different types.

- Static bodies don't move at all, ever.
- Kinematic bodies can move, but are not subject to forces
- Dynamic bodies can move, and are subject to forces

We're going start our exploration of this idea through the following game:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "rigidbody.html?1"
}
```

In builder, we'll start by turning on Tilt and drawing a bounding box:

```typescript
    // We will use tilt to control the hero, with arrow keys simulating
    // tilt on devices that lack an accelerometer
    enableTilt(10, 10);
    boundingBox();
```

Next, let's make an actor who moves via Tilt.  Note that attaching a
`TiltMovement` component automatically transforms the body to be dynamic.
Actually, attaching a `Hero` component also automatically transforms the body to
be dynamic.  So this hero is **definitely** dynamic.

```typescript
    // The actor who can move
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(), // This makes it dynamic
      role: new Hero(),
    });
```

Next, we'll draw three obstacles.  Obstacles default to being static, but we'll
override that for the second and third obstacle.

```typescript
    let s = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 4, radius: 0.4 }),
      role: new Obstacle(), // Defaults to static
    });

    let k = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 4, radius: 0.4 }, { kinematic: true }),
      role: new Obstacle(), // The prior line overrides to kinematic
    });

    let d = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 4, radius: 0.4 }, { dynamic: true }),
      role: new Obstacle(), // This one is overridden to be dynamic
    });
```

Right now, the kinematic and static obstacles don't seem to have any difference
in their behavior.  Let's see what happens when we give each of the obstacles
some velocity:

```typescript
    k.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })
    d.rigidBody.body.SetLinearVelocity({ x: -1, y: 0 })
    s.rigidBody.body.SetLinearVelocity({ x: 1, y: 0 })
```

You'll notice that *a lot* just changed:

- The static obstacle still doesn't move
- The kinematic and dynamic obstacles collide, but only the dynamic one
  experiences a transfer of momentum.
- The kinematic obstacle does not detect a collision with the wall, so it passes
  through it.

Let's add a few more kinematic and static obstacles:

```typescript
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
```

Here's the complete game:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "rigidbody.html?2"
}
```

In the game, you can see that the kinematic obstacles "pass through" each other,
and retain their velocity.  The dynamic obstacles experience a transfer of
momentum, which means they both just stop.  If you made one move faster than the
other, you'd see a different transfer of momentum.

The other important issue here is that the dynamic bodies are subject to forces.
We saw some version of this idea in the way that there was a transfer of
momentum between static and dynamic bodies, and from kinematic bodies to dynamic
bodies.  It also explains why the dynamic body bounces off of the static body.

In the last tutorial, we added gravity, which is a force.  Let's add gravity to
this level, and see what happens.  We just need to add one line:

```typescript
    // Note: you could have negative gravity, to make things float upward...
    stage.world.setGravity(0, 10);
```

Now all of the dynamic bodies start falling, while the static and kinematic ones
do not!  (To make it a bit clearer, my live demo takes out those extra obstacles
that we had just added.)

```iframe
{
    "width": 800,
    "height": 450,
    "src": "rigidbody.html?3"
}
```

## Rigid Body Shapes

In a previous tutorial, we saw that each rigidBody can have one of three shapes:
a box (rectangle), a circle, or a convex polygon.  Let's make a game that shows
all of these options.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "rigidbody.html?4"
}
```

In our game, it's really important that the `Config` object set `hitBoxes` to
`true`, because it lets us see the outline of the rigidBody... even when there's
an image covering it.  In the code for this example, notice that we're providing
different additional configuration information to the rigidBodies than we did
previously.  If you hover your mouse over `CircleBody` or `BoxBody` or
`PolygonBody`, you'll see a list of all the possible options.

```typescript
    // Turn on tilt and put a box around the world
    enableTilt(10, 10);
    boundingBox();

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
      movement: new TiltMovement(),
      role: new Obstacle(),
    });
```

In the mini-game, be sure to use the arrows to make the green ball move around
and interact with the other shapes.  You should see that Box2D is doing quite a
bit to make the interactions between shapes behave like it would in the real
world.

Before moving on, there are two things worth trying:

- Watch what happens if you take away the green ball's role.  If you do this, it
  will get the default role, which is `Passive`.  Passive actors don't collide
  with anything, so your green ball will now pass through all the obstacles.
- It's possible to override the behavior of tilt, so that it applies a
  *velocity* instead of a force.  Try adding these lines, and watching how the
  movement of the actor changes:

```typescript
    // While we're at it, we're going to change how tilt works... let's make it
    // affect velocity directly, instead of inducing forces:
    stage.tilt.tiltVelocityOverride = true;
```

## Density, Elasticity, and Friction

In the last level, it may have seemed odd that the green ball doesn't roll along
the ground, and doesn't start spinning when it interacts with the spinning
circle.  The reason for this is that actors have no friction by default.  When
making a rigidBody, you can specify the density, elasticity, and friction.
Here's a very brief demonstration:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "rigidbody.html?6"
}
```

Below is the code.  You'll notice that the increased density makes the actors
heavier.  Tilt forces take more work to get them moving, and they are harder to
stop.  They also will transfer momentum differently based on their density.

Notice, too, that even though they both look like circles, one is actually a
box.  Boxes have more area, so even at the same density, it will be heavier.

We also added friction.  One important thing about friction is that we need it on
*both* surfaces if we want things to have a friction interaction.  For circles,
friction makes them roll.  For boxes, it makes them slide to a halt.

Lastly, you'll notice that we can change these physics properties after the
fact.  To show this, the code adds some elasticity to the left wall, and some
friction to the bottom wall.

```typescript
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

    // boundingBox returns the four walls.  We can customize their physics 
    // properties:
    let walls = boundingBox();
    walls.b.rigidBody.setPhysics({ friction: .4 });
    walls.l.rigidBody.setPhysics({ elasticity: .2 });
```

Before moving on to the next example, be sure to change some numbers and see how
the actor behavior changes.  Also, make sure to move things around enough while
playing the game, so that you can get a better feel for how density, elasticity,
and friction affect gameplay.  Be sure to do silly things, too, like giving
something an elasticity of 100.

## Resizing Actors

Rigid bodies can be resized at any time.  This means you can make things grow
and shrink slowly, by using a timer to make incremental changes to size, or you
can make things grow and shrink instantly (for example, in Super Mario Bros,
when "big Mario" takes damage, it becomes "little Mario").

It's important to resize both the appearance and rigidBody, so JetLag has a
`resize` method on actors.  Calling it will result in both the appearance and
rigidBody being resized.  This works for all kinds of rigidBody shapes, and all
kinds of appearances, so in the following example, we make lots of different
combinations of shape and appearance.  Tapping red things will make them shrink.
Tapping blue things will make them grow.  You'll notice that resizing text is a
bit weird.  The `Text` tutorial will help clear this up.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "rigidbody.html?8"
}
```

The code below suffers from a lot of copy-and-paste.  While I usually think it
is a good idea to read every line, and to re-type code from these tutorials into
your own game, this is probably a case where it's fine to just make sure you
understand one or two actors, and then copy it and try it out.

```typescript
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
```

## Wrapping Up

This tutorial delved into many aspects of how rigid bodies can be configured. In
the next tutorial, we'll continue with this theme, by focusing on movement.

```md-config
page-title = Rigid Bodies and Physics

img {display: block; margin: auto; max-width: 500px;}
.red {color: red;}
```
