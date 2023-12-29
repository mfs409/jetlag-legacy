# Example: An Endless Runner Game

This web page presents an "endless runner" style of game.  As an "example",
rather than a "tutorial", you will not find much discussion of how the game was
made.  You should be sure to read through the code to get a better
understanding.

## Getting Started

You will need to copy these files to your `assets` folder:

- [mid.png](endless_runner_game/mid.png)
- [back.png](endless_runner_game/back.png)
- [sprites.png](endless_runner_game/sprites.png)
- [alien.png](endless_runner_game/alien.png)
- [sprites.json](endless_runner_game/sprites.json)
- [alien.json](endless_runner_game/alien.json)

## The Game

Here is a playable version of the game, so you can quickly determine if there
are aspects of it that you'd like to learn about:

```iframe
{
    "width": 800,
    "height": 450,
    "src": "endless_runner_game.html"
}
```

## The Code

Below is all of the code for this game.  Hopefully the comments will help as you
try to understand how the game was made.

```typescript
import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { AnimatedSprite, FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { ManualMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Enemy, Goodie, Hero, Obstacle, Sensor } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";

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
  imageNames = ["mid.png", "back.png", "sprites.json", "alien.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  if (level == 1) {
    stage.score.onWin = { level, builder };
    stage.score.onLose = { level, builder };

    // Set up the camera and gravity
    stage.world.setGravity(0, 10);
    stage.world.camera.setBounds(0, 0, undefined, 9);

    // make an animated hero
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["alien_walk_r_0.png", "alien_walk_r_1.png", "alien_walk_r_2.png", "alien_walk_r_3.png", "alien_walk_r_4.png", "alien_walk_r_5.png", "alien_walk_r_6.png", "alien_walk_r_7.png", "alien_walk_r_8.png"] }));
    animations.set(AnimationState.JUMP_E, new AnimationSequence(true).to("alien_cast_r_0.png", 75).to("alien_cast_r_1.png", 75).to("alien_cast_r_2.png", 75).to("alien_cast_r_3.png", 75).to("alien_cast_r_4.png", 8000).to("alien_cast_r_5.png", 75).to("alien_cast_r_6.png", 75));
    let h = new Actor({
      appearance: new AnimatedSprite({ width: 2, height: 2, animations }),
      rigidBody: new PolygonBody({ cx: 0.5, cy: 5.9, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, { disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero()
    });
    (h.appearance as AnimatedSprite).stateSelector = AnimatedSprite.sideViewAnimationTransitions;
    (h.movement as ManualMovement).updateXVelocity(10);

    // center the camera a little ahead of the hero, so we can see more of the
    // world during gameplay
    stage.world.camera.setCameraFocus(h, 6, 0);

    // Put a button on screen that makes the hero jump. Note that we can put a
    // delay (in this case, 2500 milliseconds) to prevent rapid re-jumping.  If
    // you make it 0, you still can't jump while in the air, but you can jump as
    // soon as you land.
    let last = 0;
    new Actor({
      appearance: new FilledBox({ width: .1, height: .1, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ width: 16, height: 9, cx: 8, cy: 4.5 }, { scene: stage.hud }),
      gestures: {
        tap: () => {
          if (Date.now() < last + 2500) return true;
          last = Date.now();
          (h.role as Hero).jump(0, -10)
          return false;
        }
      }
    });
    // set up the background
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ anchor: { cx: 0, cy: 4.5, }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // Put a distance display on the HUD
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", size: 40, color: "#FFFFFF", strokeColor: "#000000", strokeWidth: 1 }, () => h.rigidBody.getCenter().x.toFixed(2) + " m"),
      rigidBody: new CircleBody({ cx: .1, cy: .1, radius: .05 }, { scene: stage.hud })
    })

    // Draw some floor
    let floor0 = new Actor({
      appearance: new FilledBox({ width: 64, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: -32, cy: 9.05, width: 64, height: .1 }),
      role: new Obstacle(),
    });
    let floor1 = new Actor({
      appearance: new FilledBox({ width: 64, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 32, cy: 9.05, width: 64, height: .1 }),
      role: new Obstacle(),
    });
    let floor2 = new Actor({
      appearance: new FilledBox({ width: 64, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 96, cy: 9.05, width: 64, height: .1 }),
      role: new Obstacle(),
    });

    // This sensor will keep "building" the next part of the level as the hero
    // moves forward
    new Actor({
      appearance: new FilledBox({ width: .1, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ width: .1, height: 9, cx: 63.95, cy: 4.5 }),
      role: new Sensor({
        heroCollision: (s: Actor, _h: Actor) => {
          // First, rotate the floor names, move the backmost to the front
          let tmp = floor0;
          floor0 = floor1;
          floor1 = floor2;
          floor2 = tmp;
          floor2.rigidBody.setCenter(floor2.rigidBody.getCenter().x + 192, floor2.rigidBody.getCenter().y);

          // This would be a good place to draw the next 64 meters of the level,
          // with walls, enemies, goodies, or whatever else would make for a fun
          // game.  We'll just draw a goodie and an enemy. You could also speed
          // up the hero (permanently or temporarily), if that would make the
          // game more fun.
          new Actor({
            appearance: new ImageSprite({ width: .75, height: .75, img: "blue_ball.png" }),
            rigidBody: new CircleBody({ radius: .375, cx: s.rigidBody.getCenter().x + 64 + Math.random() * 64, cy: 8.5 * Math.random() }),
            role: new Goodie(),
          })
          new Actor({
            appearance: new ImageSprite({ width: .75, height: .75, img: "red_ball.png" }),
            rigidBody: new CircleBody({ radius: .375, cx: s.rigidBody.getCenter().x + 64 + Math.random() * 64, cy: 8.5 * Math.random() }),
            role: new Enemy(),
          })

          // Finally, move the sensor
          s.rigidBody.setCenter(s.rigidBody.getCenter().x + 64, s.rigidBody.getCenter().y);
        }
      }),
    });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
```

## Wrapping Up

Hopefully this example will be a gateway into thinking about
procedurally-generated content. You should have seen that "random" isn't always
good.  It's worth thinking about ways to use some kind of constrained randomness
to create a new and different game experience each time, while still ensuring
that the game is playable, fun, and not repetitive.  For example, if you had
twenty 64-meter-long chunks of world, each of which had a few ways to customize
it, you could easily have several thousand meters of gameplay before anything
seemed to repeat.

```md-config
page-title = Example: An Endless Runner Game

img {display: block; margin: auto; max-width: 500px;}
.red {color: red;}
```
