# Gesture-Based Input

Mouse and touch inputs are among the most common ways of interacting with a
game.  This tutorial explores their use in JetLag.

## A Warning About Imports

In this tutorial, we'll encounter a few situations where JetLag expects you to
provide a `b2Vec2` object.  `b2Vec2` is the way that Box2D stores an x,y
coordinate.  You might find that VSCode has trouble determining what to import
in that code.  If so, you should paste this line at the top of your file:

```typescript
import { b2Vec2 } from "@box2d/core";
```

## Getting Started

For this tutorial, you'll want top copy the `wideBoundingBox()` function from
the tutorial on graphical assets.  You'll also need the regular `boundingBox()`
function, the `sprites.json` spritesheet, and `noise.png`.  You should be able
to find these files and configure them based on what you learned in previous
tutorials.

In addition, the mini-games we make in this tutorial will involve winning and
losing, so you'll probably want to put these lines at the top of `builder()`, so
that they can be used by each mini-game:

```typescript
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };
```

## Tap: The Most Basic Gesture

Tapping is the most straightforward gesture.  When the device running your game
supports touch, tap represents a touch and release of the touch screen.
Otherwise, it is accomplished by clicking and releasing while your mouse is over
a specific actor.

The big question when setting up tap is "what should be tappable".  It's easy to
think "the actor", but if an actor moves around a lot, then it might be hard to
tap.  Especially for mobile devices, sometimes the right answer is to just cover
the whole screen with a button.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?1"
}
```

In this mini-game, you need to jump and collide with the destination.  If you
miss it, you'll keep moving to the right, and you'll collide with an invisible
enemy, causing the level to restart.  The whole screen is tappable.

We start the level by creating a bounding box, setting up gravity, and making a
hero who is always moving:

```typescript
    boundingBox();
    stage.world.setGravity(0, 10);

    // A hero who can jump and who is moving
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).setAbsoluteVelocity(5, 0);
```

Next, we can add the destination and an enemy:

```typescript
    // A destination to reach
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 11, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });

    // If you don't make it, you'll lose
    new Actor({
      appearance: new FilledBox({ width: .1, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 15.95, cy: 4.5, width: .1, height: 9 }),
      role: new Enemy(),
    });
```

Finally, we make the button:

```typescript
    new Actor({
      appearance: new FilledBox({ width: 0.1, height: 0.1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { tap: () => { (hero.role as Hero).jump(0, -7.5); return true; } }
    });
```

## Using The HUD

Our last mini-game worked, but it was a **bad design**.  The problem is that we
put the button in the world.  If we made the world bigger, the button could go
out of view.

In the next game, we'll put the invisible button *on the HUD*.  This is an
important point... since the world is large, putting the button on the HUD is
the only reasonable way to make sure it doesn't go out of view.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?2"
}
```

To make this game, we'll start by setting up a wider bounding box, and then
setting the camera bounds:

```typescript
    wideBoundingBox();
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, 0, 32, 9);
```

Any time the world gets large, and the camera centers on the hero, it's easy for
it to look like the hero isn't moving.  Having a varied background addresses the
problem, so we'll stretch `noise.png` to cover the visible world:

```typescript
    new Actor({
      appearance: new ImageSprite({ z: -2, width: 32, height: 9, img: "noise.png" }),
      rigidBody: new BoxBody({ cx: 16, cy: 4.5, width: .1, height: .1 }),
    });
```

Again, we'll make a hero, but this time we'll focus the camera on it:

```typescript
    // A hero who can jump and who is moving
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).setAbsoluteVelocity(5, 0);
    stage.world.camera.setCameraFocus(hero);
```

Also, we'll make a destination and an enemy that covers the right wall of the
world, so that the level will restart if the hero doesn't reach the destination.

```typescript
    // A destination to reach
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 27, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });

    // If you don't make it, you'll lose
    new Actor({
      appearance: new FilledBox({ width: .1, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 31.95, cy: 4.5, width: .1, height: 9 }),
      role: new Enemy(),
    });
```

Finally, we'll make our button, but this time we'll put it on the HUD:

```typescript
    // A button for jumping
    new Actor({
      appearance: new FilledBox({ width: 0.1, height: 0.1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }), // put it on the HUD
      gestures: { tap: () => { (hero.role as Hero).jump(0, -7.5); return true; } }
    });
```

## Introduction to Pan Gestures

Pan gestures are extremely powerful: they let us draw and drag, which can both
lead to exciting gameplay options.  In this example, we'll make an on-screen
joystick that uses pan gestures to control a hero.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?3"
}
```

Panning has three parts: what to do when the pan begins, what to do while it
continues, and what to do when it ends.  In the case of our joystick, the key
thing is to figure out where the gesture is occurring, relative to the center of
the joystick image.  We can use that position to compute a distance and
direction (i.e., a vector) and then apply that to the actor to make it move.

We'll start by making a border, a hero, and a destination:

```typescript
    boundingBox();

    // A hero with ManualMovement, so that the joystick can control it
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    // A destination to reach
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 11, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });
```

Before we draw the joystick, we need to make a plan:

- We'll put the joystick on the HUD, with a center at (1, 8) and a radius of 1.
- We'll store the joystick coordinates in variables, because we're probably
  going to refer to them in many places, and if we change the location, we don't
  want to have to update lots of code.
- When there's a down-press (`panStart`), or when there's a move (`panMove`),
  we'll compute a vector from the center of the joystick to the touch point, and
  use it to give the hero velocity.
- When there's an up-press, we'll stop the hero, and we'll also stop it from
  rotating (both of these are options we could skip).
- We won't give the hero a fixed velocity when it moves... we'll use the
  distance from the center of the joystick.  Since this might be a small number,
  we'll multiply it by a `scale`.  By putting `scale` in a variable, we can
  easily change it by changing one number in one place in the code.

The functions for moving and stopping, along with the constants for the joystick
location and scale, look like this:

```typescript
    let jcx = 1, jcy = 8; // center of joystick
    let scale = 2;
    // here's code for moving the hero, based on how hard we're pushing the
    // joystick and where the touch is relative to the joystick center
    function doMove(_actor: Actor, hudCoords: { x: number; y: number }) {
      (hero.movement as ManualMovement).setAbsoluteVelocity(scale * (hudCoords.x - jcx), scale * (hudCoords.y - jcy));
      return true;
    }
    // And here's code for stopping the hero:
    function doStop() {
      (hero.movement as ManualMovement).setAbsoluteVelocity(0, 0);
      hero.rigidBody.clearRotation(); // be sure to try without this
      return true;
    }
```

Now we can draw the joystick on the HUD.

```typescript
    // Make a joystick
    new Actor({
      appearance: new ImageSprite({ width: 2, height: 2, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: jcx, cy: jcy, radius: 1 }, { scene: stage.hud }),
      gestures: { panStart: doMove, panMove: doMove, panStop: doStop },
    });
```

Notice that if you glide your finger off the joystick, the panStop event won't
happen.  That is a problem that can be fixed, but we're not going to worry about
it for now.

## Hud Gestures That Interact With The World

In the previous example, pan was controlling an actor who was in `stage.world`,
but the joystick did not *feel* like part of the world.

Let's go back to the tap gesture now, but this time, we'll say that whenever you
tap the top half of the screen, some new actor should be created *in the world*.
Since the button is on the HUD, we'll need a way to translate from HUD
coordinates to world coordinates.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?4"
}
```

To start writing this mini-game, we'll make a wide world and put a hero in it.
The hero will move rightward with a fixed velocity, and we'll put a background
image on the world:

```typescript
    wideBoundingBox();
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, 0, 32, 9);
    new Actor({
      appearance: new ImageSprite({ z: -2, width: 32, height: 9, img: "noise.png" }),
      rigidBody: new BoxBody({ cx: 16, cy: 4.5, width: .1, height: .1 }),
    });

    // A hero who is moving
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 8.5, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).setAbsoluteVelocity(5, 0);
    stage.world.camera.setCameraFocus(hero);
```

We'll draw a button on the top half of the HUD.  The `appearance` and
`rigidBody` should be pretty easy to figure out.  But the `tap()` gesture code
will be kind of tricky.

In the code below, you'll see that `tap()` actually receives two parameters: the
actor who was tapped, and the coordinates of the tap.  These coordinates are
within the world where the actor exists, so in this code, I gave them the name
`hudMeters`, to remind myself that the unit is meters, and the coordinates are
related to the HUD.  I could have called them anything, but meaningful names
make it easier to understand tricky code.  And to be honest, *all code is tricky
code*.  That may seem ridiculous to say, because when you write code, and you
get it to work, it seems easy.  But when you write big programs (like games!),
you might not look at some code for weeks, or months.  In that case, you'll be
much happier if you put good comments in your code and used good variable names
when you wrote it.

Getting back to the code: we need to translate the coordinates from HUD to
world.  The trick is that JetLag's cameras understand how to translate back and
forth between their associated world and the coordinates of the physical screen.
So in the code below, we can use `stage.hud.camera.metersToScreen()` to turn the
HUD meter coordinates into raw pixel coordinates, and then use
`stage.world.camera.screenToMeters()` to turn those raw pixel coordinates into
meter coordinates in the world.  Once we have those coordinates, we can make a
goodie at the location where the touch happened.  Giving it a `GravityMovement`
is a nice effect.

```typescript
    new Actor({
      appearance: new FilledBox({ width: 0.1, height: 0.1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 2.25, width: 16, height: 4.5 }, { scene: stage.hud }), // put it on the HUD
      gestures: {
        tap: (_actor: Actor, hudMeters: { x: number, y: number }) => {
          // We need to translate the coordinates from the HUD to the world.  We
          // do that by turning them into screen coordinates, then turning them
          // back.
          let screenPixels = stage.hud.camera.metersToScreen(hudMeters.x, hudMeters.y);
          let worldMeters = stage.world.camera.screenToMeters(screenPixels.x, screenPixels.y);
          new Actor({
            appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
            rigidBody: new CircleBody({ cx: worldMeters.x, cy: worldMeters.y, radius: .25 }),
            movement: new GravityMovement(),
            role: new Goodie(),
          });
          return true;
        }
      }
    });
```

## Dragging Actors

We can use `panMove` as a way to drag an actor on the screen.  Of course, this
will again require us to put the actor who receives the `pan` gestures on the
HUD.  Here's the game we'll build:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?5"
}
```

We'll start the level by making a border, setting gravity, and then drawing
three obstacles.

The challenge we're going to face here is that dragging (i.e., `panMove`) needs
to be received by some actor.  We saw with the joystick that when your finger
glided off the joystick, there was no `panStop` event.  This seems like it's
going to be an even bigger problem if we take our tiny little obstacles and
attach `pan` gestures to them.  So instead, we're going to put an actor on the
HUD, and have it receive the `pan` gestures.  But then how can we know which
actors are draggable, and which aren't?  Our solution will be to mark the
obstacles by putting some information in their `extra` field.

```typescript
    boundingBox();
    stage.world.setGravity(0, 10);

    // draw two obstacles that we can drag, and one that we can't.  The whole
    // key to deciding who is draggable and who isn't will be whether we give
    // them "extra" information.
    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 2, radius: 0.375 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Obstacle(),
      extra: { drag: true }
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 1, radius: 0.375 }, { elasticity: 1 }),
      movement: new ManualMovement(),
      role: new Obstacle(),
      extra: { drag: true }
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 13, cy: 1, radius: 0.375 }, { elasticity: 1 }),
      movement: new ManualMovement(),
      role: new Obstacle(),
    });
```

We're going to want to put an actor on the HUD, covering the whole screen.  When
we do, how will we know which actor is being dragged (if any)?

Fortunately, Box2D lets us ask the world to give us every actor at a certain
point.  So if we turn the hud coordinates of the `panStart` into world
coordinates, we can then give those coordinates to `stage.world.physics` and it
will give us all the actors who might be receiving a touch.  `panStart` won't
actually do any moving, but if it finds such an actor, it will save it in a
variable, so that `panMove` will know who to move.  Notice that this also lets
us ignore `panStart` on the obstacle that doesn't have an `extra`.

In the code below, `foundActor` is the actor that `panStart` finds:

```typescript
    // We need a way to keep track of the actor currently being dragged.  We'll
    // use this local variable (but we *could* use "level" storage)
    let foundActor: Actor | undefined;
    // pan start updates foundActor if there is an actor where the touch began
    let panStart = (_actor: Actor, hudCoords: { x: number; y: number }) => {
      // Turn HUD coordinates to world coordinates
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let world_coords = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      // Ask the physics world for all actors at that position, and stop when we find one who is draggable:
      for (let actor of stage.world.physics!.actorsAt(world_coords)) {
        if (actor.extra.drag) {
          foundActor = actor;
          return true;
        }
      }
      return false;
    };
```

Now we can define `panMove` as a function that turns the HUD coordinates of the
`panMove` event into world coordinates, and moves the actor to that point.

```typescript
    // pan move changes the actor's position
    let panMove = (_actor: Actor, hudCoords: { x: number; y: number }) => {
      // If we have an Actor, move it using the translated coordinates
      if (!foundActor) return false;
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      foundActor.rigidBody?.setCenter(meters.x, meters.y);
      return true;
    };
```

When the `pan` event ends, we'll set `foundActor` back to `undefined`.  Notice
that while we were dragging, the actor might not have been correctly interacting
with other rigid bodies or gravity.  Calling `SetAwake()` lets Box2D know that
it needs to get caught up with the new location.

```typescript
    // pan stop clears foundActor to stop letting this actor be dragged
    let panStop = () => {
      if (!foundActor) return false;
      // This turns gravity back on, if appropriate
      foundActor.rigidBody.body.SetAwake(true);
      foundActor = undefined;
      return true;
    };
```

Now we have all the code we need, so let's cover the HUD with a button that
handles the pan gestures:

```typescript
    new Actor({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { panStart, panMove, panStop },
    });
```

If you were to combine this mini-game with the previous one, you could use pan
gestures to draw actors on the screen.  This may seem like a silly idea, but
sometimes silly ideas can be big hits.  More than 1M downloads came from a game
that noticed that you could use panMove as a way to "scribble" on the screen to
make a track for a car to drive on!

## The Flick/Swipe Gesture

Mobile games popularized the idea of flicking/swiping as a way to control
actors.  Let's see how to do it in JetLag:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?6"
}
```

In this mini-game, most of the code is similar to what we saw in the dragging
example.  We'll create a border, set gravity, and make some actors.  The ones
who can be flicked will have an `extra` field containing the speed at which they
should move.

```typescript
    boundingBox();
    stage.world.setGravity(0, 10);

    // create a few Actors that can be flicked, and one who cannot
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
      extra: { flickSpeed: 1 }
    });
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 6, radius: 0.4 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Obstacle(),
      extra: { flickSpeed: 0.5 }
    });
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 6, cy: 5, radius: 0.4 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Obstacle(),
    });
```

The main difference between swipe and pan is that swipe is a single event: we
don't see its start, move, and end as separate entities.  Instead, we get the
actor who received the swipe, the coordinate where the swipe began, the
coordinate where it ended, and the time that it took for the player to perform
the swipe.

Using this information, we have to do many things:

1. Figure out if there is an actor at the world coordinate that corresponds to
   where the swipe started.
2. Compute the velocity (direction, magnitude) of the line from the starting
   coordinate to the ending coordinate.
3. Multiply that velocity by the speed that we assigned to the actor.
4. Apply that velocity to the actor.

```typescript
    // A swipe gesture consists of starting coordinates and ending coordinates,
    // as well as the amount of time the swipe took
    let swipe = (_actor: Actor, hudCoord1: { x: number; y: number }, hudCoord2: { x: number; y: number }, time: number) => {
      // Convert starting coordinates from hud to world
      let screenCoord1 = stage.hud.camera.metersToScreen(hudCoord1.x, hudCoord1.y);
      let worldCoord1 = stage.world.camera.screenToMeters(screenCoord1.x, screenCoord1.y);
      // Is there a flickable actor there?
      let foundActor: Actor | undefined = undefined;
      for (let actor of stage.world.physics!.actorsAt(worldCoord1)) {
        if (actor.extra.flickSpeed != undefined) {
          foundActor = actor;
          break;
        }
      }
      if (!foundActor) return false;

      // Figure out the velocity to apply, then apply it
      let v = new b2Vec2(hudCoord2.x, hudCoord2.y)
      v = v.Subtract(hudCoord1);
      v.Normalize();
      v.Scale(foundActor.extra.flickSpeed * 2000 / time);
      (foundActor.movement as ManualMovement).updateVelocity(v.x, v.y);
      return true;
    };
```

Once again, we see that the function for what to do is much more complicated
than the code for making the button:

```typescript
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { swipe }
    });
```

In the code above, one interesting thing to note is that we never bothered to
translate the vector from hud coordinates to world coordinates.  That's safe,
because both were in meters.  However, if we had some notion of zoom, then we
might need to scale the vector by the zoom factor.  Another thing you'll notice
is that we didn't scale the vector by `flickspeed/time`.  Instead we also
multiplied it by 2000.  I chose 2000 because it made things feel right.  You
will find that for your games, based on actor sizes and densities, you might
have to come up with a multiplier like that.  It usually requires some trial and
error.

## Gestures In The HUD And World

In the previous levels, any single kind of gesture only happened in one place.
That doesn't always make sense.  For example, suppose that we wanted to make a
game where you could tap an actor, then tap the screen, and the actor would
teleport to that location.  Should the HUD get the tap first?  Should the world?

First, let's look at the game we're making.  There are three actors.  Tapping
one "activates it".  Tapping the screen will make one actor "teleport" to that
spot, another move *to* that spot via a path, and the third actor move *toward*
that spot, but not stop when it reaches it.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?7"
}
```

By default, JetLag routes gestures to the HUD first, and the world second.  We
can override this behavior:

```typescript
    // This effectively puts the tappable region "under" the world, so that
    // pokes can find an actor before trying to move an actor.
    stage.gestures.gestureHudFirst = false;
```

Then we'll put a border on the world:

```typescript
    boundingBox();
```

Each actor is going to have an `extra` that has a function in it called
`poke_responser`.  The idea is that tapping an actor will "activate" it, and
tapping anywhere else will call the activated actor's `poke_responder`.  So
then, the first thing we'll need is a way to track the activated actor:

```typescript
    // Track the actor most recently tapped
    let lastTapActor: Actor | undefined = undefined;
```

Next, let's make an actor who can "teleport".  Tapping it will "activate" it.
Double-tapping will remove it.  We'll detect a double tap by recording the time
of the tap.  Two taps within 300 milliseconds feels about right for a double
tap, so we'll compare the time of the taps and see if they're less than 300ms
apart.  Finally, the `poke_responder` will simply change the coordinates of this
actor.

```typescript
    let teleport_actor = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 1, radius: .5 }),
      gestures: {
        tap: () => {
          let x = stage.renderer.now; // Time of this tap
          // If it's been less than 300 milliseconds since the last tap, remove
          // it
          if (x - teleport_actor.extra.last_tap < 300 && lastTapActor == teleport_actor) {
            lastTapActor = undefined;
            teleport_actor.remove();
            return true;
          }
          // Otherwise, remember the time of the tap, and that it is activated
          teleport_actor.extra.last_tap = x;
          lastTapActor = teleport_actor;
          return true;
        }
      },
      extra: {
        last_tap: 0,
        poke_responder: (meters: { x: number, y: number }) => { teleport_actor.rigidBody.setCenter(meters.x, meters.y); }
      }
    });
```

Next, let's make the actor who moves via a path.  The tricky issue here is that
we need it to start with a path, because we can't change the `movement` on the
fly.  So we give it a path with one point and zero velocity.  Then, in its
`poke_responder()`, we reset its speed and angular velocity, then give it a new
path.

```typescript
    // make an actor who can move along a path.
    let path_actor = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 2, radius: .5 }),
      movement: new PathMovement(new Path().to(14, 1), 0, false),
      gestures: {
        tap: () => { lastTapActor = path_actor; return true; }
      },
      extra: {
        poke_responder: (meters: { x: number, y: number }) => {
          let r = new Path().to(path_actor.rigidBody.getCenter().x, path_actor.rigidBody.getCenter().y).to(meters.x, meters.y);
          path_actor.rigidBody.body.SetLinearVelocity({ x: 0, y: 0 });
          path_actor.rigidBody.body.SetAngularVelocity(0);
          (path_actor.movement as PathMovement).resetPath(r, 5, false);
        }
      }
    });
```

Our third actor will move *toward* the position that was poked.  This requires a
little bit of trig, to compute the direction.

```typescript
    // This actor will move in a direction, but won't stop
    let walk_actor = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 3, radius: .5 }),
      movement: new ManualMovement(),
      gestures: {
        tap: () => { lastTapActor = walk_actor; return true; }
      },
      extra: {
        poke_responder: (meters: { x: number, y: number }) => {
          let speed = 2;
          // This might be a nice time to brush up on your trigonometry :)
          let dx = meters.x - walk_actor.rigidBody.getCenter().x;
          let dy = meters.y - walk_actor.rigidBody.getCenter().y;
          let hy = Math.sqrt(dx * dx + dy * dy) / speed;
          let v = new b2Vec2(dx / hy, dy / hy);
          walk_actor.rigidBody.body.SetAngularVelocity(0);
          walk_actor.rigidBody.body.SetLinearVelocity(v);
        }
      }
    });
```

Finally, we can cover the HUD with an actor.  Tapping it will check if there is
an "activated" actor.  If so, we'll translate the touch to world coordinates and
give those coordinates to the activated actor's `poke_responder()`.

```typescript
    // Make the tappable region on the hud
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: {
        tap: (_actor: Actor, hudCoords: { x: number; y: number }) => {
          if (!lastTapActor) return false;
          let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
          let meters = stage.world.camera.screenToMeters(pixels.x, pixels.y);
          // move the actor:
          lastTapActor.extra.poke_responder(meters);
          // don't interact again without re-activating
          lastTapActor = undefined;
          return true;
        }
      }
    });
```

You should see what happens if you change this code.  For example, do you like
the effect that you get if you skip `lastTapActor = undefined`?  What happens if
you tap one actor, then another?  Can you think of a better way to manage taps
between the HUD and the world?

## Long Presses

Sometimes we want to work with long presses.  These aren't quite the same as
`pan`: they show up as a touch-down event and a touch-up event.  Typically, what
we'll want to do is have some function that runs on every clock tick (so 45
times per second).  When the button is pressed, it should set some variable
true, and when it is released, that variable should become false.  The function
that runs every clock tick should check that variable, and only run the button's
true action if the variable is true.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?8"
}
```

It turns out that this is some pretty complex behavior.  Fortunately, we're
using TypeScript, which means that we can put this behavior in a helper
function, and things will get easier:

```typescript
    // There is some complexity to how this works, because each button needs to
    // know if it is active.  We could do that via "extra" on each button, but
    // instead we'll use the idea of "capturing" the `active` variable in each
    // call to this function.
    function addToggleButton(actor: Actor, whileDownAction: () => void, onUpAction: (coords: { x: number; y: number }) => void) {
      let active = false; // will be captured by lambdas below
      let touchDown = () => { active = true; return true; };
      let touchUp = (_actor: Actor, hudCoords: { x: number; y: number }) => {
        if (!active) return false;
        active = false;
        onUpAction(hudCoords);
        return true;
      };
      // Put the control and events in the appropriate lists
      stage.world.repeatEvents.push(() => { if (active && whileDownAction) whileDownAction(); });
      actor.gestures.touchDown = touchDown;
      actor.gestures.touchUp = touchUp;
    }
```

Next, let's put a border on the world, and draw a hero.  We'll use dampened
motion as a way to see that the toggle buttons really are working:

```typescript
    boundingBox();

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .4, cy: .4, radius: 0.4 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    // If we just gave it a velocity once, it would slow down...
    (h.movement as ManualMovement).setDamping(5);
```

Now we can draw some buttons for moving the hero.  These are "toggle" buttons:
they run some code when they are pressed, and other code when they are released.

```typescript
    let l = new Actor({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 1, cy: 4.5, width: 2, height: 5 }, { scene: stage.hud }),
    });
    addToggleButton(l, () => (h.movement as ManualMovement).updateXVelocity(-5), () => { });
    let r = new Actor({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 15, cy: 4.5, width: 2, height: 5 }, { scene: stage.hud }),
    });
    addToggleButton(r, () => (h.movement as ManualMovement).updateXVelocity(5), () => { });
    let d = new Actor({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 8, width: 12, height: 2 }, { scene: stage.hud }),
    });
    addToggleButton(d, () => (h.movement as ManualMovement).updateYVelocity(5), () => { });
    let u = new Actor({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 1, width: 12, height: 2 }, { scene: stage.hud }),
    });
    addToggleButton(u, () => (h.movement as ManualMovement).updateYVelocity(-5), () => { });
```

One thing you'll notice about these buttons is that unexpected things happen if
you slide your finger off of them.  Be sure to try to do things like that when
testing your code.  Maybe you'll decide you like the unexpected behavior.  Maybe
you'll decide that you need to make changes to JetLag to fix the problem...

## Coordinating With Hover

Sometimes, the interaction between a gesture and a style of movement is complex,
and needs special attention.  As an example, a few years ago a student wanted to
have an actor who hovered at some spot until it was flicked.  The
`HoverMovement` didn't really work with `swipe` gestures, so I had to make some
changes to JetLag.  This mini-game shows how to get hovering and swiping to work
together.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "gestures.html?9"
}
```

In the game, we start by setting up gravity and making our first hero.  This one
hovers until it is tapped.  Since `HoverMovement` is a limited movement
component, we have to put velocity directly on the body, instead of using the
(more convenient) movement component.

```typescript
    stage.world.setGravity(0, 10);
    boundingBox();

    // make a hero who doesn't start moving until it is touched
    let hover_walk = new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 0.75, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.5, cy: 8.25, radius: 0.375 }, { density: 1, friction: 0, disableRotation: true }),
      movement: new HoverMovement(0.5, 8.25),
      role: new Hero(),
    });
    // The `HoverMovement` isn't a full-fledged movement component, so if you
    // want to make its actor move, you'll need to work with the body directly.
    hover_walk.gestures.tap = () => {
      (hover_walk.movement as HoverMovement).stopHover();
      hover_walk.rigidBody.body.SetLinearVelocity({ x: 5, y: 0 });
      hover_walk.gestures.tap = undefined;
      return true;
    }
```

Our next hero will also hover, but we'll set up swipe gestures like in one of
the earlier mini-games.

```typescript
    // Make a hero who is hovering, but who we will eventually flick
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 7, radius: .5 }),
      movement: new HoverMovement(1, 7),
      role: new Hero(),
      extra: { flickSpeed: .5 }
    });

    // Set up a "swipe" zone on the HUD, for swiping that hero
    let swipe = (_actor: Actor, hudCoord1: { x: number; y: number }, hudCoord2: { x: number; y: number }, time: number) => {
      // Convert starting coordinates from hud to world
      let screenCoord1 = stage.hud.camera.metersToScreen(hudCoord1.x, hudCoord1.y);
      let worldCoord1 = stage.world.camera.screenToMeters(screenCoord1.x, screenCoord1.y);
      // Is there a flickable actor there?
      let foundActor: Actor | undefined = undefined;
      for (let actor of stage.world.physics!.actorsAt(worldCoord1)) {
        if (actor.extra.flickSpeed != undefined) {
          foundActor = actor;
          break;
        }
      }
      if (!foundActor) return false;

      // Figure out the velocity to apply, then apply it
      let v = new b2Vec2(hudCoord2.x, hudCoord2.y)
      v = v.Subtract(hudCoord1);
      v.Normalize();
      v.Scale(foundActor.extra.flickSpeed * 2000 / time);
      // Don't forget to turn off hovering!
      (foundActor.movement as HoverMovement).stopHover();
      foundActor.rigidBody.body.SetLinearVelocity(v);
      return true;
    };
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9, }, { scene: stage.hud }),
      gestures: { swipe },
    });
```

This code is almost the same as what we did before, but now we have to call
`stopHover()`, and we have to work with the rigid body directly.

The real lesson here is that JetLag tries to make things easy, but it also tries
not to hide things too aggressively.  So, in this case, when the `HoverMovement`
proved to be inadequate, the solution was to work directly with the `rigidBody`.
We also could have made a new movement component.  When you're faced with these
kinds of decisions, you'll grow to develop a style and preference that work best
for you.

## Wrapping Up

This tutorial discussed most of the gestures in JetLag.  It turns out there is
one more that we didn't show: `mouseHover()`.  If you want to contribute a
tutorial on `mouseHover()`, please contact me.  Figuring out how to use
`mouseHover` is a great way to test your skill...

```md-config
page-title = Gesture-Based Input
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
