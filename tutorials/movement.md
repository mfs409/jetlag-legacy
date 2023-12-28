# Styles of Movement

This tutorial relates the discussion of physics to the Movement field in
the constructor for Actors.

If you finished the Rigid Body tutorial, you've got a good foundation for this
tutorial.  While there's lots more we can explore in the configuration of rigid
bodies, having some better ways of moving the hero would make it easier for us
to do such an exploration, so let's switch gears and start looking at ways to
move an actor. We've already seen Tilt, which is nice and straightforward.
We've also seen "Inert", the default movement policy.

To get started, you should reset your `game.ts` file so that `builder()` has no
code in it.  This tutorial is going to use the `boundingBox()` and
`enableTilt()` functions, so you'll want to copy them over.  You'll also want to
use the same `png` files as in the Rigid Body tutorial.

## Movement Based On Gravity

A rather uninteresting movement is the "GravityMovement".  This isn't really a
movement at all... it just says that gravity will affect the actor.  It's not
really any different from making the body "dynamic", but sometimes it's useful.
Let's try it out here.  We'll make "enemies" that fall from the sky, and the
"hero" needs to dodge them.  When enemies collide with the ground, they'll
disappear.  Don't worry if some of this doesn't make sense yet... we'll explain
it all later.

First, here's the game that we're going to make:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?1"
}
```

You'll notice right away that the camera/gravity combination is making it seem
like we're looking at the stage from the side, not from above.  We can get that
behavior just by setting up some gravity:

```typescript
    // Downward gravity
    stage.world.setGravity(0, 10);
```

Next, we'll draw the walls.  Remember that `boundingBox()` returns the four
walls.  That's useful, because it will let us provide some code so that enemies
disappear when they hit the floor.  For now, we'll just say "if the enemy hits
the floor, it will be defeated".  When we learn more about roles, we'll realize
that's not a great plan, but it's OK for now.  We'll also *disable* the top
wall, because we want the enemies to start off screen, and slowly drop into
view.

```typescript
    let walls = boundingBox();
    (walls.b.role as Obstacle).enemyCollision = (_thisActor: Actor, enemy: Actor) => {
      (enemy.role as Enemy).defeat(false);
    }
    walls.t.enabled = false; // No top wall
```

Next, we'll set up a timer that runs every second.  Every time the timer runs,
it will create a new enemy that will fall from the sky.  In this code, remember
that the up direction is negative, and the top-left corner of the visible screen
is (0, 0).  That means we need to start with a *negative* value for y.  Also,
notice that `Math.random()` returns a number between 0 and 1 (not including 1
itself), so if we want the center to be between .5 and 15.5, then we need to
multiply the random number by 15, and add .5.

```typescript
    // Falling enemies
    stage.world.timer.addEvent(new TimedEvent(1, true, () => new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cy: -.5, cx: .5 + (Math.random() * 15) }),
      role: new Enemy(),
      movement: new GravityMovement(),
    })));
```

The next part of this level is pretty straightforward: we'll add a hero who
moves via tilt.  Notice, though, that we are using a 0 as the second argument to
`enableTilt`.  That means tilt doesn't cause any up/down movement.

```typescript
    // A hero moving via tilt.  Notice that the ball "rolls" on the ground, even
    // though there's no friction.  That's because of gravity.
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8.6, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    enableTilt(10, 0); // Now tilt will only control left/right
```

Finally, since there is a hero and there are enemies, it's possible to lose this
level (if an enemy falls onto the hero).  We need to tell JetLag what to do in
that case.  We'll say "when the level is lost, make a new level by running
builder and passing in the current level":

```typescript
    // Any time it's possible to "lose", we need to tell JetLag what to do if the level is lost
    stage.score.onLose = { level, builder }
```

## Moving Along A Fixed Path

In many games, we need an actor to move along a path.  We're going to make a
very busy mess of a game.  Here's what it will look like when we're done:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?2"
}
```

In JetLag, we define a path as a set of waypoints.  When the level starts, the
actor will immediately teleport to the first waypoint, and start moving toward
the second, using the velocity we provide.  When it reaches that waypoint, it
will start moving toward the next.  When it reaches the last waypoint, if we
have requested that the path repeat, then it will instantly teleport back to the
first waypoint and start over.

We'll start by putting an actor into the world who moves via Tilt, so that we
can make it interact with an actor moving via a path.  Then we'll make an actor
who moves along a path and stops:

```typescript
    // Moving around in the world will make this more interesting!
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8.6, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    enableTilt(10, 10);

    // This actor moves to a position and stops
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: .5, cy: .5 }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(.5, .5).to(15.5, .5), 2, false),
    });
```

Next, we'll add an actor who moves faster (5, instead of 2), and who loops.
Notice that the actor *teleports* back to the starting point.

```typescript
    // This actor loops, and is faster.  Also, actors on paths don't have to be
    // obstacles, they can have any role...
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 1.5, cy: 1.5 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(.5, 1.5).to(15.5, 1.5), 5, true),
    });

    // Since there's an enemy, we need a way to lose...
    stage.score.onLose = { level, builder }
```

If we want the actor to move back to the starting point, we need the final
waypoint to be the same as the first.

```typescript
    // The last one was a bit odd.  This one has *three* points.
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 1.5 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(.5, 2.5).to(15.5, 2.5).to(.5, 2.5), 5, true),
    });
```

Of course, paths can go from anywhere to anywhere... even off the screen.  Also,
notice that if an actor's body is static when the path is attached to it, it
will become kinematic, not dynamic.  That means that it can go through walls:

```typescript
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
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p.getPoint(0).x, cy: p.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p, 5, true),
    });
```

If a point on the path is directly between two other points, you won't notice
it's there.  The velocity is all that matters.  At first, this might seem like a
kind of silly thing to point out...

```typescript
    let p2 = new Path().to(-.5, 5).to(8, 5).to(16.5, 5).to(-.5, 5);
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p2.getPoint(0).x, cy: p2.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p2, 5, true),
    });
```

But once we've done that, we can re-use the path, letting the next actor jump
forward by a waypoint.  Also, notice that when we do this, if we don't have the
`cx` and `cy` values correct, it's OK.  The actor teleports to its starting
point right away.

```typescript
    let a2 = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p2.getPoint(0).x, cy: p2.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p2, 5, true),
    });
    (a2.movement as PathMovement).skip_to(1);
```

We can make actors on paths dynamic.  This is usually a bad idea if collisions
are enabled (which is, of course, the default).  Try colliding with this actor
and knocking it off of its path.  It will mess up the whole path system.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 1.5 }, { dynamic: true }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(.5, 6.5).to(15.5, 6.5).to(.5, 6.5), 5, true),
    });
```

Lastly, let's observe that we can run code whenever an actor reaches a waypoint.
In this example, we'll only do something on the second waypoint (waypoint #1)
and the fourth waypoint (waypoint #3).  In each case, we'll just put a goodie up
in a location that's hard to reach.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 7.5 }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(-.5, 7.5).to(8, 8.5).to(16.5, 7.5).to(8, 8.5).to(-.5, 7.5), 5, true, (which: number) => {
        if (which == 1 || which == 3) {
          new Actor({
            appearance: new ImageSprite({ width: .5, height: .5, img: "grey_ball.png" }),
            rigidBody: new CircleBody({ radius: .25, cx: 1.5 - Math.random(), cy: 1.5 - Math.random() }, { dynamic: true }),
            role: new Goodie(),
          });
        }
      }),
    });
```

## Chasing An Actor

Another way of moving things is via "chase".  Chase isn't incredibly
complicated... we just cast a line from the chasing actor to the actor it is
chasing, and tell the chasing actor to move along that line.  Surprisingly, this
can seem like a really smart "AI" in some games.  Here's an example:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?3"
}
```

Here's the code for the example.  There is one important thing to point out in
this code.  Up to this point, when we made actors we usually just said `new
Actor(...)`.  But here, when we make the hero (the one who is being chased), we
say `let h = new Actor(...)`.  We didn't have to call it `h`.  We could have
called it `hero` or `h123` or `the_hero_to_chase` or quite a few other things.
What matters is that we created a *variable* (that is, we made up a name for our
code to use).  In later code, we can use that variable when we need to think
about the hero.  So, when we made the `ChaseMovement`, we could say that the
target of the chase was `h`, and JetLag would know who to chase.

```typescript

    boundingBox();
    enableTilt(10, 10);

    // Make a hero who we control via tilt
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // create an enemy who chases the hero
    new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 1, radius: 0.25 }),
      movement: new ChaseMovement({ speed: 1, target: h }),
      role: new Enemy(),
    });

    stage.score.onLose = { level, builder }
```

## Chasing In One Dimension

`ChaseMovement` takes some *optional* parameters.  You can see them by hovering
your mouse over the word `ChaseMovement` in VSCode.  One that is quite useful is
to limit chasing to only one dimension (X or Y).  This can be useful for things
like a goalie in a hockey or soccer game, or a pong controller.  It can also
make for some nice visual effects.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?4"
}
```

In the code below, you'll notice that one of the red indicators has `chaseInX`
false, and the other has `chaseInY` false.

```typescript
    boundingBox();
    enableTilt(10, 10);

    // Make a hero who moves via tilt
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 5.25, cy: 5.25, radius: 0.4, }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // These obstacles chase the hero, but only in one dimension
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 0, cy: 2.5, radius: 0.5 }),
      movement: new ChaseMovement({ speed: 10, target: h, chaseInX: false }),
      role: new Obstacle(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 0, radius: 0.5, }),
      movement: new ChaseMovement({ speed: 10, target: h, chaseInY: false }),
      role: new Obstacle(),
    });
```

In the next mini-game, we'll have an actor who only chases in one direction.
This level also shows some JetLag features.  You don't need to worry about
understanding them too well yet.  They're just here so that you can keep in mind
how little changes and small bits of code can make for very different styles of
gameplay.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?5"
}
```

In the level, we start with tilt in the X dimension, gravity, and a bounding
box:

```typescript
    enableTilt(10, 0);
    stage.world.setGravity(0, 10);
    boundingBox();
```

Next, we'll put in a background that auto-scrolls.  This can look very good in
some games, though in our game it doesn't look all that great.  The speed number
you see is something I found by guessing.  You'll want to change it until you
find a speed that works for your game concept.

```typescript
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5 }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: -5 / 1000, isAuto: true });
```

In this game, the hero can jump.  You can tap/click the hero to make it jump,
and when it does, it will get a boost upward (negative Y).  Using tilt while in
the air is the only way to get around the red ball.

```typescript
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      role: new Hero(),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }),
      movement: new TiltMovement(),
      gestures: { tap: () => { h.rigidBody.setVelocity(new b2Vec2(h.rigidBody.getVelocity().x, -10)); return true; } }
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      role: new Obstacle(),
      rigidBody: new CircleBody({ cx: 15, cy: 2, radius: 0.4 }, { dynamic: true }),
      movement: new ChaseMovement({ target: h, chaseInY: false, speed: 0.9 })
    });
```

## Explicitly Controlling Movement With `ManualMovement`

Most of the movements we've looked at so far have been kind of automatic...
JetLag was in control. Now let's look at the last movement technique,
`ManualMovement`.  This is for when you want your code to have complete control
over the movement of the actor.

Let's start by making a world where an actor can just move around:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?6"
}
```

The hardest part of this code is that we need to set up all of the behaviors to
run on key presses and key releases.  The easy thing is to make the actor and
put it in a world with no gravity:

```typescript
    stage.world.setGravity(0, 0);
    boundingBox();

    // First, make the hero with ManualMovement as its movement component
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 8, radius: 0.25 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
```

Then we can set up they keyboard.  We'll say that pressing a key should update
its velocity, and releasing should set that part of the velocity to 0:

```typescript
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
```

In the example, you'll notice that only one key works at a time.  So, for
example, if you hold `a` and start using the arrows, the green ball will stop
rotating.  This is a consequence of how web browsers work... we can talk about
ways to fix it later.

## Controlling Movement In One Dimension

Manual movement lets us control everything... or decide not to control things.
So, for example, in this level we put a fixed X velocity on the actor, and only
use the arrows to control up and down.  Of course, without boundaries on the
camera, or borders on the world, this is going to be pretty glitchy.  You should
test your understanding by applying ideas from the "Camera" tutorial to make
this nicer.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?7"
}
```

```typescript
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5, }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4, }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).addVelocity(5, 0);

    stage.world.camera.setCameraFocus(hero);

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
```

## Violating The Laws Of Physics

In this next mini-game, we'll start building out something common in
"platformer" games: a hero who can jump onto a floating platform.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?8"
}
```

The most interesting thing about this mini-game is not what it does, but what it
doesn't do.  You should expect that when the hero (a box) is teetering off of
the edge of the platform, it should tip over.  That's what the laws of physics
say should happen.  Since that's not what we want in our game, it's up to us to
disable such behavior.  We do that by adding an explicit instruction that the
hero's rigid body shouldn't rotate.

Here's the start of the game: we have gravity, a border, and a hero who won't
accidentally rotate.  You should try turning the `false` to `true`, and watch
how the behavior of the Hero changes when it's walking off the platform.

```typescript
    // In the last level, there was a "disableRotation" parameter.  This can be
    // very useful, especially in platformer-type games.
    stage.world.setGravity(0, 10);
    boundingBox();

    // If we don't have the `disableRotation` option here, then if the hero just
    // barely nicks the corner of the platform, it will rotate as it falls!
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 1, cy: 5.25, width: .8, height: .8 }, { disableRotation: false }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
```

Next, we make a floating platform.  Since it's an Obstacle, the hero won't pass
through it.  Since we didn't give it movement, it's a static body, so it won't
fall.

```typescript
    new Actor({
      appearance: new FilledBox({ width: 2, height: .25, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ width: 2, height: .25, cx: 4, cy: 7 }),
      role: new Obstacle(),
    });
```

One weird thing here is that jumping is a special behavior.  It's not part of
the movement, it's part of the hero role.  The reason for this is that in some
games, we need to know if something is "in the air".  The real thing to remember
here is that any time you're writing code, you'll find places where you have to
make decisions that aren't clean and obvious.  There are ways to rewrite JetLag
so that jumping is a movement, not a part of the Hero role.  I did it this way,
because it worked for my goals.  It's not objectively good or bad.

```typescript
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => ((hero.role as Hero).jump(0, -7.5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
```

## Dampened Motion

One of the goals of this tutorial is to use movement as a way to learn more
about rigid bodies.  We just saw `disableRotation`.  Another thing we can do is
introduce `damping` factors.  These say that an actor's rigidBody should slow
down, not stop.  We can use damping on angular rotation and/or on velocity.
Here's an example.  Watch what happens when you stop using the arrows to move
the green ball.  Also, be sure to use `a` and `s` to apply rotation to the
actor.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?9"
}
```

Here's the code for the mini-game.  There are a few things to notice:

- We use a background layer, even though the camera isn't moving, because that's
  an easy way to get a background on the level.
- The background (`mid.png`) has transparency, so putting a background color on
  the stage works nicely.  You could even use a timer to slowly make the
  background darker, to simulate night falling.
- Due to a weird aspect of the language we're using (TypeScript), we can't just
  say `hero.movement.setDamping(1)`.  Instead, we have to remind the language
  that `hero.movement` is a `ManualMovement`, by using the syntax
  `(hero.movement as ManualMovement)`.

```typescript
    stage.world.setGravity(0, 0);
    boundingBox();

    let hero = new Actor({
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
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5, }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
```

## Defying Gravity

We've seen that dynamic bodies are subject to gravity.  But we also require at
least one body in a collision to be dynamic, or the collision won't happen.
These requirements can be at odds with each other, so Box2D (and hence JetLag)
lets us defy gravity.  Here's a simple demonstration:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?10"
}
```

Below is the code for the demonstration.  The line of interest is
`setGravityDefy()`.  You'll notice that there is some strangeness to this code.
The issue is that `Destination` is a role that doesn't collide with other
things.  It achieves this by internally calling `setCollisionsEnabled(false)` on
its `rigidBody`.  If we want collisions, we need to turn them on *after* we make
the actor.  Every now and then, you'll find that JetLag is doing this sort of
thing... changing properties of a rigidBody during the `Actor.new()` call.  When
that happens, you can always change things back after the actor has been
created.

```typescript
    stage.world.setGravity(0, 10);
    boundingBox();

    // Destinations default to having collisions disabled.  We don't want this
    // to fly off screen, so we need to re-enable collisions, and we need to
    // make it dynamic.
    let d = new Actor({
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
```

## Wrapping Up

To wrap up, let's make a block-breaking game.  In this game, there aren't really
any new JetLag ideas or concepts.  There is, however, some new TypeScript, like
using an array (`colors = [...]`), and using a `for` loop:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "movement.html?11"
}
```

You'll also notice that it's possible to get "stuck", by hitting the ball in a
way that leads to it bouncing back and forth, left/right, without ever moving up
and down.  That's a natural consequence of physics.  Can you think of ways that
you could change the behavior of the left/right walls, or of the ball, or of
both, so that you could detect when this happened, and fix things up so that the
game remains fun?

```typescript
    boundingBox();

    // make a hero who is always moving, and who has a lot of elasticity
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 7, radius: 0.25 }, { elasticity: 1, friction: 0.1 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (h.movement as ManualMovement).addVelocity(0, 8);

    // make an obstacle and then connect it to some controls.  This will be the
    // paddle at the bottom
    let boxCfg = { cx: 8, cy: 8.75, width: 2, height: 0.5, fillColor: "#FF0000" };
    let o = new Actor({
      appearance: new FilledBox(boxCfg),
      // Note: friction is here and on the ball, so we can get spinning behavior
      rigidBody: new BoxBody(boxCfg, { density: 10, elasticity: 1, friction: 0.1 }),
      movement: new ManualMovement(),
      role: new Obstacle(),
    });

    // Draw some rows of blocks at the top
    let colors = ["#FF0000", "#FFFF00", "#FF00FF", "#00FF00", "#00FFFF", "#0000FF"];
    for (let r = .25; r < 4.25; r += .5) {
      for (let c = .5; c < 16; c += 1) {
        new Actor({
          appearance: new FilledBox({ width: 1, height: .5, fillColor: colors[Math.trunc(Math.random() * 6)] }),
          rigidBody: new BoxBody({ cx: c, cy: r, width: 1, height: .5 }, { density: 1 }),
          role: new Obstacle({ heroCollision: (thisActor: Actor) => thisActor.enabled = false })
        });
      }
    }

    // Set up the left/right arrow keys
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((o.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((o.movement as ManualMovement).updateXVelocity(5)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((o.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((o.movement as ManualMovement).updateXVelocity(0)));
```

If you've worked through this tutorial, you should have a good understanding of
both rigid bodies and movement.  But you're probably starting to have lots of
questions about collisions and roles.  We'll start looking into that in the next
tutorial.

```md-config
page-title = Styles of Movement

img {display: block; margin: auto; max-width: 500px;}
.red {color: red;}
```
