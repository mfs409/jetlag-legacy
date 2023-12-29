# Keeping Score (2/2)

This tutorial continues from the previous "Keeping Score" tutorial, and discusses
the remaining ways that JetLag tracks the score.

## Getting Started

This tutorial follows on from the first "Keeping Score" tutorial.  If you
finished that tutorial, then you're ready to reset your `builder()` function so
that it only has the common code from the previous tutorial, and then begin this
tutorial.

## Winning By Collecting Goodies

JetLag tracks the collection of four different types of goodies.  You can, of
course, let these "goodies" represent whatever you want... it could be coins,
like platinum, gold, silver, and copper; or gems; or pieces of a puzzle, or
whatever else.  To JetLag, these four goodie counters are just numbers.  JetLag
also lets you win by collecting a certain number of goodies:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?9"
}
```

In the above game, you need to collect one of each type of goodie.  You can, of
course, require different numbers of each type of goodie, too.  To write this
mini-game, we start by creating a hero and a few goodies:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(0, 1); return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(1, 1); return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(2, 1); return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 5.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(3, 1); return true; } }),
    });
```

Then we tell JetLag that we want to win via collecting goodies.  This also
indicates the minimum number of each goodie type that must be collected.

```typescript
    stage.score.setVictoryGoodies(1, 1, 1, 1);
```

## Winning By Reaching A Destination

The destination role provides another way of winning a game.  We discussed this
already in the "Roles" tutorials, but it's worth reviewing here.  In the
following level, we have a single destination that can hold two heroes, and to
win, they both must reach the destination:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?10"
}
```

To create this mini-game, we just need two heroes and a destination.  When we
make the destination, we give it a capacity of 2, since the default is 1.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Destination({ capacity: 2 })
    });
```

Then we tell JetLag that the level should end (in victory!) when two heroes
reach the destination.

```typescript
    stage.score.setVictoryDestination(2);
```

Similarly, we can have several destinations, and then we can play around with
how much capacity each has.  In this example, there are two destinations, each
of which can hold one hero:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?11"
}
```

You should try to implement this level on your own, before reading my code:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Destination({ capacity: 1 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Destination({ capacity: 1 })
    });
    stage.score.setVictoryDestination(2);
```

## Another Way To Win

Sometimes it's hard to express what condition should make the player win the
level.  If all else fails, you can call `stage.score.winLevel()`, and the level
will immediately be won.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?12"
}
```

In the code below, tapping the actor leads to the level being won.  You could do
much more sophisticated things... for example, if you had a puzzle, you might
check if a few actors were in certain positions.  Or perhaps you are thinking of
a game like "Simon", where the level wins if the player produces a specific
sequence of taps on certain actors.  The hard part of games like that is
figuring out when to win.  Then you just need one line to end the level in
victory:

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      gestures: { tap: () => { stage.score.winLevel(); return true; } }
    });
```

## Losing When All Heroes Are Defeated

Since the roles in JetLag center around the idea of heroes, any time a hero is
defeated, JetLag will check if all heroes have been defeated, and if so, the
level will end.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?13"
}
```

In this level, we won't bother with providing a way to win.  We also don't need
to tell JetLag about losing... once both heroes collide with the enemy, the
level will end.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
```

In this mini-game, it's still a good idea to tell JetLag what the win condition
is, even if it's not possible:

```typescript
    stage.score.setVictoryEnemyCount();
```

## Keeping An Eye On Special Heroes

Sometimes there is one hero that is more important than the rest.  We can mark
that hero, so that the level ends in defeat as soon as that hero is defeated:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?14"
}
```

In the code for this level, the rightmost hero must survive.  If you manage to
get the other hero to collide with the enemy first, the game won't end... but as
soon as the `mustSurvive` hero collides with the enemy, the level ends.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ mustSurvive: true })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount();
```

## Another Way To Lose

As you probably guessed, there's one more way to lose: we can decide that some
event has necessitated that the level end, and then we can call
`stage.score.loseLevel()`.  This is symmetric to `winLevel()`, which we saw up
above.

```iframe
{
    "width": 800,
    "height": 450,
    "src": "score.html?15"
}
```

For simplicity, in this mini-game, the level ends when you tap the actor.  An
example where this is useful is in trivia games, where several of the answers to
a question will tap to `loseLevel()`, and one will tap to `winLevel()`.

```typescript
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      gestures: { tap: () => { stage.score.loseLevel(); return true; } }
    });
```

## Wrapping Up

We've now explored all of the ways that JetLag helps you to manage winning and
losing the levels of a game.  One last thing to keep in mind is that these
mechanisms are all instantaneous and automatic: they all result in the level
*immediately* ending.  If you want a brief animation when the last hero is
defeated, or when some other event leads to the level ending, then you'll need
to work around this limitation.  One option is to use the screenshot feature of
overlays.  Another is to modify JetLag, so that winning and losing call
functions that you provide, instead of immediately ending.  There are other
ways, too... it all depends on what works best for the game you're making.

```md-config
page-title = Keeping Score (2/2)
img {display: block; margin: auto; max-width: 75%;}
.max500 img {max-width: 500px}
```
