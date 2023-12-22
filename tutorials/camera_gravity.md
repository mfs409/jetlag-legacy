# The Camera and Gravity

In JetLag, the camera decides what part of a level is visible at any time.  The
camera and gravity work together in interesting ways, which we explore in this
tutorial.

## Tilt, as a Prelude to Gravity

The `stage` in our game is running a full physics simulation.  In the default
game code, we can't really see that simulation very much, because our arrows
interact with the hero's `ManualMovement` component to give it a fixed velocity.
As a prelude to thinking about gravity in interesting ways, let's change the
behavior of the arrow keys, and the movement component of the hero.

The best way to think about what we're going to do here is to think of a mobile
game, where your phone is like a table and you're trying to tilt the phone to
get a marble on the table to move through a maze.  The first thing we'll do is
change the hero's movement to `TiltMovement`:

```typescript
    movement: new TiltMovement(), // was `new ManualMovement(),`
```

When you do this, VSCode should help you to update your `imports`, because we
need to import `TiltMovement`.  If VSCode didn't do it for you, update the
import at the top of the file to look like this:

```typescript
import { ManualMovement, TiltMovement } from "../jetlag/Components/Movement";
```

We're going to get the affect of tilting a phone by using the keyboard to
simulate a phone's accelerometer.  First, let's enable the accelerometer by adding this line:

```typescript
  // Configure tilt: arrow keys will simulate gravitational force, with a
  // maximum of +- 10 in the X and Y dimensions.
  stage.tilt.tiltMax.Set(10, 10);
```

Then we can change the key handlers, so that they cause JetLag to pretend the accelerometer is producing measurements:

```typescript
  // Pressing a key will induce a force, releasing will stop inducing that force
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
```

While the game *looks* the same, now the behavior of the hero will be quite a bit different.

(A quick note: programming the game to use tilt is often more convenient than
using arrow keys, so these tutorials tend to use tilt a lot, even though it
isn't the best choice for most games.)

## Introducing Gravity... It's All About Perspective

In our previous game, it *felt* like there was some kind of gravity affecting
the hero, but we didn't really tell JetLag that we wanted gravity.  You might
want to stop for a moment to think about why.

I would argue that there was gravity, it's just that the gravity was not in the
"left/right" or "up/down" dimensions on the screen... it was in a "z" dimension,
as if going straight down from your screen to the center of the earth.  Put
another way, the *perspective* of the game was from above.  We were looking down
at the game, so we didn't expect gravity to be pushing things around on the
screen (unless the screen was tilted).

In JetLag, this corresponds to a gravity of (0, 0).  That is, there is no default force in the x or y dimension.  If we instead had gravity in the Y dimension, it would seem like we were looking at the game from a side perspective, in which case the hero would fall to the ground.

If you add this one line to the code, the whole perspective will shift:

```typescript
  stage.world.setGravity(0, 10);
```

Of course, we don't have a floor in our game, so the hero will just fall off the
screen, and keep falling forever.

If you change the "box" obstacle's `cx` to 5, the hero will have a place to
land.  Of course, as soon as you move the hero off the box, it will fall, but at
least it can stay still for a little while.

## The Camera

In many games, the world is too big to fit on the screen all at once.  Instead,
only a part of the world is displayed.  The easiest way to think about how this
works is by imagining that there is a camera filming your world.  The camera
should follow the action, zoomed in on the most important part.  The following
picture can be helpful in understanding the idea:

![The Camera and the World](camera_gravity/camera.png)

In the picture, the shape with the red outline is the world.  The shape with the purple outline is the camera.  The blue dotted lines show a projection from the world onto the camera, so that we can see just a portion of the world at any time.

In the rest of this tutorial, we're going to combine a camera with gravity to
make four different styles of game.  You can access the camera via
`stage.world.camera`, but you'll find that most of the functions of the camera
(the camera's "methods") aren't really there for you to use... they exist so
that JetLag can interact figure out what part of your game to put on the screen.

## Camera + Gravity: An Ambiguous Perspective

In some games, the perspective can be fluid.  One way to think about this is
that when `stage.world` has gravity of (0, 0), that could either mean that the
perspective is from overhead, or that the game is in outer space and the
perspective is from the side.  In these cases, the way you draw your actors will
probably determine which manner is perceived by the player.  To illustrate the
point, we'll make a game that looks like this:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "/overview.html?1"
}
```

You'll notice right away that the game doesn't give any instructions.  Were you
able to figure out how it works?  Notice that once you click on the game,
certain key presses will be routed to the game, instead of to your browser.  The
left and right arrow keys rotate the triangle, and space causes it to shoot a
grey circle.  If a red circle collides with the triangle, the player loses.If ten grey circles collide with red circles, then the player wins.  Either way, the game immediately restarts.

Since we are just using a blue triangle and red/grey circles, it's really not
clear what the perspective is.  And to be frank, right now it doesn't matter.
The most important thing for now is understanding how JetLag is being used to
make this game.

To begin, erase most of your `game.ts` file, so that it looks like this:

```typescript
import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";

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
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config(), builder);
```

Now that you've got an empty game to work with, let's start making this game. As
you probably guessed, the first thing we'll do is make the grid.  We do that by
adding this code inside the `builder` function:

```typescript
    // Draw a grid on the screen, covering the whole visible area
    GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 16, y: 9 });
```

As you write the above code, you should figure out how to get VSCode to create
the needed `import` statement for you (either by right clicking `GridSystem` or
by pressing `TAB` at the right time.)

Next, let's make the hero.  This code is pretty similar to what we did in the
last tutorial.  The main differences are:

- When we make the `FilledPolygon`, we include `z: 1`.  In JetLag, there are
  five Z planes: -2, -1, 0, 1, and 2.  When Actors are drawn, they will always
  appear "on top of" actors with a smaller Z.  If two actors have the same Z,
  the one who was created earlier will appear below the one created later.
- When we make the `PolygonBody`, there is a second argument to it:
  `{collisionsEnabled: false}`.  This indicates that when an Actor collides with
  the hero, it should not cause the hero and the other Actor to bounce off of
  each other.

Both of these changes will make sense once we write the code for tossing the
grey circles.

```typescript
    // Make a hero
    let h = new Actor({
      appearance: new FilledPolygon({ vertices: [0, -.5, .25, .5, -.25, .5], fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044", z: 1 }),
      rigidBody: new PolygonBody({ cx: 8, cy: 4.5, vertices: [0, -.5, .25, .5, -.25, .5] }, { collisionsEnabled: false }),
      role: new Hero(),
      movement: new ManualMovement(),
    });
```

The next thing we'll do is set up the left and right keys, so that they rotate
the hero.  We could probably do this via the hero's `movement` component, but it
is easier to just work directly with its `rigidBody`.  We will give the body an
angular velocity (causing it to rotate at some number of rotations per second)
when a key is down-pressed, and set its angular velocity to zero when the key is
released.  Note that the units are not rotations per second, but radians per
second.  If you're not familiar with the difference, don't worry... you can just
change the numbers until things make sense.

```typescript
   // Set up arrow keys to control the hero
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(-6); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(0); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(6); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(0); });
```

Next, let's set up the space key.  Each time it is down-pressed, we'll try to
toss a grey circle in the direction the hero is facing.  This code requires us to remember a bit of trigonometry:

```typescript
    // Shoot!
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      // Compute a unit vector matching the hero's rotation.
      // Since our hero looks like it is pointing upward when its 
      // rotation is 0, we need to adjust this number by 90 degrees
      // (aka) PI/2 radians.
      let dx = Math.cos(h.rigidBody.getRotation() - Math.PI / 2);
      let dy = Math.sin(h.rigidBody.getRotation() - Math.PI / 2);
      // Get the hero's center
      let x = h.rigidBody.getCenter().x;
      let y = h.rigidBody.getCenter().y;
      // Make a projectile.  Notice that we can make all the parts 
      // and then pass them to `new Actor`, which might be easier 
      // to read.
      let rigidBody = new CircleBody({ radius: 0.125, cx: -100, cy: -100 });
      rigidBody.setCollisionsEnabled(true);
      let appearance = new FilledCircle({ radius: .125, fillColor: "#bbbbbb", z: 0 });
      let role = new Projectile();
      new Actor({ appearance, rigidBody, movement: new ProjectileMovement(), role });
      // Toss the projectile from the hero's center, at speed `scale`
      let scale = 8;
      role.tossAt(x, y, x + scale * dx, y + scale * dy, h, 0, 0);
    });
```

If you hover over the `tossAt` method, you'll see that it takes seven arguments:

- fromX / fromY: The center of the actor who is "tossing" the projectile
- toX / toY: A point that the projectile should move toward
- actor: The actor who appears to be tossing the projectile
- offsetX / offsetY: The distance between fromX/fromY and where the projectile
  should start.

We'll discuss these more in the tutorial about projectiles.  For now, what
matters is that we are making the projectile start right at the center of the
hero.  That's why we had to give the hero a Z of 1... the default is 0, so the
grey circle will appear to be under the hero, and emerge from the tip of the
hero.  (You should change the z from 1 to 0 and see what happens.)  Similarly,
we used `{collisionsEnabled: false}` for the hero, so that the projectile
wouldn't bounce off of it (again, try changing it and see what happens).  If
you're having trouble seeing how the changes are affecting your game, consider
changing `scale` to 1.

@@red WARNING@@ A projectile that goes off-screen will keep moving forever. You
could accidentally make thousands of projectiles, and your game will get slower
and slower over time as Box2D keeps simulating these projectiles moving off
toward infinity.  In a later tutorial, we'll learn how to fix this problem.

Next, let's make our enemies spawn.  We'll set up a timer that runs every two
seconds.  The timer will take some code (represented by `()=>{...}`) that it
will run each time two seconds transpire.

```typescript
    stage.world.timer.addEvent(new TimedEvent(2, true, () => {
      let angle = Math.random() * 2 * Math.PI;
      let hx = h.rigidBody.getCenter().x, hy = h.rigidBody.getCenter().y;
      let sx = 9 * Math.sin(angle) + hx, sy = 9 * Math.cos(angle) + hy;
      new Actor({
        appearance: new FilledCircle({ radius: .5, fillColor: "#F01100" }),
        rigidBody: new CircleBody({ cx: sx, cy: sy, radius: .5 }),
        role: new Enemy({ damage: 1 }),
        movement: new PathMovement(new Path().to(sx, sy).to(hx, hy), 3, false),
      });
    }));
```

Again, the hardest part of this code is probably the trig.  Let's quickly survey
what's happening.  Every two seconds, we use `Math.random()` to get a random
number.  That number will be in the range $[0\ldots1)$.  That's a decimal, so we
multiply it by $2\pi$ to get an angle, in radians.  Using some trig (and the
magic number 9), we compute a point that is 9 meters away from the hero's
center.  Then we use JetLag's `PathMovement` as we make an Actor, so that the
enemy will move from its initial point toward the center of the hero.  The enemy
will move at 3 meters per second.

When we make the `Enemy`, we indicate `{damage: 1}`.  In JetLag, heroes default
to a strength of 1, projectiles to a strength of 1, and enemies to damage
(strength) of 2.  By lowering the enemy damage to 1, we can be sure that a
single projectile collision will get rid of an enemy.

The last thing we do in this game is indicate what it means to "win", and what should happen after the level is won or lost:

```typescript
    stage.score.onWin = { level: level, builder: builder }
    stage.score.onLose = { level: level, builder: builder }
    stage.score.setVictoryEnemyCount(10);
```

The first two lines say "on win" (or "on lose"), build this level again.  The
third line says that defeating 10 enemies is the wa to win.

Putting it all together, here's all the code for our game.  In under 100 lines,
we've made a reasonable first prototype of a game.  Of course, it would take a
lot of work to turn this into something we could put on an app store, but the
hardest part is to get a working prototype.  Along the way, we saw timers,
enemies, projectiles, win conditions random numbers, and paths.  That's quite a
bit of JetLag that we were able to put to use.  Before moving on to other games,
you should be sure to try to make edits to this game.  Can you make it more fun?
Harder?  Different?  Did everything make sense?

```typescript
import { initializeAndLaunch, stage } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledCircle, FilledPolygon } from "../jetlag/Components/Appearance";
import { ManualMovement, Path, PathMovement, ProjectileMovement } from "../jetlag/Components/Movement";
import { CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Enemy, Hero, Projectile } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { GridSystem } from "../jetlag/Systems/Grid";
import { KeyCodes } from "../jetlag/Services/Keyboard";
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
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // Draw a grid on the screen, covering the whole visible area
  GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 16, y: 9 });

  // Make a hero
  let h = new Actor({
    appearance: new FilledPolygon({ vertices: [0, -.5, .25, .5, -.25, .5], fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044", z: 1 }),
    rigidBody: new PolygonBody({ cx: 8, cy: 4.5, vertices: [0, -.5, .25, .5, -.25, .5] }, { collisionsEnabled: false }),
    role: new Hero(),
    movement: new ManualMovement(),
  });

  // Set up arrow keys to control the hero
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(-6); });
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { h.rigidBody.body.SetAngularVelocity(0); });
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(6); });
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { h.rigidBody.body.SetAngularVelocity(0); });

  // Shoot!
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
    // Compute a unit vector matching the hero's rotation.
    // Since our hero looks like it is pointing upward when its 
    // rotation is 0, we need to adjust this number by 90 degrees
    // (aka) PI/2 radians.
    let dx = Math.cos(h.rigidBody.getRotation() - Math.PI / 2);
    let dy = Math.sin(h.rigidBody.getRotation() - Math.PI / 2);
    // Get the hero's center
    let x = h.rigidBody.getCenter().x;
    let y = h.rigidBody.getCenter().y;
    // Make a projectile.  Notice that we can make all the parts 
    // and then pass them to `new Actor`, which might be easier 
    // to read.
    let rigidBody = new CircleBody({ radius: 0.125, cx: -100, cy: -100 });
    rigidBody.setCollisionsEnabled(true);
    let appearance = new FilledCircle({ radius: .125, fillColor: "#bbbbbb", z: 0 });
    let role = new Projectile();
    new Actor({ appearance, rigidBody, movement: new ProjectileMovement(), role });
    // Toss the projectile from the hero's center, at speed `scale`
    let scale = 8;
    role.tossAt(x, y, x + scale * dx, y + scale * dy, h, 0, 0);
  });

  stage.world.timer.addEvent(new TimedEvent(2, true, () => {
    let angle = Math.random() * 2 * Math.PI;
    let hx = h.rigidBody.getCenter().x, hy = h.rigidBody.getCenter().y;
    let sx = 9 * Math.sin(angle) + hx, sy = 9 * Math.cos(angle) + hy;
    new Actor({
      appearance: new FilledCircle({ radius: .5, fillColor: "#F01100" }),
      rigidBody: new CircleBody({ cx: sx, cy: sy, radius: .5 }),
      role: new Enemy({ damage: 1 }),
      movement: new PathMovement(new Path().to(sx, sy).to(hx, hy), 3, false),
    });
  }));

  stage.score.onWin = { level: level, builder: builder }
  stage.score.onLose = { level: level, builder: builder }
  stage.score.setVictoryEnemyCount(10);
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config(), builder);
```

## An Overhead Game Where The World Is Bigger Than The Camera

In our very first game, back in the first tutorial, it was possible for the hero
to go off the screen.  The game is reproduced below, just in case you want to
convince yourself that it's a problem:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "/getting_started.html"
}
```

In this part of the tutorial, we'll start thinking about how to handle this
problem.  To begin with, let's be a bit more exact about what we are seeing.  In
the game, there is a hero and there is a camera.  The camera is centered on the
point (8, 4.5), which is the center of a world that starts at (0,0), is 16
meters wide, and is 9 meters high.  The camera has no reason to follow the hero
as the hero goes off screen, and the camera has no way of preventing the hero
from going off screen.  Indeed, it wouldn't even make sense for the camera to be
able to limit the hero's movement... we probably need to use some rigidBodies in
the `stage.world` for that purpose.

To explore this problem in more depth, here's the game we are going to make.  It
is not at all interesting or fun.  It consists of a large world (64x36 meters)
that the hero can navigate.  There is a yellow ball somewhere on the screen that
the hero needs to reach in order to win.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "/overview.html?2"
}
```

There is surprising complexity to this game:

- The world has boundaries
- The camera has boundaries
- The camera keeps the hero in view at all times
- We use a png file to put a background on the screen
- Clicking the right half of the screen causes the camera to zoom in
- Clicking the left half of the screen causes the camera to zoom out

Let's get started.  The first thing you should do is clear out your `game.ts`
file, so it looks like it did at the beginning of the "Camera+Gravity" game.

We're going to start by setting up our graphics.  You will need to download
these three files and put them in your `assets` folder:

- [noise.png](camera_gravity/noise.png)
- [green_ball.png](camera_gravity/green_ball.png)
- [mustard_ball.png](camera_gravity/mustard_ball.png)

Next, update your `Config` with this line:

```typescript
  imageNames = ["green_ball.png", "mustard_ball.png", "noise.png"];
```

When you run your game, be sure to press `F12` and check the console.  If JetLag
can't find any of these files, it will immediately stop and print an error.

Next, let's add the hero.  Once you save your code, the game should
automatically refresh in your browser, and you should see the green ball.  Since
we haven't configured tilt, the hero isn't going to be able to move yet.

```typescript
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

Now is a good time to stop and look at what happens when you mis-type an image
name.  Go ahead and change the text, maybe by capitalizing the "g" in
"green_ball".  You should see an error in the console.  Next, try changing "png"
to "pong".  That will result in a different error message.  (@@red Note: you may
see "Deprecation Warnings" or warnings about the "AudioContext"... these can be
ignored@@)

Next, let's make it so that our hero can move.  We're going to control the hero
with tilt, and we're going to simulate tilt using the keyboard.  If you are
planning on doing many tutorials, you'll discover that we are going to use this
same code many times.  That means it's a good candidate for a function.  So
let's make a function, and put it at the bottom of the file:

```typescript
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

This code won't do anything until we call it, so in your `builder()` function,
be sure to add this line:

```typescript
enableTilt(10, 10);
```

Since the hero uses `TiltMovement`, pressing the arrows will automatically cause
tilt to move the hero.  But, of course, this reveals our next problem: the hero
can still go off the screen.  We can fix this problem by requesting that the
camera always follow the hero:

```typescript
    // By default, the camera is centered on the point 8, 4.5f.  We can instead
    // have the camera stay centered on the hero, so that we can keep seeing the
    // hero as it moves around the world.
    stage.world.camera.setCameraFocus(h);
```

What just happened?  Now it seems like the hero isn't moving!  The problem is
that the camera is staying centered on the hero at all times.  With no
background, it's hard to see that the hero is moving.  We can convince ourselves
that it is moving, though, by opening up the developer console and clicking the
screen as we use the arrow keys.  You should see that the world coordinates are
changing as the hero moves.

Since we want a world that is 64x36 meters, a natural thing to do is to draw
some background images.  We'll use `noise.png` for that purpose:

```typescript
    // As the hero moves around, it's going to be hard to see that it's really
    // moving.  Draw some "noise" in the background.  Note that we're changing
    // the Z index.
    //
    // This code uses "for loops".  The outer loop will run 4 times (0, 16, 32,
    // 48).  Each time, the inner loop will run 4 times (0, 9, 18, 27), drawing
    // a total of 16 images.
    for (let x = 0; x < 64; x += 16) {
      for (let y = 0; y < 36; y += 9) {
        // This is kind of neat: a picture is just an actor without a role or rigidBody
        new Actor({
          appearance: new ImageSprite({ width: 16, height: 9, img: "noise.png", z: -1 }),
          rigidBody: new BoxBody({ cx: x + 8, cy: y + 4.5, width: 16, height: 9 }, { collisionsEnabled: false }),
        });
      }
    }
```

In the notes for this code, you can see that there are two loops.  Loops let us
do the same thing repeatedly.  In this case, we are using `for` loops, which
means that each has a "loop control variable" (`x` and `y`, respectively), which
changes on each iteration of the loop.  So in the end, this is going to make 16
copies of the "noise.png" image, and line them up in a big 64x36 space.  Note
that we are using `collisionsEnabled: false` and `z:-1` so that our hero won't
bounce off of these actors, and these actors will be behind the hero.

Since we only drew pictures, and didn't make obstacles, it is possible for our
hero to go outside of the boundaries of our nice image.  The next thing we'll do
is draw four thin obstacles that bound the space where we drew those pictures:

```typescript
    // Draw four walls, covering the four borders of the world
    new Actor({
      appearance: new FilledBox({ width: 64, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 32, cy: -.05, width: 64, height: .1 }),
      role: new Obstacle(),
    });
    new Actor({
      appearance: new FilledBox({ width: 64, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 32, cy: 36.05, width: 64, height: .1 }),
      role: new Obstacle(),
    });
    new Actor({
      appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: -.05, cy: 18, width: .1, height: 36 }),
      role: new Obstacle(),
    });
    new Actor({
      appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 64.05, cy: 18, width: .1, height: 36 }),
      role: new Obstacle(),
    });
```

You might be getting tired of hearing me say "now we have another problem".  But
notice that each time we added some code, we got *closer* to our goal.  And each
new problem was probably a bit simpler than the one before it.  Our new problem
is that the camera is keeping the hero centered, even when the hero is at the
extreme edges of what we want the world to be.  We can fix this by putting
boundaries on the camera.  As you add the following line, be sure to hover over
the `setBounds` method name so you can see its documentation:

```typescript
    // Set up some boundaries on the camera, so we don't show beyond the borders
    // of our background:
    stage.world.camera.setBounds(0, 0, 64, 36);
```

Our "game" isn't going to have any enemies.  Instead, we'll say that you win by
finding the destination.  To do that, we'll put a destination into the world,
indicate that the game is won when one hero reaches that destination, and then
tell JetLag to re-start the level when it is won:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 55, cy: 28, radius: 0.4 }),
      role: new Destination(),
    });

    // Set up win conditions and win behavior
    stage.score.setVictoryDestination(1);
    stage.score.onWin = { level: level, builder: builder }
```

The last thing we'll do in this game is add buttons for zooming in and out.  We
have a small issue when doing this, though.  Where should we put the buttons?
If we put them *in the world*, then they might not be on-screen, depending on
where the camera is focused.

To overcome this issue, JetLag actually runs two physics simulations at all
time.  `stage.world` is the one we've been working with so far.  `stage.hud`
(the heads up display) is a slightly less powerful physics simulation and camera
system.  This HUD is always exactly the size of the camera viewport, so anything
we put on the HUD will always be on screen.

The nicest part is that the HUD is pretty much just like the world... we put
actors on it in the exact same way, but add `{scene: stage.hud}` to tell the
rigidBody not to put itself in `stage.world`.

```typescript
    // add zoom buttons. We are using blank images, which means that the buttons
    // will be invisible... that's nice, because we can make the buttons big
    // (covering the left and right halves of the screen).  When debug rendering
    // is turned on, we'll be able to see an outline of the two rectangles. You
    // could also use images, but if you did, you'd probably want to use some
    // transparency so that they don't cover up the gameplay.

    // Note: these go on the HUD
    new Actor({
      appearance: new FilledBox({ width: 8, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 4, cy: 4.5, width: 8, height: 9 }, { scene: stage.hud }),
      gestures: {
        tap: () => {
          if (stage.world.camera.getScale() > 50) stage.world.camera.setScale(stage.world.camera.getScale() - 10);
          return true;
        }
      }
    });
    new Actor({
      appearance: new FilledBox({ width: 8, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 4.5, width: 8, height: 9 }, { scene: stage.hud }),
      gestures: {
        tap: () => {
          if (stage.world.camera.getScale() < 200) stage.world.camera.setScale(stage.world.camera.getScale() + 20);
          return true;
        }
      }
    });
```

In the above code, there is one more new feature: a `gestures` component.  This
lets us receive touch and mouse events on an actor, and run code in response to
them.  In this case, we change the effective pixel-to-meter ratio (via the
camera's `scale`) when either button is pressed.  This gives the effect of
zooming in or out.

To be honest, our zoom implementation isn't that great: the numbers 50, 10, 20,
and 200 make sense if you're running on an HD screen, but they don't necessarily
make sense for phones or games that aren't running in full-screen mode.  We
won't worry about that for now... once you gain more skill with game
development, you'll be able to figure out how to work around these kinds of
problems.

Here's the final code for this game:

```typescript
import { initializeAndLaunch, stage } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";

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
  imageNames = ["green_ball.png", "mustard_ball.png", "noise.png"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  let h = new Actor({
    appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
    rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
    movement: new TiltMovement(),
    role: new Hero(),
  });

  enableTilt(10, 10);

  // By default, the camera is centered on the point 8, 4.5f.  We can instead
  // have the camera stay centered on the hero, so that we can keep seeing the
  // hero as it moves around the world.
  stage.world.camera.setCameraFocus(h);

  // As the hero moves around, it's going to be hard to see that it's really
  // moving.  Draw some "noise" in the background.  Note that we're changing
  // the Z index.
  //
  // This code uses "for loops".  The outer loop will run 4 times (0, 16, 32,
  // 48).  Each time, the inner loop will run 4 times (0, 9, 18, 27), drawing
  // a total of 16 images.
  for (let x = 0; x < 64; x += 16) {
    for (let y = 0; y < 36; y += 9) {
      // This is kind of neat: a picture is just an actor without a role or rigidBody
      new Actor({
        appearance: new ImageSprite({ width: 16, height: 9, img: "noise.png", z: -1 }),
        rigidBody: new BoxBody({ cx: x + 8, cy: y + 4.5, width: 16, height: 9 }, { collisionsEnabled: false }),
      });
    }
  }

  // Draw four walls, covering the four borders of the world
  new Actor({
    appearance: new FilledBox({ width: 64, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 32, cy: -.05, width: 64, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: 64, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 32, cy: 36.05, width: 64, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -.05, cy: 18, width: .1, height: 36 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 64.05, cy: 18, width: .1, height: 36 }),
    role: new Obstacle(),
  });

  // Set up some boundaries on the camera, so we don't show beyond the borders
  // of our background:
  stage.world.camera.setBounds(0, 0, 64, 36);

  new Actor({
    appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
    rigidBody: new CircleBody({ cx: 55, cy: 28, radius: 0.4 }),
    role: new Destination(),
  });

  // Set up win conditions and win behavior
  stage.score.setVictoryDestination(1);
  stage.score.onWin = { level: level, builder: builder }

  // add zoom buttons. We are using blank images, which means that the buttons
  // will be invisible... that's nice, because we can make the buttons big
  // (covering the left and right halves of the screen).  When debug rendering
  // is turned on, we'll be able to see an outline of the two rectangles. You
  // could also use images, but if you did, you'd probably want to use some
  // transparency so that they don't cover up the gameplay.

  // Note: these go on the HUD
  new Actor({
    appearance: new FilledBox({ width: 8, height: 9, fillColor: "#00000000" }),
    rigidBody: new BoxBody({ cx: 4, cy: 4.5, width: 8, height: 9 }, { scene: stage.hud }),
    gestures: {
      tap: () => {
        if (stage.world.camera.getScale() > 50) stage.world.camera.setScale(stage.world.camera.getScale() - 10);
        return true;
      }
    }
  });
  new Actor({
    appearance: new FilledBox({ width: 8, height: 9, fillColor: "#00000000" }),
    rigidBody: new BoxBody({ cx: 12, cy: 4.5, width: 8, height: 9 }, { scene: stage.hud }),
    gestures: {
      tap: () => {
        if (stage.world.camera.getScale() < 200) stage.world.camera.setScale(stage.world.camera.getScale() + 20);
        return true;
      }
    }
  });
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config(), builder);

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

## A "Side-View" Game

Next, let's build a game where gravity is downward, and the camera is to the
"side" of the actors.  This is the perspective you might seen in a platformer
game, like Super Mario Bros, or in an endless runner game like Jetpack Joyride.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "/overview.html?3"
}
```

Before we start writing code, let's briefly discuss what is happening in this
game:

- There is a destination that the hero needs to reach in order to win
- There is a time limit
- Gravity is downward, the world has boundaries, and the camera follows the hero
- Arrow keys control the hero
- The space bar makes the hero jump

Note that in this game, there are no graphics assets.  That means we can start
by re-setting the code to the point it was at when we started the first part of
this tutorial.

The first thing we'll do is put a grid on the screen:

```typescript
    // Draw a grid on the screen, covering the whole visible area
    GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 32, y: 9 });
```

Next, let's set up the boundaries on the world.  Other than changing a few
numbers, this is the same code as in our last game.

```typescript
    // Based on the values in the Config object, we can expect to have a
    // screen that is a 16:9 ratio.  It will seem that the viewable area is 16
    // meters by 9 meters.  We'll make the "world" twice as wide.  All this
    // really means is that the camera won't show anything outside of the range
    // (0,0):(32,9):
    stage.world.camera.setBounds(0, 0, 32, 9);

    // Draw four walls, covering the four borders of the world
    new Actor({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: .05, width: 32, height: .1 }),
      role: new Obstacle(),
    });
    new Actor({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: 8.95, width: 32, height: .1 }),
      role: new Obstacle(),
    });
    new Actor({
      appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: .05, cy: 4.5, width: .1, height: 9 }),
      role: new Obstacle(),
    });
    new Actor({
      appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 31.95, cy: 4.5, width: .1, height: 9 }),
      role: new Obstacle(),
    });
```

Next, let's add a hero.  We'll say that when you click or tap the hero, it will
"jump".  JetLag has a better way of doing jumping, but for now, we'll just do it
this way, because this code is hopefully pretty familiar.

```typescript
    // Make a hero
    let h = new Actor({
      appearance: new FilledCircle({ radius: .75, fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .75 }),
      role: new Hero(),
      movement: new ManualMovement(),
      gestures: { tap: () => { (h.movement as ManualMovement).updateYVelocity(-8); return true; } },
    });
```

Tapping the hero does make it go up, but it never comes back down.  That's
because we need to put some gravity into the world.  Note that you could change
the gravity on the fly (for example, in response to a gesture).  That could make
for an interesting change to the gameplay.  For now, we'll just call
`setGravity` once, in builder, while setting up the game:

```typescript
    // This game will be a platformer/side scroller, so we want gravity
    // downward:
    stage.world.setGravity(0, 9.8);
```

Now let's configure the arrow keys, so the hero can move left/right:

```typescript
    // Set up arrow keys to control the hero
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ManualMovement).updateXVelocity(-5); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ManualMovement).updateXVelocity(0); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ManualMovement).updateXVelocity(5); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ManualMovement).updateXVelocity(0); });
```

Of course, we'll want the camera to follow the hero:

```typescript
    // Let the camera follow the hero
    stage.world.camera.setCameraFocus(h);
```

Next, we'll add a way to "win" the game.  This will involve a destination.
Notice that the destination doesn't have a `movement`, so its rigidBody will
just hover in place.

```typescript
    // Make a destination
    new Actor({
      appearance: new FilledCircle({ radius: .5, fillColor: "#00ff00", lineWidth: 3, lineColor: "#004400" }),
      rigidBody: new CircleBody({ cx: 31, cy: 6, radius: .5 }),
      role: new Destination(),
    });

    // Set up "winning"
    stage.score.onWin = { level: level, builder: builder }
    stage.score.setVictoryDestination(1);
```

If we want there to be a time limit, all we need to do is put a number into the
"lose countdown" timer:

```typescript
    // Set a timer for losing
    stage.score.setLoseCountdownRemaining(10);
    stage.score.onLose = { level: level, builder: builder }
```

While that counter worked, it would be annoying to play a game where the player
couldn't see how much time was left.  In JetLag, we can use text as the
appearance for an actor.  Unfortunately, just writing some text is probably not
going to look too good, so let's make two actors.  We'll put them both on the
HUD.  The first will just be a gray box.  The second will be the text.

```typescript
    // Draw a box, and write the timer on top of it.  Both go on the HUD
    new Actor({
      appearance: new FilledBox({ width: .75, height: .75, fillColor: "#eeeeee", lineWidth: 3, lineColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: .75, width: .75, height: .75 }, { scene: stage.hud }),
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#444444", size: 48 }, 
                                 () => (stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0)),
      rigidBody: new BoxBody({ cx: 8, cy: .75, width: 1.8, height: 1 }, { scene: stage.hud }),
    });
```

For the most part, this code looks like everything else we've been writing...
but then there's this part: `() => (stage.score.getLoseCountdownRemaining() ??
0).toFixed(0)`.  One reason this is complex is because of the rules of the
programming language we are using.  Briefly, until we said
`setLoseCountdownRemaining(10)`, calls to `getLoseCountdownRemaining()` would
not return a number... they'd return `undefined`.  So
`(stage.score.getLoseCountdownRemaining() ?? 0)` can be read as "the number of
seconds remaining, if it's not undefined, and 0 otherwise.  Then, we use
`toFixed(0)` to chop the decimal point off of the number.

But what about the `()=>` part?  First of all, that's shorthand.  We could have
said `() => { return (stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0);
}`.  But in TypeScript, if you are making a function using the `()=>{}` syntax,
and the body (in `{}`) only has a single return statement, then you can skip the
`{}` and skip the word `return`.

But that didn't address the real question.  Why do we need a function here?  Why
can't we just say `(stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0)`?
The answer is that every time we call `getLoseCountdownRemaining()`, we get its
current value.  But when we make the `TextSprite`, the game hasn't started yet!
If we read that value, it would be 10, and the counter would always report "10".

By wrapping the code like this (we sometimes say "making the code into a
callback" or "wrapping it in a lambda"), we're really saying that we want JetLag
to re-compute the text that is being displayed.  JetLag runs at 45 frames per
second, so we should expect the text to be re-computed that often.  If we did
`.toFixed(1)`, we'd see one decimal point.  If we did `.toFixed(2)`, we'd see
two decimal points, but the number wouldn't increment in units of .01, so we'd
actually be able to reverse engineer the frames per second.

As you're testing out this code, it might be a good idea to set `hitBoxes` to
false, so you can get a better sense for what the game would really look like.

To recap, here's all of the code we just wrote:

```typescript
import { initializeAndLaunch, stage } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, TextSprite } from "../jetlag/Components/Appearance";
import { ManualMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { GridSystem } from "../jetlag/Systems/Grid";
import { KeyCodes } from "../jetlag/Services/Keyboard";

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
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // Draw a grid on the screen, covering the whole visible area
  GridSystem.makeGrid(stage.world, { x: 0, y: 0 }, { x: 32, y: 9 });

  // Based on the values in the Config object, we can expect to have a
  // screen that is a 16:9 ratio.  It will seem that the viewable area is 16
  // meters by 9 meters.  We'll make the "world" twice as wide.  All this
  // really means is that the camera won't show anything outside of the range
  // (0,0):(32,9):
  stage.world.camera.setBounds(0, 0, 32, 9);

  // Draw four walls, covering the four borders of the world
  new Actor({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: .05, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 16, cy: 8.95, width: 32, height: .1 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: .05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 31.95, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });

  // Make a hero
  let h = new Actor({
    appearance: new FilledCircle({ radius: .75, fillColor: "#0000ff", lineWidth: 3, lineColor: "#000044" }),
    rigidBody: new CircleBody({ cx: 3, cy: 3, radius: .75 }),
    role: new Hero(),
    movement: new ManualMovement(),
    gestures: { tap: () => { (h.movement as ManualMovement).updateYVelocity(-8); return true; } },
  });

  // This game will be a platformer/side scroller, so we want gravity
  // downward:
  stage.world.setGravity(0, 9.8);

  // Set up arrow keys to control the hero
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ManualMovement).updateXVelocity(-5); });
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (h.movement as ManualMovement).updateXVelocity(0); });
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ManualMovement).updateXVelocity(5); });
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (h.movement as ManualMovement).updateXVelocity(0); });

  // Let the camera follow the hero
  stage.world.camera.setCameraFocus(h);

  // Make a destination
  new Actor({
    appearance: new FilledCircle({ radius: .5, fillColor: "#00ff00", lineWidth: 3, lineColor: "#004400" }),
    rigidBody: new CircleBody({ cx: 31, cy: 6, radius: .5 }),
    role: new Destination(),
  });

  // Set up "winning"
  stage.score.onWin = { level: level, builder: builder }
  stage.score.setVictoryDestination(1);

  // Set a timer for losing
  stage.score.setLoseCountdownRemaining(10);
  stage.score.onLose = { level: level, builder: builder }

  // Draw a box, and write the timer on top of it.  Both go on the HUD
  new Actor({
    appearance: new FilledBox({ width: .75, height: .75, fillColor: "#eeeeee", lineWidth: 3, lineColor: "#000000" }),
    rigidBody: new BoxBody({ cx: 8, cy: .75, width: .75, height: .75 }, { scene: stage.hud }),
  });
  new Actor({
    appearance: new TextSprite({ center: true, face: "Arial", color: "#444444", size: 48 },
      () => (stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0)),
    rigidBody: new BoxBody({ cx: 8, cy: .75, width: 1.8, height: 1 }, { scene: stage.hud }),
  });
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config(), builder);
```

## A Vertical Perspective

For the last game in this tutorial, we'll make the start of a doodle jump-like
game.  In the live demo below, you can use arrows to move left/right, and the
space bar to jump.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "/overview.html?4"
}
```

This game requires the following assets:

- [green_ball.png](camera_gravity/green_ball.png)
- [mustard_ball.png](camera_gravity/mustard_ball.png)
- [night_0.png](camera_gravity/night_0.png)
- [night_1.png](camera_gravity/night_1.png)

After you've downloaded them to your `assets` folder, be sure to update this
line in your `Config` object:

```typescript
  imageNames = ["green_ball.png", "mustard_ball.png", "night_0.png", "night_1.png"];
```

We'll start by making a hero, setting up gravity, drawing a floor, and setting
up the camera bounds:

```typescript
    // Start with gravity and camera bounds
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, undefined, 16, 9);

    // Every level will use tilt to control the hero, with arrow keys simulating
    // tilt on devices that lack an accelerometer
    stage.tilt.tiltMax.Set(10, 10);
    if (!stage.accelerometer.tiltSupported) {
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
    }

    // Make the floor
    new Actor({
      appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 20, height: .1 }),
      role: new Obstacle(),
    });

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    stage.world.camera.setCameraFocus(h, 0, -2);
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));
```

This code is pretty similar to things we've seen before, but there are a few
interesting differences.

The first thing to notice is that the call to `camera.setBounds` has `undefined`
for its second argument.  If you hover your mouse over `setBounds`, you'll see
that the second argument is the *minimum* Y value.  Remember that down is
positive.  If we want a game that could keep going on forever, with the hero
moving up, our only option is to have negative Y values that keep getting more
and more negative.

The second thing that is a bit different is that the call to `setCameraFocus`
has two extra arguments.  By providing `x=0` and `y=-2`, we're indicating that
we want the camera to focus on a point that is 2 meters *above* the hero.  This
will make it easier to see more of the screen while playing.

Third, notice that we didn't use the `enableTilt` function that we wrote
earlier.  That's because we only want tilt for left/right.

Lastly, we set the space bar to make the hero `jump`.  There is a rather
complicated concept here: if we just added a negative Y velocity to the hero,
how could we know when the hero could jump again?  Our game kind of requires the
hero to only jump after landing on a platform.  Fortunately, in JetLag, we can
use the `Hero.jump` to give an upward velocity, and JetLag will not let the hero
jump again until after it collides with an obstacle.  That gets us the desired
condition for when the hero can jump again.

If you just tried moving left or right, soon the hero would go off screen and
never come back, because it would walk off of the floor we made.  To address the
problem, let's put some enemies off screen.  Since there's a way to lose, we
need to tell JetLag to restart this level if the hero collides with an enemy and
"loses" the level.

```typescript
    // Make the sides as enemies, but put them a tad off screen, because
    // that's a bit more kind
    new Actor({
      appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: -1, cy: -9, width: .1, height: 36 }),
      role: new Enemy(),
    });
    new Actor({
      appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 17, cy: -9, width: .1, height: 36 }),
      role: new Enemy(),
    });
    stage.score.onLose = { level: level, builder: builder }
    // Note that there's an intentional bug in this code: these enemies don't go
    // as high as they should.  Can you tell why?
```

Next, let's provide a way to win, by putting a destination very high up in the
sky.  Remember that "high" means "negative y".

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: -26, radius: 0.5 }),
      role: new Destination(),
    });
    stage.score.setVictoryDestination(1);
    stage.score.onWin = { level: level, builder: builder }
```

We need a way for the hero to get up to that destination.  Let's make a function
that can make obstacles (platforms).  You can put this function *inside* the
`builder` function.

```typescript
    // create a platform that we can jump through from below
    function platform(cx: number, cy: number) {
      new Actor({
        appearance: new FilledBox({ z: -1, width: 2, height: 0.2, fillColor: "#FF0000" }),
        rigidBody: new BoxBody({ cx, cy, width: 2, height: 0.2, }, { collisionsEnabled: true, singleRigidSide: Sides.TOP }),
        // Set a callback, then re-enable the platform's collision effect.
        role: new Obstacle({ heroCollision: (_thisActor: Actor, collideActor: Actor) => (collideActor.movement as ManualMovement).updateYVelocity(-5) }),
      });
    }
```

In this function, we make an actor at the `cx, cy` coordinates that were
provided to it.  Notice how we don't need to say `{cx: cx, cy: cy}`.  TypeScript
has a nice shorthand when the value on the left side of a `:` has the same name
as is expected on the left side.

These obstacles have two new features.  The first is that they use
`singleRigidSide`, which means that an actor can only collide with the obstacle
by falling down onto it.  Actors, like the hero, can jump upward and pass
through the obstacle.  Second, we've provided an optional `heroCollision` code
for the Obstacle role.  This says that when a hero collides with the platform,
it should get a tiny upward jolt, to make it seem like it is bouncing.

Now we can use our function to make a bunch of platforms, each higher than the
last:

```typescript
    platform(3, 7.5);
    platform(5, 3.5);
    platform(3, -1.5);
    platform(6, -5.5);
    platform(10, -9.5);
    platform(3, -13.5);
    platform(4, -17.5);
    platform(5, -21.5);
    platform(6, -24.5);
```

(Now that it's possible to get very high, you should be able to figure out
what's wrong with our enemies.)

The last thing we'll do is make the background more interesting.  We saw before
that it's possible to use an image for the background.  We can also *animate*
images, by flipping between them rapidly.

```typescript
    // Set up an animated parallax background
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 550, repeat: true, images: ["night_0.png", "night_1.png"] }))
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5 }, imageMaker: () => new AnimatedSprite({ width: 16, height: 9, animations }), speed: 0.3, isHorizontal: false, isAuto: false });```
```

Animations are a complex topic, and there is a whole tutorial devoted to them.
For now, all we really need to understand is that we made an AnimationSequence
that spends 550 milliseconds on each of its two images, and loops.  Then we used
a "map" to associate it with the "IDLE_E" state, which is the default state (it
means "facing to the east, not moving", but that's not really important right
now).

But we also didn't exactly make an *Actor* here.  Instead, we provided code for
making AnimatedSprites from that map, and we used it to tell the stage's
background system to tile the image vertically, so that the infinite level would
generate its infinite tiles of background on demand.  We also gave it a speed of
0.3, which means that it moves more slowly than the hero.  This is known as a
"Parallax" background, and it gives a nice sense of depth.

Here's the code for the whole game:

```typescript
import { initializeAndLaunch, stage } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig, Sides } from "../jetlag/Config";
import { AnimatedSprite, FilledBox, ImageSprite } from "../jetlag/Components/Appearance";
import { ManualMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";

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
  imageNames = ["green_ball.png", "mustard_ball.png", "night_0.png", "night_1.png"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // Start with gravity and camera bounds
  stage.world.setGravity(0, 10);
  stage.world.camera.setBounds(0, undefined, 16, 9);

  // Every level will use tilt to control the hero, with arrow keys simulating
  // tilt on devices that lack an accelerometer
  stage.tilt.tiltMax.Set(10, 10);
  if (!stage.accelerometer.tiltSupported) {
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
  }

  // Make the floor
  new Actor({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 9.05, width: 20, height: .1 }),
    role: new Obstacle(),
  });

  let h = new Actor({
    appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
    rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { disableRotation: true }),
    movement: new TiltMovement(),
    role: new Hero(),
  });
  stage.world.camera.setCameraFocus(h, 0, -2);
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));

  // Make the sides as enemies, but put them a tad off screen, because
  // that's a bit more kind
  new Actor({
    appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: -1, cy: -9, width: .1, height: 36 }),
    role: new Enemy(),
  });
  new Actor({
    appearance: new FilledBox({ width: .1, height: 36, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 17, cy: -9, width: .1, height: 36 }),
    role: new Enemy(),
  });
  stage.score.onLose = { level: level, builder: builder }
  // Note that there's an intentional bug in this code: these enemies don't go
  // as high as they should.  Can you tell why?

  new Actor({
    appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
    rigidBody: new CircleBody({ cx: 15, cy: -26, radius: 0.5 }),
    role: new Destination(),
  });
  stage.score.setVictoryDestination(1);
  stage.score.onWin = { level: level, builder: builder }

  // create a platform that we can jump through from below
  function platform(cx: number, cy: number) {
    new Actor({
      appearance: new FilledBox({ z: -1, width: 2, height: 0.2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx, cy, width: 2, height: 0.2, }, { collisionsEnabled: true, singleRigidSide: Sides.TOP }),
      // Set a callback, then re-enable the platform's collision effect.
      role: new Obstacle({ heroCollision: (_thisActor: Actor, collideActor: Actor) => (collideActor.movement as ManualMovement).updateYVelocity(-5) }),
    });
  }

  platform(3, 7.5);
  platform(5, 3.5);
  platform(3, -1.5);
  platform(6, -5.5);
  platform(10, -9.5);
  platform(3, -13.5);
  platform(4, -17.5);
  platform(5, -21.5);
  platform(6, -24.5);

  // Set up an animated parallax background
  let animations = new Map();
  animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 550, repeat: true, images: ["night_0.png", "night_1.png"] }))
  stage.background.addLayer({ anchor: { cx: 8, cy: 4.5 }, imageMaker: () => new AnimatedSprite({ width: 16, height: 9, animations }), speed: 0.3, isHorizontal: false, isAuto: false });
}

// call the function that starts running the game in the `game-player` div tag
// of `index.html`
initializeAndLaunch("game-player", new Config(), builder);
```

## Wrapping Up

This tutorial introduced **a lot** of new features.  It showed how we can make
small changes to achieve big differences in our games, and it explained how the
camera and gravity work together to define the perspective in a game.  It might
be a good idea to read through it again, just to make sure you're comfortable
with all of these ideas.  Then be sure to move on to the next tutorial, where we
learn more about the physics simulation.

```md-config
page-title = The Camera and Gravity

img {display: block; margin: auto; max-width: 500px;}
.red {color: red;}
```
