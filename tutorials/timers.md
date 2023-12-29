# Timer Events

This tutorial explores the different kinds of time-based events that JetLag
supports.

## Review: Events

Remember that in games, we typically say that there is a simulation that is
running, and events are the way that we change the course of the simulation.
Input (keyboard/mouse/touch) is one source of events that we've studied, and
collisions among actors are another.  The third major source of events is time.

Timed events can be things that happen once (after some amount of time
transpires) or that happen repeatedly (for example, every X milliseconds).  We
can also use timers as a way to "check" for hard-to-explain situations and
correct them.

## Getting Started

In this tutorial, we will use the "sprites.json" spritesheet.  You'll want to
make sure you download `sprites.png` and `sprites.json` to your `assets` folder,
and then add `sprites.json` to `imageNames` in your `Config` object.

You should also make sure copy the `boundingBox()` and `enableTilt()` functions
into your `game.ts` file.

## Our First Timer

In the following game, we'll use a timer to make some code run after five
seconds elapse:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "timers.html?1"
}
```

To achieve this behavior, we'll replace the contents of `builder()` with the
following code.  First we'll set up tilt, and a hero who can jump:

```typescript
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    boundingBox();

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));
```

Now we'll add a timer.  The `stage.world` and `stage.hud` each have a timer
object that counts milliseconds, so we give it a new `TimedEvent` that runs in 5
seconds.  `false` indicates that the timer does not repeat.  The code for making
a destination won't run until 5 seconds transpire.  At that time, a new
destination will be put on the screen:

```typescript
    stage.world.timer.addEvent(new TimedEvent(5, false, () => {
      // Make a destination
      new Actor({
        appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
        rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
        role: new Destination(),
      });
    }))
```

Finally, we need to make sure that JetLag knows that reaching the destination
wins the level, and that JetLag knows what to do when the level is won or lost:

```typescript
    stage.score.setVictoryDestination(1);
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };
```

## Repeating Timers And Time As A Win Condition

In this next mini-game, we'll set up a timer that makes enemies reproduce.
We'll also say that if the player stays alive for 5 seconds, they win.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "timers.html?2"
}
```

We'll begin by setting up a world with an overhead view:

```typescript
    stage.world.setGravity(0, 0);
    enableTilt(10, 10);
    boundingBox();
```

Now let's define how the level is won.  By using `setVictorySurvive()`, we can
indicate that after 10 seconds, the level is won.  We'll also put some text on
the *HUD* to show how much time is left.  Notice that `toFixed(2)` will trim our
timer down to 2 decimal places.  (The `!` after `getWinCountdownRemaining()` is
our way of telling TypeScript "don't worry, this will really be a number"... you
can ignore it).

```typescript
    // Specify default win and lose behaviors
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };

    // Next, let's say that if you survive for 10 seconds, you win:
    stage.score.setVictorySurvive(10);

    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => (stage.score.getWinCountdownRemaining()!.toFixed(2))),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.2, radius: 0.01 }, { scene: stage.hud })
    });
```

Next, we'll make a hero and a goodie.  If the hero collects the goodie, we will
subtract two seconds from the timer, making it easier to win.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: 0.25 }),
      role: new Goodie({ onCollect: () => { stage.score.setWinCountdownRemaining(stage.score.getWinCountdownRemaining()! - 2); return true; } }),
    });
```

Finally, we'll make a timer that runs every 2 seconds.  The tricky thing about
this timer is that we want it to "reproduce" every enemy on the screen.  That
means we need to keep track of all of the enemies.

We can use an "array" to store the enemies we've made so far.  So our first step
will be to make an enemy, make an array, and put the enemy into the array. We'll
attach some "extra" information to the enemy, so that we can track how many
times we've duplicated an enemy... if we don't, we'll risk making thousands of
enemies (if we double every 2 seconds, after 20 seconds we've made 1024
enemies!).

```typescript
    let e = new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 7, radius: 0.25 }),
      movement: new TiltMovement(),
      role: new Enemy(),
      extra: { num: 6 } // We'll use this to count down so we don't make too many enemies
    });

    // We can use this array to store all of the enemies in the level
    let enemies: Actor[] = [];
    enemies.push(e);
```

Now comes the hard part.  The problem is that we're supposed to go through the
array, and for each thing in the array, we need to make another enemy.  But we
need to put those new enemies into the array too.  If we're not careful, we'll
end up putting new things into the array and immediately duplicating them, which
will put new things into the array, which we'll immediately duplicate... that
sounds like it's never going to stop!

Instead, we'll put all the new enemies into a new array, and after we're done
with all the duplications, we'll add the new array into the `enemies` array.

```typescript
    // set a timer that runs every 2 seconds
    //
    // Note: the timer repeats over and over, but at some point, our code will
    // just not do anything in response to it, because all the enemies will have 
    // exhausted their number of reproductions
    stage.world.timer.addEvent(new TimedEvent(2, true, () => {
      // newEnemies is where we'll track the enemies we make during this round 
      // of the timer
      let newEnemies: Actor[] = [];

      // For each enemy we've made, if it has remaining reproductions, then make
      // another enemy
      for (let e of enemies) {
        // If this enemy has remaining reproductions
        if (e.extra.num > 0) {
          // decrease remaining reproductions
          e.extra.num -= 1;

          // reproduce the enemy, putting the new one "real close" to the 
          // existing one.
          let e2 = new Actor({
            appearance: new ImageSprite({ width: .5, height: .5, img: "red_ball.png" }),
            rigidBody: new CircleBody({ cx: e.rigidBody.getCenter().x + 0.01, cy: e.rigidBody.getCenter().y + 0.01, radius: .25 }),
            movement: new TiltMovement(),
            role: new Enemy(),
            extra: { num: e.extra.num }
          });
          newEnemies.push(e2);
        }
      }

      // We finished reproducing the enemies, so now we can add the new enemies
      // to the main list
      let tmp = enemies.concat(newEnemies);
      enemies = tmp;
    }));
```

This mini-game shows an important point: the timer itself is not difficult.  The
hard thing is making sure that our timer does what we want it to do.

## Losing Via Timers

We can also use timers to lose a level.  This makes the most sense when there's
another way to win.  In essence, we're saying "if you don't finish in time, you
lose".

```iframe
{
    "width": 800,
    "height": 450,
    "src": "timers.html?3"
}
```

To build this game, we'll start by setting up gravity and tilt:

```typescript
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    boundingBox();
```

Now we can add a destination, and a hero who can jump and move via tilt:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));
```

We'll indicate what to do when the level is won or lost:

```typescript
    stage.score.setVictoryDestination(1);
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };
```

And finally, we'll set a timer for losing the level.  We'll also display the
timer on the HUD.

```typescript
    stage.score.setLoseCountdownRemaining(5);
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => (stage.score.getLoseCountdownRemaining()!.toFixed(2))),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.2, radius: 0.01 }, { scene: stage.hud })
    });
```

Before moving on with this tutorial, you should try to add a goodie that adds
time to the counter.  If you're not sure where to start, you might want to
review the previous section of this tutorial.

## Keeping An Eye On The World

Sometimes we need to watch what's happening in the world, so we can make
on-the-fly corrections.  One example is the "block breaker" game from a previous
tutorial, where we might want to do a periodic check to see if the ball lost its
vertical velocity.  Timers that run at a high frequency are a convenient way to
do this.

In the following game, there is an invisible destination.  (Well, right now the
hit boxes are turned on, so it's not *entirely* invisible...).  We'll use timers
to monitor the location of the hero and destination, and to update the hint text
accordingly.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "timers.html?4"
}
```

To make this level, we'll start by setting up gravity and tilt:

```typescript
    stage.world.setGravity(0, 0);
    enableTilt(10, 10);
    boundingBox();
```

Next, let's add the destination.  We'll use an extra "00" in the color to make
it invisible.  We'll also add a hero.  Our timer is going to need to use these
actors, so we'll assign them to variables `d` and `h`, so that they have names
that the timer code can use:

```typescript
    let d = new Actor({
      appearance: new FilledBox({ width: 0.8, height: 0.8, fillColor: "#00000000" }),
      rigidBody: new CircleBody({ cx: 0.5 + 15 * Math.random(), cy: 0.5 + 8 * Math.random(), radius: 0.4 }),
      role: new Destination(),
    });

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
```

Next, let's set up winning and losing:

```typescript
    stage.score.setVictoryDestination(1);
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };
```

Next, let's put two text boxes on the HUD, to indicate the directions that the
hero needs to move in order to find the destination.  Notice that we start by
making two variables, `ud` and `lr`, and the text boxes re-compute their text
based on the values of these variables.  That's very important!  We're going to
change their values using a timer, and when we change their values, we need the
text boxes to update.

```typescript
    let ud = "up";
    let lr = "left";

    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => "go " + lr),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.2, radius: 0.01 }, { scene: stage.hud })
    });
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => "go " + ud),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.7, radius: 0.01 }, { scene: stage.hud })
    });
```

Finally, we'll add our timer.  This code says "run every .01 seconds".  That's
very fast.  In fact, it's impossibly fast, because JetLag usually caps itself at
45 frames per second.  It's OK... the timer will run as frequently as it can,
but no more frequently, so this will effectively run every 1/45th of a second.

```typescript
    stage.world.timer.addEvent(new TimedEvent(.01, true, () => {
      ud = h.rigidBody.getCenter().y < d.rigidBody.getCenter().y ? "down" : "up";
      lr = h.rigidBody.getCenter().x < d.rigidBody.getCenter().x ? "right" : "left";
    }));
```

With that last bit of code in place, you should see that the hints update to
help the hero find its way to the destination.

## Changing Timer Speeds

Some game frameworks have a way of saying that a timer should wait a few
seconds, then start running at some interval.  Others have a way of changing a
timer's frequency on the fly.  JetLag does not support either of these.  If you
need a timer to wait before it starts repeating, you can just create it fro
*within another timer*.

It would be easy enough to change the `TimedEvent` so that its interval could be
updated on the fly.  For now, if you need this behavior, your best bet is to run
your timed event at a very high rate, and compute the real frequency inside of
the timer code.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "timers.html?5"
}
```

Part of the trick for making this work is that we know that JetLag ony runs at
45 frames per second, so we can use a very fast timer, and not worry about it
ever going "too fast".  In the example below, the timer runs every half second.
Let's call this a "tick".  We count the ticks via the `counter` variable.  We
also use the number of defeated enemies as the "phase".  When none have been
defeated, the phase is 10, so it takes 10 ticks before the counter does any
work.  As the number of defeated enemies goes up, the phase goes down, until it
reaches 1, at which point a new enemy will be produced every tick (i.e., every
half second).

```typescript
    stage.score.setVictoryEnemyCount(20);
    stage.world.setGravity(0, 3);

    let counter = 0;
    stage.world.timer.addEvent(new TimedEvent(.5, true, () => {
      let phase = Math.max(1, 10 - stage.score.getEnemiesDefeated()!);
      counter = (counter + 1) % phase;
      if (counter != 0) return;
      let e = new Actor({
        appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
        rigidBody: new CircleBody({ cx: .5 + 15 * Math.random(), cy: -5.5 + 5 * Math.random(), radius: .5 }),
        role: new Enemy(),
        movement: new GravityMovement(),
        gestures: { tap: () => { (e.role as Enemy).defeat(true); return true; } }
      })
    }));

    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => stage.score.getEnemiesDefeated() + ""),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.2, radius: 0.01 }, { scene: stage.hud })
    });

    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };
```

## Wrapping Up

As you reflect on this tutorial, please keep in mind that the mini-games were
not to show the extend of what timers can do.  Their purpose was to show you
some of the different ways in which you can use timers.  Over time, you will
find that timers can serve all sorts of purposes, providing a valuable source
of events for the games you create.

```md-config
page-title = Timer Events
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
