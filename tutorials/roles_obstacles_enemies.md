# Roles: Obstacles and Enemies

This tutorial continues the discussion of roles that actors can play, by
covering the Obstacle and Enemy roles.  Along the way, we'll learn more about
heroes.

@@red Note@@ There is another role, `Projectile`, that is very common in JetLag.
It's special, so we'll leave its discussion to a tutorial that's all about
projectiles.

## Preliminary Setup

You should start by doing the "Preliminary Setup" section of the "Rigid Bodies"
tutorial.  This will ensure you have the assets you need, and that the code is
in a good starting place (e.g., the `builder()` function should be empty).

## An Introduction to Obstacles

We've already seen Obstacles, but just to recap, the default behavior for an
Obstacle is to act like a wall:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?8"
}
```

It doesn't take much code to create that level: we just have a hero and an
obstacle.  One thing to notice is that the default behavior of an obstacle is
that it is static, and its collisions are enabled, so the hero will collide with
it.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Obstacle(),
    });
```

## Obstacle-Enemy Collisions

In the next mini-game, we'll see two new features of Obstacles.  The first is
that we can run code when an enemy collides with an obstacle.  In the game, this
means that the obstacle will be able to "defeat" one of the enemies.

The other thing you'll see in this mini-game is that we can disable
hero-obstacle collisions, even when everything else still collides with the
obstacle.  This lets us have a wall that the hero can run through, so it can
hide from an enemy that is chasing it.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?9"
}
```

To make this mini-game, we start with a hero:

```typescript
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

Next, we'll add two enemies.  Notice that I'm using `extra` to mark one as being "weak":

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: 0.4 }, { dynamic: true }),
      movement: new ChaseMovement({ target: h, speed: 1 }),
      role: new Enemy(),
      extra: { weak: true }
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 2, radius: 0.4 }, { dynamic: true }),
      movement: new ChaseMovement({ target: h, speed: 1 }),
      role: new Enemy(),
      extra: { weak: false }
    });
```

Finally, we'll make an obstacle.  When making the `Obstacle` role, I've added
two things.  The first is `disableHeroCollision`, which lets the hero pass
through this wall.  The second is an `enemyCollision` function, which defeats
the enemy only if it is weak.

```typescript
    new Actor({
      appearance: new FilledBox({ width: 0.2, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 8, width: .2, height: 2 }),
      role: new Obstacle({
        disableHeroCollision: true, enemyCollision: (_o: Actor, e: Actor) => {
          if (e.extra.weak) (e.role as Enemy).defeat(true);
        }
      }),
    });
```

## Obstacle-Hero Collisions

Similarly, we can run code when a hero collides with an obstacle:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?10"
}
```

The code for this level doesn't have many surprises.  The only tricky thing is
that we use `extra` to track if the hero has already been resized.  That lets us
avoid re-shrinking the hero every time it collides with the obstacle.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
      extra: { regular: true }
    });

    new Actor({
      appearance: new FilledBox({ width: 0.2, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 8, width: .2, height: 2 }),
      role: new Obstacle({
        heroCollision: (_o: Actor, h: Actor) => {
          if (h.extra.regular) {
            h.resize(.5);
            h.extra.regular = false;
          }
        }
      }),
    });
```

## Enabling Jump

Another important property of Obstacles is that they serve as a "base" from
which a hero can jump.  Recall from the last tutorial set that jumping is a
property of the Hero role, not of the actor's movement.  This lets us detect
obstacle/hero collisions, and use them to re-enable jumping.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?11"
}
```

In this example, I wanted to show that sometimes when you press `SPACE` to make
the hero jump, it doesn't work.  The `console.log()` call will print to the
developer console (remember: you can open it with `F12`) every time the player
tries to make the hero jump.  When the hero is in the air, the call to `jump`
will not do anything.

We start by setting up gravity and a hero.  Pressing the space bar will try to
make the hero jup.  Notice that this mini-game has a "side" perspective:

```typescript
    stage.world.setGravity(0, 10);

    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // By default, obstacles reenable jumping upon any collision, any side, so
    // colliding with a border will re-enable jumps
    let jump_attempts = 0;
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      jump_attempts += 1;
      console.log("jump attempt " + jump_attempts);
      (hero.role as Hero).jump(0, -7.5);
    });
```

The floor, side walls, and ceiling all have the default behavior, which is that
any collision, from any side, will re-enable jumping by the hero.  Now let's add
a platform that only re-enabled jumping when the hero collides with its top.

```typescript
    // But this one only works from the top
    new Actor({
      appearance: new FilledBox({ width: 2, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 5, width: 2, height: 2 }),
      role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
    });
```

Before moving on, you should try to make changes to this code.  What happens if
you put `[DIRECTION.N, DIRECTION.S]`?  Can you repeatedly make the hero jump, so
that it seems to be stuck to the bottom of the platform?  Can you use the sides
to do "wall jumps" and reach the ceiling?

## Enemies

In JetLag, the default is that enemies have a `damage` of 2, and heroes have a `strength` of 1.  When a hero and enemy collide, we remove the enemy and subtract its damage from the hero's strength if we can do so without the hero strength becoming 0 or negative.  Otherwise, we remove the hero.

In this level, we use a goodie to increase the hero strength.  To help realize
that the hero strength has changed, we also add an `onStrengthChange` to the
hero, which changes its size.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?12"
}
```

Here's the code for the above mini-game.  You should use this as an opportunity
to check your understanding... if you copy this code into your `builder()`, and
then hover over things that don't make sense, are you able to understand why
this code delivers the behaviors you're seeing in the above game?

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.4, height: 0.4, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.2 }, { density: 2 }),
      movement: new TiltMovement(),
      role: new Hero({
        onStrengthChange: (h) => {
          if ((h.role as Hero).strength == 4) h.resize(2); else h.resize(.5);
        }
      }),
    });

    // The enemy either defeats the hero or decreases its strength.  If it just
    // decreases the strength, we'll see the hero strength change code run.
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Enemy(),
    });

    // This goodie changes the hero's strength, which, in turn, triggers the
    // hero's strength change code
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8, radius: 0.4 }),
      role: new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          (h.role as Hero).strength += 3;
          return true;
        }
      }),
    });
```

## More About Jumping

Any time it's possible to jump, there's a chance that we would want
double-jumps.  In JetLag, we can have any finite number of jumps, by giving the
hero a `numJumpsAllowed` value.  Here's an example:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?13"
}
```

And here's the code for the example.  Notice that the default is for obstacles
to re-enable jumping upon any collision (on any side).  This means that
colliding with borders will re-enable jumps.  This will probably lead to some
weird glitches.

```typescript
    stage.world.setGravity(0, 10);

    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero({ numJumpsAllowed: 2 }),
    });

    let jump_attempts = 0;
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      jump_attempts += 1;
      console.log("jump attempt " + jump_attempts);
      (hero.role as Hero).jump(0, -7.5);
    });
```

Remember to look at the developer console (F12) for messages about when the hero
tried to jump.

Since jumping is just applying an impulse, some games benefit from "infinite"
multi-jump.  Examples include swimming games and flying games like Flappy Bird:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?14"
}
```

You should try to use this code, along with what you've seen about camera
boundaries and parallax, to make something that feels kind of like a Flappy Bird
clone.

```typescript
    stage.world.setGravity(0, 10);

    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero({ allowMultiJump: true }),
    });

    let jump_attempts = 0;
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      jump_attempts += 1;
      console.log("jump attempt " + jump_attempts);
      (hero.role as Hero).jump(0, -7.5);
    });
```

## Crawling And Jumping To Defeat Enemies

In JetLag, you can use jumping and crawling as ways to defeat enemies without
losing strength.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?15"
}
```

In the code below, crawling is like jumping: it is a behavior attached to the
`Hero` role, not to its movement.  That means we can use `Tilt` to move the
Hero, and still get crawling and jumping behaviors.  Let's start by setting up
gravity and making the hero:

```typescript
    stage.world.setGravity(0, 10);
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 2, cy: 3, width: 0.8, height: 0.8 }, { density: 2 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

Next, we'll add two enemies.  We use `defeatByCrawl` and `defeatByJump` to
indicate that a hero who is crawling upon collision, or in the air upon
collision, can defeat the enemy without taking any damage.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8.6, radius: 0.4 }),
      role: new Enemy({ defeatByCrawl: true, }),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.6, radius: 0.4 }),
      role: new Enemy({ defeatByJump: true }),
    });
```

Finally, we'll set up `SPACE` as the key for jumping, and `TAB` as the key for
crawling.

```typescript
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => { (hero.role as Hero).jump(0, -7.5); });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => { (hero.role as Hero).crawlOn(Math.PI / 2); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_TAB, () => { (hero.role as Hero).crawlOff(Math.PI / 2); });
```

It's important to remember that while JetLag calls the feature "crawl", with the
right change in graphics, this could be crawling, ducking, rolling, spinning, or
other behaviors.

## Staying Alive

In the next mini-game, there is more than one hero.  Usually, that means the
game will go on until all heroes are defeated.  However, in this mini-game one
of the heroes is special: the level will end immediately if that one is
defeated.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?16"
}
```

To make the level, we'll start by making several heroes.  Their strengths will
vary, and the third one we make will be the one that must not be defeated.

```typescript
    for (let i = 1; i < 4; ++i) {
      new Actor({
        appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
        rigidBody: new BoxBody({ cx: 2 * i, cy: 3, width: 0.8, height: 0.8 }, { density: 2 }),
        movement: new TiltMovement(),
        role: new Hero({ strength: 10 - i, mustSurvive: i == 3 }),
      });
    }
```

Next, we'll make an enemy.  It will have a high damage, so it can defeat most of
our heroes.  Of course, for most heroes, when they are defeated, the game won't
end.  We'll also say that when the enemy defeats a hero, it will grow.  Finally,
when the hero defeats the enemy, we'll put a goodie into the world.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8.6, radius: 0.4 }),
      role: new Enemy({
        damage: 8, onDefeatHero: (e: Actor) => e.resize(1.2), onDefeated: (e: Actor) =>
          new Actor({
            appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
            rigidBody: new CircleBody({ radius: .25, cx: e.rigidBody.getCenter().x, cy: 2 }),
            role: new Goodie()
          })
      }),
    });
```

Did you the new `onDefeatHero` and `onDefeated` features look familiar?  If so,
then you're probably starting to get the hang of the kind of thinking and
programming that JetLag encourages.

## Invincibility

For our last mini-game of this tutorial, we'll see how JetLag supports
invincibility.  In this level, the goodie (blue ball) adds 15 seconds of
invincibility to the hero.  But be careful... not all enemies can be defeated by
invincibility.  That's an important point... if you were making a game like Super Mario Bros, you might want to put an enemy in the bottom of each pit, to detect when the hero fell off stage.  If the hero was invincible, you'd still want to start over on such a collision!

```iframe
{
    "width": 800,
    "height": 450,
    "src": "roles.html?17"
}
```

In this level, we'll say that you need to defeat three enemies to win:

```typescript
    stage.score.setVictoryEnemyCount(3);
```

Now we'll make a basic hero:

```typescript
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }, { density: 2 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

Next, we'll add five enemies.  We'll make them all rotate.  The last enemy won't
damage an invincible hero, but also won't be defeated when an invincible hero
collides with it.  The middle enemy will automatically defeat the hero, even
when the hero is invincible.  Also, notice that we use `disableHeroCollision`,
so that the hero passes through enemies, instead of bouncing off of them.

```typescript
    for (let i = 0; i < 5; ++i) {
      let cfg = { cx: i + 4, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
      new Actor({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
        role: new Enemy({ immuneToInvincibility: i == 4, instantDefeat: i == 2, disableHeroCollision: true }),
      });
    }
```

Next, we'll add a goodie that makes the hero invincible.  Notice that we don't
just set the `invincibleRemaining`, instead we *add* to it.  We could have just
set it to 15, but this approach would let there be several goodies, and the hero
could accrue lots of time being invincible.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.25, }, { rotationSpeed: .25 }),
      role: new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          (h.role as Hero).invincibleRemaining = ((h.role as Hero).invincibleRemaining + 15); return true;
        }
      }),
    });
```

Finally, we'll put some text on the screen to show how much invincibility time
is remaining.  We haven't really discussed text yet, so this code might be
confusing.  Don't worry... we'll get to it in a later tutorial.  The main thing
to remember is that you need to give the player some cues about invincibility,
so they can use it well.

```typescript
    new Actor({
      appearance: new TextSprite({ face: "Arial", size: 16, color: "#3C64BF", center: false }, () => (hero.role as Hero).invincibleRemaining.toFixed(0) + " Invincibility"),
      rigidBody: new CircleBody({ radius: .01, cx: .01, cy: 1 }, { scene: stage.hud })
    })
```

## Wrapping Up

In this tutorial, we saw that Heroes, Obstacles, and Enemies are more advanced
and robust than the other roles.  As an exercise, you should think about how you
could use Obstacles in place of Goodies, Destinations, and Sensors.  Then you
should try to come up with a reason why you couldn't use Obstacles in place of
Heroes or Enemies.  If your understanding is very good, then you could even
propose what change JetLag would need in order for Obstacles to be able to serve
as if they were Heroes and Enemies.

```md-config
page-title = Roles: Obstacles and Enemies

img {display: block; margin: auto; max-width: 500px;}
.red {color: red;}
```
