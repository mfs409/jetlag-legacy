import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/Grid";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "--no-key--";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  Make
  // sure names don't have spaces or other funny characters, and make sure you
  // put the corresponding files in the folder identified by `resourcePrefix`.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(_level: number) {


    // This level introduces timers.  Timers let us run code at some point in the
    // future, or at a fixed interval.  In this case, we'll use the timer to make
    // more enemies.  We can use this to simulate bad things that spread, like
    // fire on a building.
    else if (level == 47) {
    // In this level, we can press the screen to move left and right
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 0.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });

    addToggleButton(stage.hud,
      { cx: 1, cy: 4.5, width: 2, height: 9, img: "" },
      () => (h.movement as StandardMovement).updateXVelocity(-5),
      () => (h.movement as StandardMovement).updateXVelocity(0)
    );
    addToggleButton(stage.hud,
      { cx: 15, cy: 4.5, width: 2, height: 9, img: "" },
      () => (h.movement as StandardMovement).updateXVelocity(5),
      () => (h.movement as StandardMovement).updateXVelocity(0)
    );

    // Set up our projectiles.  One thing we add here is a sound when they
    // disappear
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 100,
      bodyMaker: () => new CircleBody({ radius: 0.25, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new ImageSprite({ width: 0.5, height: 0.5, img: "grey_ball.png", z: 0 }),
      strength: 1,
      disappearOnCollide: true,
      range: 40,
      immuneToCollisions: true,
      soundEffects: new SoundEffectComponent({ disappear: "slow_down.ogg", toss: "flap_flap.ogg" })
    });

    // Touching will throw a projectile downward
    h.gestures = {
      tap: () => { (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .12, .75, 0, 10); return true; }
    };

    // draw an enemy that makes a sound when it disappears
    cfg = { cx: 8, cy: 4, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let e = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
      sounds: new SoundEffectComponent({ defeat: "low_pitch.ogg" })
    });

    // This variable is used by the timer
    let counter = 1;

    // Run some code every two seconds
    stage.world.timer.addEvent(new TimedEvent(2, true, () => {
      // only reproduce the enemy if it is visible, and the new enemy will be on-screen
      if (e.enabled && counter < 5) {
        // Figure out the Y position for enemies we make in this round
        let y = (e.rigidBody?.getCenter().y ?? 0) + counter;
        // make an enemy to the left and down
        let cfg = { cx: (e.rigidBody?.getCenter().x ?? 0) - counter, cy: y, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
        Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world),
          role: new Enemy(),
          sounds: new SoundEffectComponent({ defeat: "low_pitch.ogg" }),
        });
        // make an enemy to the right and down
        cfg = {
          cx: (e.rigidBody?.getCenter().x ?? 0) + counter, cy: y, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png"
        };
        Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world),
          role: new Enemy(),
          sounds: new SoundEffectComponent({ defeat: "low_pitch.ogg" }),
        });
        counter += 1;
      }
    }));

    // win by defeating all the enemies
    stage.score.setVictoryEnemyCount();

    // put a count of defeated enemies on the screen
    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => stage.score.getEnemiesDefeated() + " Enemies Defeated");

    welcomeMessage("Throw balls at the enemies before they reproduce");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can have moveable enemies that reproduce. Be
  // careful... it is possible to make a lot of enemies really quickly
  else if (level == 48) {
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero who moves via tilt
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // Make a destination
    cfg = { cx: 10, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });
    stage.score.setVictoryDestination(1);

    // make our initial enemy
    cfg = { cx: 14, cy: 7, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let e = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, elasticity: 0.3, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Enemy(),
    });

    // We can use this array to store all of the enemies in the level
    let enemies: Actor[] = [];
    enemies.push(e);

    // Attach the number "6" to the enemy, so that we can use it as a countdown for the
    // number of remaining duplications of this enemy.  Each enemy we make will have its own
    // counter.
    e.extra.num = 6;

    // set a timer callback on the level, to repeatedly spawn new enemies.
    // warning: "6" is going to lead to lots of enemies eventually, and there's no
    // way to defeat them in this level!
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
          let cfg = {
            cx: (e.rigidBody?.getCenter().x ?? 0) + 0.01,
            cy: (e.rigidBody?.getCenter().y ?? 0) + 0.01,
            width: .5,
            height: .5,
            radius: .25,
            img: "red_ball.png",
          };
          let e2 = Actor.Make({
            appearance: new ImageSprite(cfg),
            rigidBody: new CircleBody(cfg, stage.world, { density: 5, elasticity: 0.3, friction: 0.6 }),
            movement: new TiltMovement(),
            role: new Enemy(),
          });
          // e2.rigidBody?.setVelocity(e.rigidBody!.getVelocity())

          // set the new enemy's reproductions, save it
          e2.extra.num = e.extra.num;
          newEnemies.push(e2);
        }
      }
      // Add the new enemies to the main list
      let tmp = enemies.concat(newEnemies);
      enemies = tmp;
    }));

    welcomeMessage("These enemies are really tricky");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // In this level, we'll use some timers that happen after certain amounts of
  // time elapse.
  else if (level == 59) {
    enableTilt(10, 10);
    welcomeMessage("Things will appear  and disappear...");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // create an enemy that will quietly disappear after 2 seconds
    cfg = { cx: 1, cy: 1, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let disappear_enemy = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
      role: new Enemy(),
    });
    stage.world.timer.addEvent(new TimedEvent(2, false, () => disappear_enemy.remove()));

    // create an enemy that will appear after 3 seconds
    cfg = { cx: 5, cy: 5, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let appear_enemy = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6 }),
      movement: new PathMovement(new Path().to(5, 5).to(10, 7).to(5, 5), 3, true),
      role: new Enemy(),
    });
    // Initially it's disabled, but it will appear in 3 seconds
    //
    // Note that we could have just made a timed event to make the enemy, but
    // this is a nice technique, too.
    appear_enemy.enabled = false;
    stage.world.timer.addEvent(new TimedEvent(3, false, () => appear_enemy.enabled = true))
  }

  // This level uses timers to make more of the level appear over time
  else if (level == 60) {
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    welcomeMessage("There's nothing to do... yet");
    winMessage("Great Job");
    loseMessage("Try Again");

    // note: there's no destination yet, but we still say it's how to
    // win... we'll get a destination in this level after a few timers
    // run...
    stage.score.setVictoryDestination(1);

    // set a timer callback. after three seconds, the callback will run
    stage.world.timer.addEvent(new TimedEvent(2, false, () => {
      stage.requestOverlay((overlay: Scene) => {
        makeText(overlay,
          { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#000000", size: 18, z: 0 },
          () => "Ooh... a draggable enemy");
        addTapControl(overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
          () => { stage.clearOverlay(); return true; }
        );
        // make a draggable enemy
        // don't forget drag zone
        cfg = { cx: 8, cy: 7, radius: 1, width: 2, height: 2, img: "red_ball.png" };
        Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6 }),
          movement: new Draggable(true),
          role: new Enemy(),
        });
        createDragZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });
      }, false);
    }));

    // set another callback that runs after 6 seconds (note: time
    // doesn't count while the PauseScene is showing...)
    stage.world.timer.addEvent(new TimedEvent(6, false, () => {
      // You will probably notice a weird "glitch", where you can see the new
      // actors flash for a moment before the message appears.  To fix that,
      // consider drawing the actors as part of the code that runs when the
      // overlay is tapped.
      stage.requestOverlay((overlay: Scene) => {
        makeText(overlay,
          { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#00FF00", size: 18, z: 1 },
          () => "Touch the enemy and it will go away");
        addTapControl(overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000", z: -1 },
          () => { stage.clearOverlay(); return true; }
        );
        // add an enemy that is touch-to-defeat
        cfg = { cx: 9, cy: 5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
        let touch_enemy = Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6 }),
          role: new Enemy(),
        });

        defeatOnTouch(touch_enemy.role as Enemy);
      }, false);
    }));

    // set a callback that runs after 9 seconds.
    stage.world.timer.addEvent(new TimedEvent(9, false, () => {
      // draw an enemy, a goodie, and a destination, all with
      // fixed velocities
      stage.requestOverlay((overlay: Scene) => {
        addTapControl(overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000", z: -1 },
          () => { stage.clearOverlay(); return true; }
        );
        makeText(overlay,
          { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 18, z: 1 },
          () => "Now you can see the rest of the level");
        cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
        Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world),
          role: new Destination(),
        });

        cfg = { cx: 3, cy: 3, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
        Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6 }),
          role: new Enemy(),
        });

        cfg = { cx: 10, cy: 1, radius: 1, width: 2, height: 2, img: "blue_ball.png" };
        Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world),
          role: new Goodie(),
        });
      }, false);
    }));

    // Lastly, we can make a timer callback that runs over and over
    // again. This one starts after 2 seconds
    let spawnLoc = 0;
    stage.world.timer.addEvent(new TimedEvent(2, true, () => {
      let cfg = { cx: spawnLoc % 16 + .5, cy: Math.floor(spawnLoc / 16) + .5, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Obstacle(),
      });
      spawnLoc++;
    }));
    // It's important to test your levels carefully.  In this level, the
    // obstacles can overlap with the hero, and then the hero can get stuck.
  }

  // NB: Just the timer
  // This level shows how to use countdown timers to win a level, and introduces
  // a way to throw projectiles in an arbitrary direction but with fixed
  // velocity.
  else if (level == 65) {
    stage.world.setGravity(0, 10);
    welcomeMessage("Press anywhere to throw a ball");
    winMessage("You Survived!");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // draw a hero, and a button for throwing projectiles in many directions.
    // Note that this is going to look like an "asteroids" game, with a hero
    // covering the bottom of the screen, so that anything that falls to the
    // bottom counts against the player
    let boxCfg = { cx: 8, cy: 8.74, width: 15.9, height: 0.5, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Hero(),
    });


    // set up our pool of projectiles, then set them to have a fixed
    // velocity when using the vector throw mechanism
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 100, strength: 1, range: 20, fixedVectorVelocity: 5,
      bodyMaker: () => new CircleBody({ radius: 0.1, cx: -100, cy: -100 }, stage.world),
      disappearOnCollide: true,
      immuneToCollisions: true,
      appearanceMaker: () => new ImageSprite({ width: 0.2, height: 0.2, img: "grey_ball.png" }),
    });
    addDirectionalTossButton(stage.hud, projectiles, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, h, 100, 0, -0.5);

    // we're going to win by "surviving" for 25 seconds... with no enemies, that
    // shouldn't be too hard.  Let's put the timer on the HUD, so the player
    // knows how much time remains.
    stage.score.setWinCountdownRemaining(25);
    makeText(stage.hud,
      { cx: 2, cy: 2, center: false, width: .1, height: .1, face: "Arial", color: "#C0C0C0", size: 16, z: 2 },
      () => "" + (stage.score.getWinCountdownRemaining() ?? 0).toFixed(2) + "s remaining");

    // just to play it safe, let's say that we win on reaching a destination...
    // this ensures that collecting goodies or defeating enemies won't
    // accidentally cause us to win. Of course, with no destination, there's no
    // way to win now, except waiting for the countdown timer
    stage.score.setVictoryDestination(1);

    // Let's put a button for pausing the game, so we can see that it pauses the
    // timer.  Notice that we have to draw it *after* the throw button, or else
    // the throw button will cover it.
    addTapControl(stage.hud,
      { cx: .5, cy: .5, width: .5, height: .5, img: "pause.png" },
      () => {
        stage.requestOverlay((overlay: Scene) => {
          makeText(overlay,
            { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 32, z: 0 },
            () => "Game Paused");
          addTapControl(overlay,
            { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000", z: -1 },
            () => { stage.clearOverlay(); return true; }
          );
        }, false);
        return true;
      }
    );
  }

  // This level shows a bit more about using different goodie scores.  It's
  // really mean, because you need to get the exact right number of each goodie
  // type.
  else if (level == 72) {
    enableTilt(10, 10);
    welcomeMessage("Green, Red, Blue, and Grey balls are goodies\nBut how many of each are needed?");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 8.25, radius: 0.4, width: 0.8, height: 0.8, img: "leg_star_1.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // the destination requires lots of goodies of different types
    //
    // Remember that we start counting from 0, so the four types are 0, 1, 2, 3
    cfg = { cx: 15.25, cy: 0.75, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination({
        onAttemptArrival: () => { return stage.score.getGoodieCount(0) == 1 && stage.score.getGoodieCount(1) == 2 && stage.score.getGoodieCount(2) == 3 && stage.score.getGoodieCount(3) == 1; }
      }),
    });
    stage.score.setVictoryDestination(1);

    // Announce how many of each goodie have been collected
    makeText(stage.hud,
      { cx: 1, cy: 1, center: false, width: .1, height: .1, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => stage.score.getGoodieCount(0) + " blue");
    makeText(stage.hud,
      { cx: 1, cy: 1.5, center: false, width: .1, height: .1, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => stage.score.getGoodieCount(1) + " green");
    makeText(stage.hud,
      { cx: 1, cy: 2, center: false, width: .1, height: .1, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => stage.score.getGoodieCount(2) + " red");
    makeText(stage.hud,
      { cx: 1, cy: 2.5, center: false, width: .1, height: .1, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => stage.score.getGoodieCount(3) + " gray");

    // You only get 20 seconds to finish the level
    stage.score.setLoseCountdownRemaining(20);
    makeText(stage.hud,
      { cx: 15, cy: 8, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => (stage.score.getLoseCountdownRemaining() ?? 0).toFixed() + "");

    // draw the goodies
    for (let i = 0; i < 3; ++i) {
      cfg = { cx: 5 + i + .5, cy: 1, radius: 0.125, width: 0.25, height: 0.25, img: "blue_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(0, 1); return true; } }),
      });

      cfg = { cx: 5 + i + .5, cy: 2, radius: 0.125, width: 0.25, height: 0.25, img: "green_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(1, 1); return true; } }),
      });

      cfg = { cx: 5 + i + .5, cy: 3, radius: 0.125, width: 0.25, height: 0.25, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(2, 1); return true; } }),
      });

      cfg = { cx: 5 + i + .5, cy: 4, radius: 0.125, width: 0.25, height: 0.25, img: "grey_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(3, 1); return true; } }),
      });
    }

    // When the hero collides with this obstacle, we'll increase the
    // time remaining
    let boxCfg = { cx: 14, cy: 8, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let o = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new CircleBody(boxCfg, stage.world),
      role: new Obstacle({
        heroCollision: () => {
          // add 15 seconds to the timer, remove the obstacle
          stage.score.setLoseCountdownRemaining((stage.score.getLoseCountdownRemaining() ?? 0) + 15);
          o.remove();
        }
      }),
    });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
