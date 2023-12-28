# Roles: Goodies, Destinations, and Sensors

In JetLag, actors take on roles, like "Hero" or "Obstacle".  This tutorial
discusses the "Goodie", "Destination", and "Sensor" roles.  

Each role in JetLag has several purposes.  For starters, each role defines
things that it does and does not appear to collide with.  For example, Passive
(the default role, which an actor takes if you don't give it anything else)
actors never collide with each other.  In addition, the roles we study in *this*
tutorial are defined in large part by what happens when a hero collides with
them.  Other roles bring in new ideas and features, which we'll discuss in later
tutorials.

## Preliminary Setup

You should start by doing the "Preliminary Setup" section of the "Rigid Bodies"
tutorial.  This will ensure you have the assets you need, and that the code is
in a good starting place (e.g., the `builder()` function should be empty).

After you've done that, you should put these lines at the top of the `builder()`
function.  In each of the mini-games, we'll want this common configuration:

```typescript
  // Throughout this tutorial, we'll have levels that can be "won" or "lost".
  // In all cases, we'll go right back to the same level.
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };

  // Every level will use tilt, and every level will have a box around it
  enableTilt(10, 10);
  boundingBox();
```

## Getting Started With Goodies

Let's start by looking at Goodies.  Whenever a hero collides with a goodie, it
automatically collects it.  JetLag has four built-in "goodie counters".  When
you collide with a goodie, the default is that the "0" goodie counter increments
by one.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?1"
}
```

In the code below, it's good to keep in mind that when JetLag makes a hero, it
always makes the hero's `rigidBody` dynamic, since there are so many important
collisions that involve heroes.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Goodie(),
    });

    // Set up a way to quickly get the goodie counts by pressing the '?' key
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SLASH, () =>
      window.alert(`${stage.score.getGoodieCount(0)}, ${stage.score.getGoodieCount(1)}, ${stage.score.getGoodieCount(2)}, ${stage.score.getGoodieCount(3)}`));
```

You'll also notice that there's a bit of code at the end that reports how many
goodies have been collected.  This, of course, is a terrible way to report
information in the middle of a game.  Since we haven't learned too much about
`Text` yet, it'll do for now.

## Counting Different Types Of Goodies

Whenever a hero collides with a goodie, some code will run.  The default is that
the code will increment the "0" goodie counter and return `true`.  If the code
returns `true`, JetLag will remove the goodie from the world.  In this
mini-game, we'll let one goodie update all four of the goodie counters (they are
"0", "1", "2", and "3").  Again, pressing the '?' key will pop up the current
goodie counts:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?2"
}
```

We'll start by making a Hero.  Remember that only Heroes can collect goodies.

```typescript
    // Now let's provide code for making all the goodie counts change
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

Next, we'll make a goodie that sets each of the four counters to 1.  It also
returns `true`, which means that the goodie will disappear.  We'll also set up
the '?' key so that pressing it will tell us how many goodies have been
collected.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 10, cy: 3, radius: 0.4 }),
      role: new Goodie({
        // This just updates the four scores
        onCollect: () => {
          stage.score.setGoodieCount(0, 1);
          stage.score.setGoodieCount(1, 1);
          stage.score.setGoodieCount(2, 1);
          stage.score.setGoodieCount(3, 1);
          return true;
        }
      }),
    });

    // Set up a way to quickly get the goodie counts by pressing the '?' key
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SLASH, () =>
      window.alert(`${stage.score.getGoodieCount(0)}, ${stage.score.getGoodieCount(1)}, ${stage.score.getGoodieCount(2)}, ${stage.score.getGoodieCount(3)}`));
```

Sometimes we want to add to a goodie count, or subtract from it.  To do that, we
can't just `setGoodieCount`.  Instead, we first need to `getGoodieCount()`, then
add to (or subtract from) it, and then `setGoodieCount()` with the new number.
We'll add a second goodie for that purpose.

We'll also make it so that this goodie must be collected *second*.  The way
we'll achieve that is by saying that if the 0th goodie counter is still 0, then
we'll return `false` and not update any goodie counts.  We'll also provide a
visual cue that the goodie wasn't collected, by expanding the goodie's size and
shrinking the hero.

```typescript
    let resized = false;

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Goodie({
        // This lets us see the goodie and actor involved in the collision
        //
        // Then we can modify scores, or return false to indicate that the
        // goodie wasn't collected yet.
        onCollect: (g: Actor, h: Actor) => {
          if (stage.score.getGoodieCount(0) == 0) {
            if (!resized) {
              g.resize(1.2);
              h.resize(.75);
              resized = true;
            }
            return false;
          }
          stage.score.setGoodieCount(0, 10);
          stage.score.setGoodieCount(1, stage.score.getGoodieCount(1) + 1);
          stage.score.setGoodieCount(2, stage.score.getGoodieCount(2) - 1);
          stage.score.setGoodieCount(3, 0);
          return true;
        }
      }),
    });
```

Notice that we added an extra variable, called `resize`.  Our `onCollect` code
was able to look at it in order to decide if it should resize the hero and
goodie or not.  Also, notice how this meant that we needed to provide `g` and `h` as arguments to the `onCollect` method.  In TypeScript, we could omit them when we didn't need them, even though they were secretly there!

## Destinations

In maze-like games, a hero usually needs to reach a destination.  We can see
such behavior in the following game:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?3"
}
```

It takes very little code to get this behavior in JetLag.  The default behavior
for the destination role is to accept one hero, and the default behavior of the
`score` (which we haven't really discussed yet) is that a level is won once one
hero reaches a destination.  Putting it together, all we need to do is make a
hero and a destination, and make sure the hero has some kind of movement (in
this case, tilt) so that we can get it to collide with the destination.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Destination(),
    });
```

Of course, you might want to have a nice fade-out or other visual effect, instead of immediately restarting.  We'll get to that in a later tutorial.

## Advanced Destinations

Sometimes you might want to require several heroes to reach a single
destination, or to have several destinations, each of which can only hold a few
heroes.  We'll see how to achieve these kinds of behaviors through a few quick
examples.  First, here's a destination that can hold two heroes.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?4"
}
```

For the most part, the code for this level is straightforward... we create two
heroes (we'll control them via Tilt) and we make a destination with a `capacity`
of 2.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Destination({ capacity: 2 }),
    });
```

There is one small issue, though.  When one hero reaches the destination, the
level is won, and it restarts.  We need to tell JetLag that it takes *two*
heroes to win the level:

```typescript
    stage.score.setVictoryDestination(2);
```

Next, let's see what happens if we don't change the `capacity`, but we do create
multiple destinations:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?5"
}
```

In the above mini-game, you can see that by default, destinations do not collide
with heroes.  When a hero reaches a destination that is "full", it just passes
through it.  Remember: you can use `z` in an appearance to control whether the
hero goes under or over the destination.  The code for this use of destinations
appears below:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Destination(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(2);
```

## "Activating" A Destination

In the discussion of Goodies, we had a way of saying *not* to collect a goodie
if some condition wan't met.  We can do the same with Destinations.  In the
example below, the destination won't accept the hero until the hero collects a
goodie:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?6"
}
```

We will achieve this behavior by providing an `onAttemptArrival` function to the
`Destination`.  In it, we'll check that the goodie count (for type 0 goodies) is
not zero.  We'll also do another check: every actor has a built-in `extra`
field.  This field doesn't have a type, so we can use it however we want.  In
this level, we'll show its use by saying that when the hero collects the goodie,
the goodie will run code that updates the hero's `extra` with a field called
`collected`, which will be set to `true`.  The `onAttemptArrival` code doesn't
just look at the goodie count, it also checks this `extra` field.  If you had
two heroes, you'd be able to use this to insist that the hero who collected the
goodie be the one to reach the destination.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
      extra: {}
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: (h: Actor) => stage.score.getGoodieCount(0) > 0 && h.extra.collected }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Goodie(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: 0.4 }),
      role: new Goodie({ onCollect: (_g: Actor, h: Actor) => { h.extra.collected = true; return true; } }),
    });
```

## Changing The Hero's Behavior With Sensors

The last role we'll look at in this tutorial is the Sensor role.  Sensors detect
when they collide with a hero, and they run some code.  In this example, we have
three sensors, each of which affects the hero's movement:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?7"
}
```

To make this mini-game, we start by creating a hero.  We'll control it via Tilt:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

Next, we draw the sensors.  Notice how I'm using the `z` of the appearance to
determine which go under or over the hero.  Also remember that if two things
have the same z (the default is 0), then the one we make second will go "on top
of" the one we make first.

Sensors always have a `heroCollision` function.  It always provides the sensor
and hero as arguments to the function.  The sensor comes first.  Since we don't
use it in our code, we prefix the name with an underscore (e.g., `_self`), so
that TypeScript knows that we intended not to use it.

```typescript
    // This pad effect multiplies by -1, causing a "bounce off" effect even
    // though collisions are not enabled
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 3, radius: 0.4 }),
      role: new Sensor({
        heroCollision: (_self: Actor, h: Actor) => { h.rigidBody!.setVelocity(h.rigidBody!.getVelocity().Scale(-10)); }
      }),
    });

    // This pad multiplies by five, causing a speedup
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 7, cy: 3, radius: 0.4 }),
      role: new Sensor({
        heroCollision: (_self: Actor, h: Actor) => { h.rigidBody!.setVelocity(h.rigidBody!.getVelocity().Scale(5)); }
      }),
    });

    // A fraction causes a slowdown
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 9, cy: 3, radius: 0.4 }, { rotationSpeed: 2 }),
      role: new Sensor({
        heroCollision: (_self: Actor, h: Actor) => { h.rigidBody!.setVelocity(h.rigidBody!.getVelocity().Scale(0.2)); }
      }),
    });
```

## Wrapping Up

The roles we discussed in this tutorial are all conveniences.  In the next
tutorial, we'll see that the `Obstacle` role could be used to do everything that
any of these roles can do.  However, sometimes it's convenient to use these
roles... it means less code, and it means the code is easier to read, because we
can just see a word like "Goodie" and know exactly what an actor is supposed to
do.

```md-config
page-title = Roles: Goodies, Destinations, and Sensors

img {display: block; margin: auto; max-width: 500px;}
.red {color: red;}
```
