import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { GravityMovement, TiltMovement } from "../jetlag/Components/Movement";
import { CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { boundingBox } from "./common"

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
  imageNames = ["sprites.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  if (level == 1) {
    // The simplest thing we can do with a timer is ask for something to happen
    // after some time transpires.  In this case, the destination won't appear
    // for five seconds.
    stage.world.setGravity(0, 10);
    stage.tilt.tiltMax.Set(10, 0);
    if (!stage.accelerometer.tiltSupported) {
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
    }
    boundingBox();

    stage.world.timer.addEvent(new TimedEvent(5, false, () => {
      // Make a destination
      new Actor({
        appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
        rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
        role: new Destination(),
      });
      stage.score.setVictoryDestination(1);
    }))

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));

    // Specify default win and lose behaviors
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };
  }

  else if (level == 2) {
    // There are two kinds of timers in this level.  One is attached to enemies,
    // and makes them reproduce every second.  The other says that if you can
    // stay alive for 5 seconds, you win.
    stage.world.setGravity(0, 0);
    stage.tilt.tiltMax.Set(10, 10);
    if (!stage.accelerometer.tiltSupported) {
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
    }
    boundingBox();

    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // make an enemy, put it into a vector of enemies
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

    // set a timer callback on the level, to repeatedly spawn new enemies.
    // warning: "6" is going to lead to lots of enemies eventually, and there's
    // no way to defeat them in this level!
    //
    // Note: the timer repeats over and over, but at some point, our code will
    // just not do anything in response to it :)
    stage.world.timer.addEvent(new TimedEvent(2, true, () => {
      // We will need to keep track of all the enemies we make, and then add them to
      // our list of enemies just before this function returns
      //
      // Note: it's a bad idea to make an array on every timer call, but for this
      // demo, it's OK
      let newEnemies: Actor[] = [];

      // For each enemy we've made, if it has remaining reproductions, then make
      // another enemy
      for (let e of enemies) {
        // If this enemy has remaining reproductions
        if (e.extra.num > 0) {
          // decrease remaining reproductions
          e.extra.num -= 1;

          // reproduce the enemy
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
      // Add the new enemies to the main list
      let tmp = enemies.concat(newEnemies);
      enemies = tmp;
    }));

    // Specify default win and lose behaviors
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };

    // Next, let's say that if you survive for 10 seconds, you win:
    stage.score.setVictorySurvive(10);

    // Finally, if you get this goodie, you save 2 seconds
    new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: 0.25 }),
      role: new Goodie({ onCollect: () => { stage.score.setWinCountdownRemaining(stage.score.getWinCountdownRemaining()! - 2); return true; } }),
    });

    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => (stage.score.getWinCountdownRemaining()!.toFixed(2))),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.2, radius: 0.01 }, { scene: stage.hud })
    });
  }

  else if (level == 3) {
    // We can also have timers so that you lose if you don't finish a level
    // within an amount of time:
    stage.world.setGravity(0, 10);
    stage.tilt.tiltMax.Set(10, 0);
    if (!stage.accelerometer.tiltSupported) {
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
    }
    boundingBox();

    // Make a destination
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.4 }),
      role: new Destination(),
    });
    stage.score.setVictoryDestination(1);

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));

    // Specify default win and lose behaviors
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };

    stage.score.setLoseCountdownRemaining(5);
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => (stage.score.getLoseCountdownRemaining()!.toFixed(2))),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.2, radius: 0.01 }, { scene: stage.hud })
    });
  }

  else if (level == 4) {
    // There is a lot more that you can do with timers.  One example is to chain
    // timers together, so that one leads to another.  Another is that you might
    // find that you need a timer to check if something has happened.  We'll
    // demonstrate that in this level.
    stage.world.setGravity(0, 0);
    stage.tilt.tiltMax.Set(10, 10);
    if (!stage.accelerometer.tiltSupported) {
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 0));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => (stage.accelerometer.accel.y = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => (stage.accelerometer.accel.y = 5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (stage.accelerometer.accel.x = -5));
      stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (stage.accelerometer.accel.x = 5));
    }
    boundingBox();

    // Make an invisible destination
    let d = new Actor({
      appearance: new FilledBox({ width: 0.8, height: 0.8, fillColor: "#00000000" }),
      rigidBody: new CircleBody({ cx: 0.5 + 15 * Math.random(), cy: 0.5 + 8 * Math.random(), radius: 0.4 }),
      role: new Destination(),
    });
    stage.score.setVictoryDestination(1);

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 8, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // Specify default win and lose behaviors
    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };

    // We could do this computation in the ()=>{} code of the TextSprites, but
    // this is a quick way to show that we can have timers that get around
    // having to think about when other codes would run.
    let ud = "up";
    let lr = "left";
    stage.world.timer.addEvent(new TimedEvent(.01, true, () => {
      ud = h.rigidBody.getCenter().y < d.rigidBody.getCenter().y ? "down" : "up";
      lr = h.rigidBody.getCenter().x < d.rigidBody.getCenter().x ? "right" : "left";
    }));

    // Give some hints
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => "go " + lr),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.2, radius: 0.01 }, { scene: stage.hud })
    });
    new Actor({
      appearance: new TextSprite({ face: "Arial", center: false, size: 22, color: "#000000" }, () => "go " + ud),
      rigidBody: new CircleBody({ cx: 0.5, cy: 0.7, radius: 0.01 }, { scene: stage.hud })
    });
  }

  else if (level == 5) {
    // Lastly, notice that you can make a timer "speed up" by having it go *very
    // fast* and then making it seem to to run so often.  Part of the trick is
    // that we know that it will never run faster than 1/45 of a second.
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
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);