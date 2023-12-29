# Keeping Score (1/2)

In this tutorial, we'll learn about how scores work in JetLag. JetLag tracks a
lot of information while your game is playing, through `stage.score`.

## What Gets Counted?

JetLag keeps track of many different statistics while your game is being played.
Here are the main things it tracks, along with the names of the functions for
reading them from your code:

- How many heroes have reached destinations?
  `stage.score.getDestinationArrivals()`
- How many enemies have been defeated? `stage.score.getEnemiesDefeated()`
- How many enemies have been created? `stage.score.getEnemiesCreated()`
- How many goodies (of each type) have been collected?
  `stage.score.getGoodieCount(i) // i in (0,1,2,3)`
- How any heroes have been defeated? `stage.score.getHeroesDefeated()`
- How many heroes have been created? `stage.score.getHeroesCreated()`
- How much time is left until the level ends in defeat?
  `stage.score.getLoseCountdownRemaining()`
- How much time is on the stopwatch? `stage.score.getStopwatch()`
- How much time is left until the level ends in victory?
  `stage.score.getWinCountdownRemaining()`

Some of these are, themselves, quite complex.  For example, there are several
ways to defeat an enemy:

- Hero collides with it, hero is invincible
- Hero collides with it, hero strength > enemy damage
- Projectile collides with it, decreases its damage
- Hero jumps on it, it's able to be defeated by jump
- Hero crawls into it, it's able to be defeated by crawl
- You call enemy.defeat() on the enemy, e.g., in an obstacle callback, gesture
  callback, or timer.

JetLag also has several different ways for an event to lead to a level being
won:

- Defeat a specific number of enemies
- Defeat all enemies
- Collect a certain amount of goodies (of each type)
- Have enough heroes reach destinations
- Survive for long enough
- You call score.winLevel()

Finally, there are a few events that lead to a level being lost:

- All heroes are defeated
- A specific, important hero is defeated
- Time runs out
- You call score.loseLevel()

In this tutorial and the next, we'll make several mini-games, and use them to
show each of these behaviors.

## Getting Started

This tutorial uses the `enableTilt()` and `boundingBox()` functions.  You'll
also want to download `sprites.json` and add it to your `imageNames`.

It can be difficult to see that the level was actually won or lost if it
restarts immediately, so our examples will also make use of these two helper
functions from the tutorial on transitioning among stages:

```typescript
/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will start the next level.
 *
 * @param message A message to display in the middle of the screen
 */
function winMessage(message: string) {
  stage.score.winSceneBuilder = (overlay: Scene) => {
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
          return true;
        }
      },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    });
  };
}

/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will restart the level.
 *
 * @param message A message to display in the middle of the screen
 */
function loseMessage(message: string) {
  stage.score.loseSceneBuilder = (overlay: Scene) => {
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
          return true;
        }
      },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    })
  };
}
```

## Common Code

In every one of our mini-games for this tutorial, we'll want to print some
information on the screen so that we can see the scores.  We'll also want to set
up the win and lose scenes, and tell JetLag what to do when the level is won or
lost.  The following code handles *everything* that might be useful.  For any
one level, it might be more than we'll need, but it's easiest to just write it
all once:

```typescript
  // first, set up winning and losing to both restart the level
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };
  winMessage("Yay");
  loseMessage("Try Again");

  // Next, put all the info on the screen
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Arrivals: " + stage.score.getDestinationArrivals()),
    rigidBody: new CircleBody({ cx: .1, cy: .1, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Defeated: " + stage.score.getEnemiesDefeated() + " / " + stage.score.getEnemiesCreated()),
    rigidBody: new CircleBody({ cx: .1, cy: .4, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Goodies: " + stage.score.getGoodieCount(0) + ", " + stage.score.getGoodieCount(1) + ", " + stage.score.getGoodieCount(2) + ", " + stage.score.getGoodieCount(3)),
    rigidBody: new CircleBody({ cx: .1, cy: .7, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Heroes: " + stage.score.getHeroesDefeated() + " / " + stage.score.getHeroesCreated()),
    rigidBody: new CircleBody({ cx: .1, cy: 1, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Stopwatch: " + stage.score.getStopwatch().toFixed(2)),
    rigidBody: new CircleBody({ cx: .1, cy: 1.3, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "FPS: " + stage.renderer.getFPS().toFixed(2)),
    rigidBody: new CircleBody({ cx: .1, cy: 1.6, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => stage.score.getWinCountdownRemaining() ? "Time Until Win: " + stage.score.getWinCountdownRemaining()?.toFixed(2) : ""),
    rigidBody: new CircleBody({ cx: .1, cy: 1.9, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => stage.score.getLoseCountdownRemaining() ? "Time Until Lose: " + stage.score.getLoseCountdownRemaining()?.toFixed(2) : ""),
    rigidBody: new CircleBody({ cx: .1, cy: 1.9, radius: .01 }, { scene: stage.hud })
  });

  // Set up tilt and put a box on the screen
  enableTilt(10, 10);
  boundingBox();
```

In the above code, you'll notice some lines that use the question mark in
unusual ways.  For example, there's a line that says:

```typescript
stage.score.getLoseCountdownRemaining() ? "Time Until Lose: " + stage.score.getLoseCountdownRemaining()?.toFixed(2) : ""
```

The syntax `condition ? value1 : value2` is a special version of an `if`
statement.  You can interpret this as saying "if the condition is not "false",
use value1.  Otherwise use value2.  So, in the specific example,
`getLoseCountdownRemaining()` could return `undefined` (i.e., because there is
no lose countdown in the level).  In that case, value2 (`""`) will be displayed.
Otherwise, we'll get the value and turn it into a number with two decimal
places.

## Winning And Losing Via Timers

In the following game, there is a timer, and the level wins after 5 seconds:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?1"
}
```

The code for this level is just one line:

```typescript
    // Automatically win in 5 seconds
    stage.score.setVictorySurvive(5);
```

If we instead want to lose after 5 seconds, we can do it like this:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?2"
}
```

```typescript
    // Automatically lose in 5 seconds
    stage.score.setLoseCountdownRemaining(5);
```

## Winning By Defeating Enemies

The `stage.score` object tracks how many enemies have been created, and how many
have been defeated.  This gives us two distinct win conditions.  We can win by
defeating "all" of the enemies (which is useful when timers or other events add
enemies to the game while it is being played), or we can win by defeating a
certain number of enemies.

As for *how* to defeat enemies, there are a few built-in ways.  In this example,
the hero has a lot of strength, which means it can defeat enemies by colliding
with them:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?3"
}
```

Before reading the code, you should try to write this level all by yourself.
Then take a look and see how your code compares to mine.  One thing to keep in
mind is that `stage.score.setVictoryEnemyCount()` can be called with no
arguments, or with a number, so if we don't provide a number, then "all" of the
enemies will need to be defeated.

```typescript
    // Defeat all the enemies via collision
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount();
```

We can also use invincibility as a way to defeat enemies.  You'll recall from
the "Animations" tutorial that we can animate a hero while it is invincible.  We
can also put some text on the screen, or change the music, to indicate that the
hero is invincible.  In this level, I didn't do that, so you'll have to guess
about how much time you still have to defeat the enemies after collecting the
goodie.  Also, notice that the code explicitly says "you must defeat 2 enemies".

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?4"
}
```

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 1 }) // Not enough strength to defeat anyone!
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: (_g: Actor, h: Actor) => { (h.role as Hero).invincibleRemaining = 10; return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount(2);
```

JetLag also has a notion of "crawling".  You can think of it as crawling,
crouching or whatever else makes sense.  Defeating an enemy via crawling may
seem like a strange idea, but sometimes you'll find that you want to require the
player to crawl to get through a space.  Placing an enemy in the space, and
letting the hero defeat it via crawling, is a natural way to achieve the desired
effect.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?5"
}
```

In the code, you'll see that the space bar makes the hero crawl.  JetLag lets
you rotate the hero while it is crawling.  You might instead want to resize it.
There are also options to use a special animation while crawling.

```typescript
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).crawlOn(Math.PI / 2))
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).crawlOff(Math.PI / 2))
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy({ defeatByCrawl: true }),
    });
    stage.score.setVictoryEnemyCount(1);
```

It's also possible to defeat an enemy by jumping onto it:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?6"
}
```

Just as the previous example used `defeatByCrawl: true`, this uses
`defeatByJump`.  You could even use both, if that made sense in your game.

```typescript
    stage.world.setGravity(0, 10);
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -7.5))
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy({ defeatByJump: true }),
    });
    stage.score.setVictoryEnemyCount(1);
```

Continuing with our theme of "how to defeat enemies", the main use of the
projectile role is to give the player something to toss at enemies, to reduce
their damage.  In the example below, the space bar will toss projectiles
rightward:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?7"
}
```

When you do the tutorial about projectiles, you'll learn more about how they
work.  You'll also learn about `ActorPool`... you should never use projectiles
without an `ActorPool`!

In the example below, we only have one way to throw projectiles.  You might want to try adding another button, or a different key, for tossing projectiles in another direction.

```typescript
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = new Actor({
        appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
        rigidBody: new CircleBody({ cx: h.rigidBody.getCenter().x + .2, cy: h.rigidBody.getCenter().y, radius: .1 }),
        movement: new ProjectileMovement(),
        role: new Projectile()
      });
      // We can use "tossFrom" to throw in a specific direction, starting at a
      // point, such as the hero's center.
      (p.role as Projectile).tossFrom(h, .2, 0, 5, 0);
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount(1);
```

Finally, when all else fails, we can defeat an enemy via code that we write.  In
the example below, we'll say that tapping an enemy defeats it.  Note that you
could use an obstacle collision, or a timer, or any event as the trigger for
defeating an enemy.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?8"
}
```

In the code below, you'll notice that one enemy is defeated via `defeat(false)`,
and the other via `defeat(true)`.  This is an important distinction.  If your
game has a boss who must be defeated, and other enemies who don't really matter,
then you could use `false` for all but the boss.  Another option would be to use
the `onDefeated` feature of the Enemy role to automatically win when the boss
was defeated.

```typescript
    // Defeating this one doesn't actually count!
    const e = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
      gestures: { tap: () => { (e.role as Enemy).defeat(false); return true; } }
    });
    // This one does count.  Be sure to watch the counter as you defeat it.
    const e2 = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 5.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
      gestures: { tap: () => { (e2.role as Enemy).defeat(true); return true; } }
    });
    stage.score.setVictoryEnemyCount(1);
```

## Wrapping Up

In the second half of this tutorial, we'll explore other ways of winning, and
then we'll look at ways of losing.  And, of course, you may decide that in the
end, you don't want to use JetLag's score at all.  You're always free to keep
score on your own.  If that's the case, you'll probably want to have a look at
the "storage" tutorial for advice about how to keep track of information as you
move from level to level.

```md-config
page-title = Keeping Score (1/2)
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
