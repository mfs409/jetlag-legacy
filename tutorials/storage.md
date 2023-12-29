# Temporary And Long-Term Storage

This tutorial introduces the `level`, `session`, and `persistent` storage
features, which JetLag provides to help you keep track of information during
your game.

## Overview

In a complex game, where it takes lots of files just to implement one level of
the game, it can be difficult to keep track of all of the information that
matters.  It can get even harder when information needs to flow from one level
to the next (or from the store to the playable parts of the game).  Then there's
the whole question of how to save information so that it's still there the next
time the game runs.

## Getting Started

For this tutorial, you'll need the `boundingBox()` function and the
`sprites.json`/`sprites.png` sprite sheet.

## A Design That Uses All Three Kinds Of State

In this tutorial, we're going to build one example mini-game.  In the game, the
hero needs to dodge enemies and collect coins.  The hero can go to the
destination at any time, and when it does, all the coins it collects will get
added to the bank.  Every bundle of five coins will get turned into a ruby.
This creates some interesting storage requirements:

- During gameplay, we'll need to track how many coins have been collected.
  However, if the hero collides with an enemy, those coins will be dropped.
- Coins that don't turn into rubies *do not* get dropped, so they need to be
  tracked somewhere.
- All coins are dropped when the player quits the game
- The game will know if it's the first time it's ever been played, in which case
  it prints a special message.
- The game will also know if it's the first time it's been played *today*, in
  which case it prints a different message.

Here's the game:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "storage.html?1"
}
```

## Extra Game Configuration

Up until now, we've been ignoring the `storageKey` value in your `Config`
object.  This is a string that your game gives to the web browser, so that your
browser can save information for your game even when the browser is closed.

A convention that emerged more than 20 years ago is to generate human-readable
names by using web addresses.  So if my game was called "HappyGame" and my
website was "JetLagGameFramework.com", then I could use
`"com.JetLagGameFramework.HappyGame"` as my `storageKey`.

For these tutorials, you can use the name of your GitHub project fork.  So, for
example, I'll use `"com.github.mfs409.my-jetlag-tutorials`.

## Organizing Data In Objects

In our game, we're going to need to track three kinds of data:

- During a game, we need to know how many coins have been collected
- Between levels, we need to know how many coins have not yet been turned into
  rubies
- Between visits to the website (or times opening the app), we need to know (1)
  how many times the game has been played, (2) the date when it was last played,
  and (3) how many rubies have been minted.

We'll accomplish this by defining three different "classes".  A `class` is a way
of giving a name to a collection of information.  This will make our code much
easier to manage.

In your `game.ts` file, but *not* inside of the `builder()` function, let's
create three classes:

```typescript
/** This is for Level Storage */
class LStore {
  coins = 0; // Coins collected during a stage
};

/** This is for Session Storage */
class SStore {
  coins = 0; // Coins collected so far during this session
}

/** This is for Persistent Storage.  It shouldn't have any methods */
class PStore {
  num_times_played = 0;
  last_played = new Date().toUTCString();
  rubies = 0; // 5 coins should automatically become a ruby and get saved
}
```

JetLag's session, level, and persistent storage can keep track of many different
objects at once, by using a different bit of text to uniquely identify each
(this is different from `storageKey`).  In our game, we'll only have one object
of local storage, one object of session storage, and one object of persistent
storage.  But we'll still need a name for each.  We'll use the name "stats" for
the `LStore`, "session_state" for the `SStore`, and "persistent_info" for the
`PStore`.

There's one more catch: While the game is playing, it will be easy to make sure
there's always an `LStore` and `SStore` object on hand.  We can change them as
needed, and everything will be fine.  However, the `PStore` is a bit trickier.
The browser isn't allowed to know what a `PStore` is, so whenever we change it,
we'll need to turn the PStore into text, and then explicitly save it as the
"persistent_info".  This function will handle it:

```typescript
/** Save a PStore */
function persist(p: PStore, key: string) {
  stage.storage.setPersistent(key, JSON.stringify(p))
}
```

## Setting Up The Local Storage

When the size of your game gets past a certain size, you'll find that it is hard
to use the `()=>{}` syntax to effectively keep track of all of the information
that a level of your game needs.  The "level" storage feature lets you store
information so that it is "globally accessible" throughout your code.  It gets
reset each time JetLag calls `builder()`.  You can use different objects for
different levels, but we'll just have an `LStore`.

Since we know that each time we call `builder()`, the level storage will be
empty, we can just put these two lines at the top of the builder function:

```typescript
    // Set up level storage
    let lstore = new LStore();
    stage.storage.setLevel("stats", lstore);
```

Now, throughout the `builder()`, we'll be able to use `lstore` directly.  And
any function *outside* of `builder()` can get access to the local storage like
this:

```typescript
  let lstore = stage.storage.getLevel("stage") as LStore;
```

## Setting Up The Session Storage

Next, let's set up our session storage.  This is just a tiny bit harder: the
first call to `builder()` would find that there is no `SStore` yet, but each
time after that, `builder()` would find that there already is an `SStore`.  So
then, we can't just "make" the `sstore`, we'll need to check if it exists,
first:

```typescript
    // Only set up session storage if we don't have one already
    if (!stage.storage.getSession("session_state"))
      stage.storage.setSession("session_state", new SStore());
    let sstore = stage.storage.getSession("session_state");
```

And just like with local storage, in any code *other than the builder*, we can
access the session storage like this:

```typescript
  let sstore = stage.storage.getSession("session_state");
```

## Setting Up The Persistent Storage

Now we'll set up the persistent storage.  We only want to set it up if we don't
have one already. Note that for our "first time playing" rules, we need this to
be a bit more complex than session storage.

```typescript
    let first_time = false; // Is this the very first time?
    if (stage.storage.getPersistent("persistent_info") == undefined) {
      first_time = true;
      persist(new PStore(), "persistent_info"); // explicitly save it back
    }
    let pstore = JSON.parse(stage.storage.getPersistent("persistent_info")!) as PStore;
```

As with the other storage types, you can get a local variable for accessing the
persistent information at any time, like this:

```typescript
    let pstore = JSON.parse(stage.storage.getPersistent("persistent_info")!) as PStore;
```

However, don't forget that if you make changes to `pstore`, you will need to
call `persist(pstore, "persistent_info");`, or else your changes won't be saved
for the next time the game is played.

## Greeting The Player

Our next bit of code will compare today's date with the date in `pstore`, to
decide if it needs to put a greeting on the screen.  We'll put the decision into
a variable called `new_day`:

```typescript
    let today = new Date();
    let new_day = false;
    let last_day = new Date(pstore.last_played);
    if (today.getDay() != last_day.getDay() || today.getMonth() != last_day.getMonth() || today.getFullYear() != last_day.getFullYear())
      new_day = true;
    pstore.last_played = today.toUTCString();
    pstore.num_times_played += 1;
    persist(pstore, "persistent_info");
```

While we were at it, we updated the `pstore` with today's date, and we added to
the number of times played.  Since we changed `pstore`, we had to call
`persist()`, of course.

The code above will interact with the code for initializing the `pstore` in a
way that might be surprising: when `first_time` is `true`, `last_day` and
`today` will be the same, so `new_day` will be `false`.  This is OK, because we
print a different message for `new_day` than for `first_time`.  Here's some code
that puts it all together by drawing an overlay on the screen with the
appropriate welcome message (if any).  Note that we could make use of `sstore`
if we also wanted a way to greet someone when they re-opened the page, but it
wasn't the first time today.

```typescript
    if (first_time) {
      stage.requestOverlay((overlay: Scene) => {
        new Actor({
          appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
          rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
          gestures: { tap: () => { stage.clearOverlay(); return true; } }
        });
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Welcome!"),
          rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
        });
      }, false);
    }

    else if (new_day) {
      stage.requestOverlay((overlay: Scene) => {
        new Actor({
          appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
          rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
          gestures: { tap: () => { stage.clearOverlay(); return true; } }
        });
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Welcome Back!"),
          rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
        });
      }, false);
    }
```

Now we can set up the gameplay.  We'll start with the border, the gravity, and a
hero:

```typescript
    stage.world.setGravity(0, 10);
    stage.tilt.tiltMax.Set(10, 0);
    if (!stage.accelerometer.tiltSupported) {
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
    }
    boundingBox();

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));
```

Next, we'll intersperse enemies and goodies, and draw a destination:

```typescript
    for (let cx = 0.5; cx < 16.5; cx += 2) {
      let animations = new Map();
      animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["coin0.png", "coin1.png", "coin2.png", "coin3.png", "coin4.png", "coin5.png", "coin6.png", "coin7.png"] }))
      new Actor({
        appearance: new AnimatedSprite({ width: 0.4, height: 0.4, animations }),
        rigidBody: new CircleBody({ cx, cy: 5, radius: 0.2 }),
        role: new Goodie({ onCollect: () => { lstore.coins += 1; return true; } }),
      });
    }

    for (let cx = 1.5; cx < 16.5; cx += 2) {
      new Actor({
        appearance: new ImageSprite({ width: 0.4, height: 0.4, img: "red_ball.png" }),
        rigidBody: new CircleBody({ cx, cy: 5, radius: 0.2 }),
        role: new Enemy(),
      });
    }

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });
```

And then we'll put two counters on the HUD: one for coins, the other for rubies.
Notice how the coin count combines the values from `sstore` and `lstore`, so the
player knows how many coins they'll have *if they win*.

```typescript
    // Make the coin counter
    new Actor({
      appearance: new ImageSprite({ width: 0.4, height: 0.4, img: "coin0.png" }),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.5, radius: 0.2 }, { scene: stage.hud })
    });
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 24, color: "#000000" }, () => "x " + (lstore.coins + sstore.coins)),
      rigidBody: new CircleBody({ cx: 0.8, cy: 0.35, radius: 0.01 }, { scene: stage.hud })
    });

    // Make the ruby counter
    new Actor({
      appearance: new FilledPolygon({ fillColor: "#FF0000", vertices: [-.1, 0, 0, -.2, .1, 0, 0, .2] }),
      rigidBody: new CircleBody({ cx: 0.5, cy: 1, radius: 0.2 }, { scene: stage.hud })
    });
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 24, color: "#000000" }, () => "x " + (pstore.rubies)),
      rigidBody: new CircleBody({ cx: 0.8, cy: 0.9, radius: 0.01 }, { scene: stage.hud })
    });
```

We'll configure the win and lose behaviors, and set up an overlay that prints a
message when the player loses.  During the gameplay, we did not make any
modifications to `sstore` or `pstore` that would need to be rolled back, and we
know that when the level restarts, `lstore` will be reset, so we don't need any
special code, just a message.

```typescript
    // Specify default win and lose behaviors
    stage.score.setVictoryDestination(1);
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };

    // When the player loses, just give a message and let them start over
    stage.score.loseSceneBuilder = (overlay) => {
      new Actor({
        appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
        rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
        gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(builder, level); return true; } }
      });
      new Actor({
        appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Try Again"),
        rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
      });
    }
```

In contrast, when the level is won, we're going to have to do some real work.
Note that we could have done this in the destination's arrival function,
instead, but since I wanted the overlay to tell the player how many rubies they
minted and how many coins they minted, this was a little bit easier.

In the `winSceneBuilder`, we'll start by moving coins from the `lstore` to the
`sstore`.  This signifies that any coins that were collected have become
"permanent".

The next thing we do is convert coins to rubies.  It may seem odd that I'm using
a `while` loop here, instead of doing some smarter math.  I really only did that
because I wanted to show a `while` loop.  A `while` loop will run over and over,
as long as the condition in parentheses is true.  In this case, each time the
loop runs, `sstore.coins` will get smaller, until eventually there are not
enough coins to make another ruby, and the loop will end.  @@red Note that this
kind of code would be inefficient if `sstore.coins` could be large.  It's OK
here, because sstore won't ever get above 12.@@

If we minted any rubies, we'll update `pstore` and call `persist()`.  After
that, all that remains is to set up a border, so that tapping will clear the
overlay and start the level, and to put some text on the screen.

```typescript
    // When the player wins, move coins from local to session storage, and then
    // compute ruby updates before printing a message
    stage.score.winSceneBuilder = (overlay) => {
      sstore.coins += lstore.coins;
      let rubies = 0;
      while (sstore.coins > 5) {
        rubies += 1;
        sstore.coins -= 5;
      }
      if (rubies > 0) {
        pstore.rubies += rubies;
        persist(pstore, "persistent_info");
      }
      new Actor({
        appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
        rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
        gestures: { tap: () => { stage.clearOverlay(); stage.switchTo(builder, level); return true; } }
      });
      new Actor({
        appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "Good Job"),
        rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
      });
      if (rubies == 1) {
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "You earned 1 ruby"),
          rigidBody: new CircleBody({ cx: 8, cy: 5.5, radius: .01 }, { scene: overlay }),
        });
      }
      if (rubies == 2) {
        new Actor({
          appearance: new TextSprite({ center: true, face: "Arial", size: 32, color: "#FFFFFF" }, "You earned 2 rubies"),
          rigidBody: new CircleBody({ cx: 8, cy: 5.5, radius: .01 }, { scene: overlay }),
        });
      }
    }
```

## Wrapping Up

Storage is a complex topic, so it's a good idea to do whatever you can to keep
it simple.  In this tutorial, we used one object for each of local, session, and
persistent storage.  The next step would be to move these objects to their own
files, and then to make the set-up code into functions, so that we wouldn't need
top copy and paste it into every builder in our game.  As you develop games,
you'll probably find other techniques that help you to keep your storage from
getting too complicated.  It's good to remember that there's no single right
answer... whatever is most intuitive and easy to get right for your game is the
best strategy for you to take!

```md-config
page-title = Temporary And Long-Term Storage
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
.red {color: red}
```
