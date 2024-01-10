# Projectiles And Actor Pools

Projectiles are a special role.  This tutorial helps you to understand
how they work.  It also introduces "actor pools", which help your game
to run efficiently.

## Projectiles Are Special

While projectiles do not *have* to move fast, they typically do.  This can
create big problems in Box2D, because physics simulations usually work by
looking at where everything is, computing where it should be in a short time,
and then checking for collisions. When actors move too fast, it's possible for
Box2D to miss the fact that things should have collided.  Fortunately, Box2D
provides a solution to the problem: We can mark a projectile's rigid body as
being a "bullet", and Box2D will do a more expensive computation for it, to
catch these possible glitches.  When you make a `Projectile` role, JetLag
handles this configuration for the corresponding actor's rigid body.

However, there's another problem.  In a lot of games, it's possible to toss
*lots* of projectiles.  What happens if those projectiles go off screen?  It
would be no fun if you could toss a projectile at the beginning of a level, and
it could move hundreds of meters forward, hitting the boss before you even get
to it.  And it would probably break your game if Box2D had to manage thousands
of projectiles, each requiring the expensive computation described above.

The first way that JetLag deals with this is by having *both* a projectile role
and a projectile movement.  In almost every game, you'll the actors serving as
projectiles to have both of these components.  The second thing you'll want to
do is create an "Actor Pool" for your projectiles.

## Actor Pools

An actor pool is a fixed-size container that can hold a bunch of actors.  In
JetLag, you can make as many actor pools as you want, but it's probably a good
idea for each actor pool be homogeneous: every actor in it should be the same
(same role, same movement component, etc.).

When you start a level, you can fill your actor pool with some number of actors,
and then any time you need an actor, you can ask for one from the pool.  So far,
this might sound silly: it's no different than constructing an actor (via `new
Actor()`) every time you need one.  What makes actor pools special is that you
can put things back into the pool, so you can reuse them later.

The challenge, then, is figuring out the conditions under which we should put a
projectile back into the pool.  A few examples are:

- Some amount of time ran out.  This is useful when we're using a projectile as
  the hitbox for punching or melee combat.
- The projectile collided with something.  This might be an enemy that the
  projectile damaged, or it might be an obstacle.
- The projectile is too far from some point (such as the hero who tossed it, or
  the location from which it was thrown).

One more nice thing about actor pools is that they have a capacity.  So, for
example, if your hero can toss an unlimited number of projectiles, but you only
want three on the screen at any time, initializing your actor pool with three
projectiles will do the job.

You might also want to have multiple actor pools (for example, one for arrows,
one for magic, one for punching).  You'll find that as your game gets more
complex, actor pools make it easy to organize your code, and also to separate it
into files.

## Getting Started

This tutorial requires the `sprites.json` and `sprites.png` files, as well as
the `boundingBox()` function.  Since some of the examples involve winning and
losing, you'll probably want to put these two lines at the top of your
`builder()` function:

```typescript
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };
```

## Our First Projectiles

In the game below, pressing space will toss a projectile to the right.  As
you're testing this code, be sure to press and hold the space bar.  You'll
notice that you can get some unexpected behavior!

```iframe
{
    "width": 800,
    "height": 450,
    "src": "projectiles.html?1"
}
```

Most of the code for this game should be familiar.  We'll start by making a
border and a hero who can move left and right:

```typescript
    boundingBox();
    stage.world.setGravity(0, 10);
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    // set up arrow keys for the hero:
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
```

We won't make an actor pool yet.  Instead, we'll say that every time the space
bar is pressed, we'll create a new projectile.  The projectile will appear 0.2
meters to the right of the hero.  Then we'll use `tossFrom()` to toss the
projectile to the right.  `tossFrom()` takes an actor, the x,y coordinates of a
position that is relative to the actor's center, and x,y values for a projectile
velocity.  That means we don't really need to care where we make the rigidBody:
our call to `tossFrom` will move it to a position that is .2 to the right of the
hero, and will make the projectile move to the right at a velocity of 5
meters/second.

```typescript
    // Note that you could have different buttons, or different keys, for
    // tossing projectiles in a few specific directions
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = new Actor({
        appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
        rigidBody: new CircleBody({ cx: hero.rigidBody.getCenter().x + .2, cy: hero.rigidBody.getCenter().y, radius: .1 }),
        movement: new ProjectileMovement(),
        role: new Projectile()
      });
      // We can use "tossFrom" to throw in a specific direction, starting at a
      // point, such as the hero's center.
      (p.role as Projectile).tossFrom(hero, .2, 0, 5, 0);
    });
```

One surprise you'll discover is that these projectiles have gravity, so they
start falling down.  Another is that they disappear when they collide with the
floor.  And, finally, you'll notice that they are colliding with the hero
(because we are starting them .2 to the right of the hero's center, but the
hero's radius is .4).  Every time we throw a projectile, Box2D sees that the
projectile is colliding with the hero, and it processes a collision.  This
pushes the hero left a little bit.  If you change the .2 in `tossFrom() to .4,
then this quirky behavior will go away.

## Using An Actor Pool

Now we'll add an actor pool, and pre-populate it with 10 projectiles.  At first,
this feels exactly the same as our last example, but then we run out of
projectiles!

```iframe
{
    "width": 800,
    "height": 450,
    "src": "projectiles.html?2"
}
```

Similarly, most of the code is the same.  Here's the part for setting up the
hero, world, and hero movement:

```typescript
    boundingBox();
    stage.world.setGravity(0, 10);
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
```

The differences only deal with the projectiles.  We start by making a pool (an
`ActorPoolSystem`) and putting ten projectiles in it.  Notice that the x,y
coordinates don't really matter, so I opted to draw them off screen.  When we
put actors in a pool, they will automatically be disabled; when we take them
out, they'll be re-enabled.  Thus they won't be expensive for Box2D to manage.

```typescript
    // Make a pool with 10 projectiles
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 10; ++i) {
      // Where we put them doesn't matter, because the pool will disable them
      let p = new Actor({
        appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
        rigidBody: new CircleBody({ cx: -10, cy: -10, radius: .1 }),
        movement: new ProjectileMovement(),
        role: new Projectile()
      });
      projectiles.put(p);
    }
```

When we want to toss a projectile, we use `projectiles.get()` to get it.  If the
pool is empty, this will return `undefined`, so we do a quick check (`if (p)`
means the same thing as `if (p != undefined)`), and only toss the projectile if
it is valid:

```typescript
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = projectiles.get();
      if (p) (p.role as Projectile).tossFrom(hero, .2, 0, 5, 0);
    });
```

## Putting Projectiles Back Into The Pool

Our last example did not work well, because we didn't have a way of putting our
projectiles back into the pool.  Our next example fixes the problem.  It also
introduces a way to limit the number of projectiles that can be thrown. It might
seem odd to have two different kinds of limits on projectiles... one limit is on
the total number that JetLag manages, the other is on the number of projectiles
that are available.  It might help to think about a quiver of arrows... in this
example, your quiver has 15 arrows, but the pool only has 10.  That means up to
10 arrows can be on the screen at once, and 5 arrows will get re-used to
ultimately have a total of 15.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "projectiles.html?3"
}
```

The `Projectile` role understands that it is the kind of thing that we like to
re-use in a pool, so it has an optional `reclaimer` function.  The purpose of
this function is to tell JetLag what to do when the projectile becomes disabled.
Remember that the default behavior is for a projectile to disable when it
collides with an obstacle.  Thus we can update the role like this:

```typescript
      role: new Projectile({ reclaimer: (actor: Actor) => projectiles.put(actor) })
```

And now we seem to have an unlimited supply of projectiles, even though there
are only 10 in the pool that are being re-used, over and over again.  Be sure to
test this behavior before moving on with this example.

Next, we'll put a limit on the total number of projectiles that can be thrown.

```typescript
    projectiles.setLimit(15);
```

Any time there's a limit in your game, you'll want to let the player know.  You
can use `projectiles.getRemaining()` to keep track of the remaining number of
shots.  You could also make power-ups that called `projectiles.setLimit()`` to
increase it again.

## Projectile Shapes

Projectiles don't have to be circles... they are actors, like any other, so they
can use any sort of rigid body.  In this example, we'll make long, skinny
rectangles.  If you turn off hit boxes in your `Config`, these will look like
laser beams.

The other new aspect of this example is *how* we toss the projectiles.  Instead
of using `tossFrom()`, we'll use pan gestures to get a location, and `tossAt()`
to toss the projectiles toward that location.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "projectiles.html?4"
}
```

We'll start by putting a border on the screen, and a hero.  The hero can't move,
but having a border will ensure that our projectiles will collide with an
obstacle, so they can be reclaimed.

```typescript
    boundingBox();
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: 0.4 }),
      role: new Hero(),
    });
```

Next, we'll set up a pool of projectiles.  We want to tell the `tossAt()`
function how they ought to be thrown, so we provide two extra configuration
options: `fixedVectorVelocity` indicates that the projectiles should move with
velocity 10 in whatever direction the `tossAt()` vector decides to throw them
in.  `rotateVectorToss` indicates that we want the projectile to be rotated in
the direction it is moving.  If we didn't have this, our "laser beams" would
look like very strange, skinny walls.

We have some other new bits of configuration here.  When we make the
projectiles' bodies, `collisionsEnabled: false` ensures that they don't bounce
off of things.  This is a way of addressing our concern about them making the
hero move, and is especially useful here, since they'll seem to come out of the
center of the hero.  We'll also use `disappearOnCollide: true` in the role, to
indicate that when two projectiles collide, one should disappear.  You should,
of course, try to change any and all of these values, to see how the game
changes.

```typescript
    // set up a pool of projectiles with fixed velocity.  They will be rotated
    // in the direction they travel.
    let projectiles = new ActorPoolSystem();
    // set up the pool of projectiles
    for (let i = 0; i < 100; ++i) {
      let appearance = new FilledBox({ width: 0.02, height: 1, fillColor: "#FF0000" });
      let rigidBody = new BoxBody({ width: 0.02, height: .5, cx: -100, cy: -100 }, { collisionsEnabled: false });
      // let's not let gravity affect these projectiles
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ disappearOnCollide: true, reclaimer });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement({ fixedVectorVelocity: 10, rotateVectorToss: true }), role });
      projectiles.put(p);
    }
```

Now let's cover the HUD with a button for tossing these projectiles. This will
have the same "toggle" feeling as we saw in the tutorial on gestures.  But we'll
use gestures to figure out *where* to toss the projectile, and a timer to limit
the rate at which they are tossed.  This code is a bit more complex than you
might have expected, and it's not the only way we could choose to achieve this
behavior.

Just like in the tutorials on gestures, the hard part is defining the functions
we'll want to use.  It is tempting to use pan, but unfortunately, `panStart`
doesn't happen until there is movement.  So instead, we'll use a combination of
`touchDown`, `touchUp`, and `panMove`.  On a down-press or move, we'll set
`isHolding` true, to indicate that we want to toss a projectile, and we'll save
the world coordinates of the touch in a vector (`v`).  When the touch is
released, we'll just set `isHolding` to false.

```typescript
    let v = new b2Vec2(0, 0);
    let isHolding = false;
    // On the initial touch, figure out where in the world it's happening
    let touchDown = (_actor: Actor, hudCoords: { x: number; y: number }) => {
      isHolding = true;
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      v.x = world.x;
      v.y = world.y;
      return true;
    };
    // On a release of the touch, stop tossing
    let touchUp = () => { isHolding = false; return true; };
    // Move will be the same as touchDown
    let panMove = touchDown;
```

Next, we'll set up a timer.  It will keep track of the time of the last toss,
and only toss if two conditions are met:

- The button for tossing is still being held (`isHolding`)
- It has been more than 100ms since the last toss

Notice that we don't use the JavaScript `Date`, but instead
`stage.renderer.now`.  `stage.renderer.now` tracks the number of milliseconds
that have transpired *in the stage*.  It doesn't count time spend on overlays,
such as pause scenes.

```typescript
    // Set up a timer to run at high frequency
    let lastToss = 0;
    stage.world.timer.addEvent(new TimedEvent(.01, true, () => {
      if (isHolding) {
        let now = stage.renderer.now;
        // Only throw once per 100 ms
        if (lastToss + 100 < now) {
          lastToss = now;
          // We can use "tossAt" to throw toward a specific point
          let p = projectiles.get();
          if (p) (p.role as Projectile).tossAt(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, v.x, v.y, h, 0, 0);
        }
      }
    }));
```

You'll notice that our timer calls `tossAt()`.  It takes seven parameters:

- `fromX`   The X coordinate of the center of the actor doing the toss
- `fromY`   The Y coordinate of the center of the actor doing the toss
- `toX`     The X coordinate of the point at which to toss
- `toY`     The Y coordinate of the point at which to toss
- `actor`   The actor who is performing the toss
- `offsetX` The x distance between the center of the projectile and the center of
  the actor tossing the projectile
- `offsetY` The y distance between the center of the projectile and the center of
  the actor tossing the projectile

Remember that you can hover over `tossAt`, and VSCode will share this
information with you.

Finally, we'll put the button on the screen for controlling the projectiles:

```typescript
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { touchDown, touchUp, panMove }
    });
```

Debugging projectiles can be tricky.  In this example, one challenge was that we
had to use touch and pan in an unusual way.  But if you put your hero very close
to the wall, you might find that your projectiles seemed not to work.  Based on
how we are putting them at the center of the hero, the issue could be that, due
to the length of the projectile, the "back end" is touching the wall, leading to
it being reclaimed.  Sometimes the best strategy is to use `console.log()` to
put some debugging statements into your code, and then to watch in the developer
console (accessed by pressing `F12` in your browser) to see what's happening.

## Reclaiming Projectiles Based On Distance

In the previous example, we cheated by putting a border around the screen.  That
doesn't really work for side-scrolling games.  This example uses a different
strategy.  It also shows how projectile damage and enemy damage relate:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "projectiles.html?5"
}
```

We start this level by making a border, setting up gravity, and making a hero
who can move:

```typescript
    boundingBox();
    stage.world.setGravity(0, 10);
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
```

Next, we'll make some enemies that we can defeat.  Their damage amounts will
vary, so that it will take different numbers of projectiles to defeat them:

```typescript
    // draw some enemies to defeat
    for (let i = 0; i < 5; i++) {
      new Actor({
        appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
        rigidBody: new CircleBody({ cx: 2 + 2 * i, cy: 8.5, radius: 0.5 }),
        role: new Enemy({ damage: i + 1 }),
      });
    }
```

We'll use the space bar to toss projectiles, using the `tossFrom()` technique.
To make the game feel a bit more fun, we'll randomly change the projectile image
when we throw it.  (@@red Note: this only works because we'll make sure each of
our projectiles has exactly one `AppearanceComponent`, and that each of those is an `ImageSprite`!@@)

```typescript
    let images = ["color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png"];
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = projectiles.get();
      if (!p) return;
      (p.appearance[0] as ImageSprite).setImage(images[Math.trunc(Math.random() * 4)]);
      (p.role as Projectile).tossFrom(hero, .2, 0, 5, 0);
      p.rigidBody.body.SetAngularVelocity(4);
    });
```

The last step is to create our pool of projectiles.  We'll only make three, but
with no limit, we'll be able to reuse them as much as we want.

```typescript
    // set up the pool of projectiles
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 3; ++i) {
      let appearance = new ImageSprite({ img: "color_star_1.png", width: 0.5, height: 0.5, z: 0 });
      let rigidBody = new CircleBody({ radius: 0.25, cx: -100, cy: -100 });
      rigidBody.setCollisionsEnabled(false);
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ damage: 2, disappearOnCollide: true, reclaimer });
      // Put in some code for eliminating the projectile quietly if it has
      // traveled too far
      let range = 5;
      role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
        if (!actor) return;
        if (!actor.enabled) return;
        let role = actor.role as Projectile;
        let body = actor.rigidBody.body;
        let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
        let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
        if ((dx * dx + dy * dy) > (range * range)) reclaimer(actor);
      });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement(), role });
      p.rigidBody.body.SetGravityScale(0);
      projectiles.put(p);
    }

```

In the configuration of these projectiles, we use a new feature of the role:
`prerenderTasks`.  It is a collection of functions.  While it's possible to put
many `prerenderTasks` on each projectile, it's usually best to just have one,
because we have to run each of them for each projectile that has them.  They run
on each clock tick, *before* we update the world.  

Every time we toss a projectile, its `rangeFrom` field will hold the initial
point from which the projectile was tossed. In this code, the task is using the
Pythagorean theorem to figure out if the projectile has moved more than `range`
meters away from that point, in which case we reclaim it.  Notice that you could
use `hero.rigidBody.cx` and `hero.rigidBody.cy` if you wanted to think about the
hero's current location, instead.  That would make more sense if we were just
worried about things going off-screen.

One last note: you probably remember that the Pythagorean theorem says:

$$
c^2 = a^2 + b^2
$$

That implies that the distance formula is:

$$
c = \sqrt{a^2 + b^2}
$$

Our code doesn't bother to take the square root.  Instead, it uses the square of
the range (`range * range`).  The result is the same, but square roots are
expensive to compute.  Since we don't need it, we don't bother.

## Varying Projectile Velocity

In our next game, we'll vary the velocity of projectiles based on the distance
between where we touch and where the hero resides:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "projectiles.html?6"
}
```

This level is reminiscent of games where you need to keep asteroids from hitting
the ground.  We start by drawing a floor, but no bounding box, turning on a
little bit of gravity, and making our hero:

```typescript
    stage.world.setGravity(0, 3);

    // We won't have a bounding box, just a floor:
    new Actor({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: 9.05, width: 32, height: .1 }),
      role: new Obstacle(),
    });

    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8.5, cy: 0.5, radius: 0.5 }),
      role: new Hero(),
    });
```

Next, let's set up a timer that drops an enemy every second.  We'll also say
"you must defeat 20 enemies to win":

```typescript
    // We'll set up a timer, so that enemies keep falling from the sky
    stage.world.timer.addEvent(new TimedEvent(1, true, () => {
      // get a random number between 0.0 and 15.0
      let x = Math.trunc(Math.random() * 151) / 10;
      new Actor({
        appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
        rigidBody: new CircleBody({ cx: x, cy: -1, radius: 0.5 }),
        movement: new GravityMovement(),
        role: new Enemy(),
      });
    }));
    stage.score.setVictoryEnemyCount(20);
```

Finally, we need to set up our pool of projectiles.  You'll quickly realize that
this code is almost the same as one of the previous examples.  There are just a
few small differences:

- Since there's gravity, we use `SetGravityScale(0)` on the projectiles, so that
  they aren't affected by gravity.
- Some of the numbers are different, like 50 milliseconds and the offset for
  `tossAt()`.
- We're using an `ImageSprite` for the appearance.
- Instead of `fixedVectorVelocity`, the projectiles have a `multiplier`, to slow
  down the velocity that we compute based on the position of the touch.

```typescript
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 100; ++i) {
      // Be sure to explore the relationship between setCollisionsEnabled and disappearOnCollide
      let appearance = new ImageSprite({ width: 0.25, height: 0.25, img: "grey_ball.png", z: 0 });
      let rigidBody = new CircleBody({ radius: 0.125, cx: -100, cy: -100 });
      rigidBody.body.SetGravityScale(0); // immune to gravity
      rigidBody.setCollisionsEnabled(true); // No bouncing on a collision
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ damage: 2, disappearOnCollide: true, reclaimer });
      // Put in some code for eliminating the projectile quietly if it has
      // traveled too far
      let range = 10;
      role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
        if (!actor) return;
        if (!actor.enabled) return;
        let role = actor.role as Projectile;
        let body = actor.rigidBody.body;
        let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
        let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
        if ((dx * dx + dy * dy) > (range * range)) reclaimer(actor);
      });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement({ multiplier: .8 }), role });
      projectiles.put(p);
    }

    let v = new b2Vec2(0, 0);
    let isHolding = false;
    let touchDown = (_actor: Actor, hudCoords: { x: number; y: number }) => {
      isHolding = true;
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      v.x = world.x;
      v.y = world.y;
      return true;
    };
    let touchUp = () => { isHolding = false; return true; };
    let panMove = touchDown;
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { touchDown, touchUp, panMove },
    });

    let lastToss = 0;
    stage.world.timer.addEvent(new TimedEvent(.01, true, () => {
      if (isHolding) {
        let now = stage.renderer.now;
        if (lastToss + 50 < now) {
          lastToss = now;
          let p = projectiles.get();
          if (p) (p.role as Projectile).tossAt(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, v.x, v.y, h, 0, -.5);
        }
      }
    }));
```

When you make a game, you'll probably want to put the creation of projectile
pools into functions, so that your main code doesn't get cluttered with all of
this complexity!

## When Projectiles Don't Disappear

In the following example, we don't always want our projectiles to disappear.
Watch what happens as you toss projectiles and they collide with different
obstacles.  Also, notice how a hint appears after a little while, and how
there's a way to jump-and-toss.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "projectiles.html?7"
}
```

Below is the code for this example.  If you've been following through the
tutorial, there is probably only one thing that will surprise you.  We need to
get the projectile to "bounce off of" the bucket, instead of disappearing.

The way we do this is by providing custom code to run when a projectile and
obstacle collide.  This code won't do anything, but it will return `false`.
This tells JetLag to ignore the interaction, instead of using it as an reason to
call the `reclaimer`.

```typescript
    stage.world.setGravity(0, 10);
    boundingBox();

    // Make a hero
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .4, cy: 0.4, radius: 0.4 }),
      role: new Hero(),
      gestures: { tap: () => { (h.role as Hero).jump(0, -10); return true; } }
    });

    // draw a bucket as three rectangles
    //
    // We want to make it so that when the ball hits the obstacle (the bucket),
    // it doesn't disappear. The only time a projectile does not disappear when
    // hitting an obstacle is when you provide custom code to run on a
    // projectile/obstacle collision, and that code returns false. In that case,
    // you are responsible for removing the projectile (or for not removing it).
    // That being the case, we can provide code that just returns false, and
    // that'll do the job.
    new Actor({
      appearance: new FilledBox({ width: 0.1, height: 1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 8.95, cy: 3.95, width: 0.1, height: 1 }),
      role: new Obstacle({ projectileCollision: () => false }),
    });
    new Actor({
      appearance: new FilledBox({ width: 0.1, height: 1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 10.05, cy: 3.95, width: 0.1, height: 1 }),
      role: new Obstacle({ projectileCollision: () => false }),
    });
    new Actor({
      appearance: new FilledBox({ width: 1.2, height: 0.1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 9.5, cy: 4.4, width: 1.2, height: 0.1 }),
      role: new Obstacle({ projectileCollision: () => false }),
    });

    // Place an enemy in the bucket, and require that it be defeated
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 9.5, cy: 3.9, radius: 0.4 }),
      movement: new GravityMovement(),
      role: new Enemy({ damage: 4 }),
    });
    stage.score.setVictoryEnemyCount();

    // Set up a projectile pool so we can toss balls at the basket
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 5; ++i) {
      let appearance = new ImageSprite({ width: 0.5, height: 0.5, img: "grey_ball.png", z: 0 });
      let rigidBody = new CircleBody({ radius: 0.25, cx: -100, cy: -100 });
      rigidBody.body.SetGravityScale(1); // turn on gravity
      rigidBody.setCollisionsEnabled(true); // Collisions count... this should bounce off the basket
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ damage: 1, disappearOnCollide: true, reclaimer });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement({ multiplier: 2 }), role });
      projectiles.put(p);
    }

    // cover "most" of the screen with a button for throwing projectiles.  This
    // ensures that we can still tap the hero to make it jump
    new Actor({
      appearance: new FilledBox({ width: 15, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8.5, cy: 4.5, width: 15, height: 9 }, { scene: stage.hud }),
      gestures: {
        tap: (_actor: Actor, hudCoords: { x: number; y: number }) => {
          let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
          let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
          let p = projectiles.get(); if (!p) return true;
          (p.role as Projectile).tossAt(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, world.x, world.y, h, 0, 0);
          return true;
        }
      }
    });

    // put a hint on the screen after 15 seconds to show where to click to ensure that
    // projectiles hit the enemy
    stage.world.timer.addEvent(new TimedEvent(15, false, () => {
      new Actor({
        appearance: new ImageSprite({ width: 0.2, height: 0.2, img: "purple_ball.png" }),
        rigidBody: new CircleBody({ cx: 2.75, cy: 2.4, radius: 0.1 }, { collisionsEnabled: false }),
        role: new Obstacle({ projectileCollision: () => false }),
      });
    }));
```

## Wrapping Up

Projectiles are very customizable.  Each time we changed just one argument to
the role or movement, we saw a different kind of game behavior emerge.  As you
look through other uses of projectiles in the tutorial series, you'll find even
more.  For the most part, they're closely related to what you saw in this
tutorial.  However, there is a *third* way of tossing projectiles, which isn't
in this tutorial at all: "punching".  Punching is a way to glue a projectile to
an actor, so it serves as a sort of hit box.  This could be a punch, a melee
weapon, or other behavior.  If you're interested, be sure to look at the
"combat" section of the "farming and fighting" game.

```md-config
page-title = Projectiles And Actor Pools
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
.red {color: red}
```
