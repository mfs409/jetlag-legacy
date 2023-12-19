import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { ChaseMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle, Sensor } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { DIRECTION } from "../jetlag/Components/StateManager";
import { enableTilt, boundingBox, levelController } from "./common";

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
  // Throughout this tutorial, we'll have levels that can be "won" or "lost".
  // In all cases, we'll go right back to the same level.
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };

  // Every level will use tilt, and every level will have a box around it
  enableTilt(10, 10);
  boundingBox();

  // Set up for quick switching among levels
  levelController(level, 17, builder);

  if (level == 1) {
    // Let's start by looking at Goodies.  Whenever a hero collides with a
    // goodie, it automatically collects it.  JetLag has four built-in "goodie
    // counters".  When you collide with a goodie, the default is that the "0"
    // goodie counter increments by one.
    //
    // NB:  Heroes are always dynamic, since they're involved in so many
    //      important collisions...
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Goodie(),
    });

    // Set up a way to quickly get the goodie counts by pressing the '?' key
    alertGoodies();
  }

  else if (level == 2) {
    // Now let's provide code for making all the goodie counts change
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 10, cy: 3, radius: 0.4 }),
      role: new Goodie({
        // This just updates the four scores
        onCollect: () => {
          stage.score.setGoodieCount(0, 1);
          stage.score.setGoodieCount(1, 1);
          stage.score.setGoodieCount(2, 1);
          stage.score.setGoodieCount(3, 1);
          return true;
        }
      }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Goodie({
        // This lets us see the goodie and actor involved in the collision
        //
        // Then we can modify scores, or return false to indicate that the
        // goodie wasn't collected yet.
        onCollect: (g: Actor, h: Actor) => {
          if (stage.score.getGoodieCount(0) == 0) {
            g.resize(12, 3, 1, 1);
            h.resize(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, .4, .4);
            return false;
          }
          stage.score.setGoodieCount(0, 10);
          stage.score.setGoodieCount(1, stage.score.getGoodieCount(1) + 1);
          stage.score.setGoodieCount(2, stage.score.getGoodieCount(2) - 1);
          stage.score.setGoodieCount(3, 0);
          return true;
        }
      }),
    });

    // Set up a way to quickly get the goodie counts by pressing the '?' key
    alertGoodies();
  }

  else if (level == 3) {
    // Next, let's look at destinations
    // First, let's do the "default" behavior: the destination accepts a hero

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Destination(),
    });

    // The default is that one hero in the destination == win, so the game will reset
  }

  else if (level == 4) {
    // We can let a destination hold more than one hero (and we can change the
    // victory condition)
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Destination({ capacity: 2 }),
    });

    stage.score.setVictoryDestination(2);
  }

  else if (level == 5) {
    // That also means we can have two destinations each hold one hero
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Destination(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 6, radius: 0.4 }),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(2);
  }

  else if (level == 6) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
      extra: {}
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8, radius: 0.4 }),
      role: new Destination({ onAttemptArrival: (h: Actor) => stage.score.getGoodieCount(0) > 0 && h.extra.collected }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Goodie(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 5, radius: 0.4 }),
      role: new Goodie({ onCollect: (_g: Actor, h: Actor) => { h.extra.collected = true; return true; } }),
    });
  }

  else if (level == 7) {
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // Now draw three sensors, with different collision behaviors.  Note that
    // the Z-index completely controls if the hero goes over or under two of
    // these. For the third, an index of 0 (the default), coupled with it being
    // drawn after the hero, means the hero still goes under it

    // This pad effect multiplies by -1, causing a "bounce off" effect even
    // though collisions are not enabled
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 5, cy: 3, radius: 0.4 }),
      role: new Sensor({
        heroCollision: (_self: Actor, h: Actor) => { h.rigidBody!.setVelocity(h.rigidBody!.getVelocity().Scale(-10)); }
      }),
    });

    // This pad multiplies by five, causing a speedup
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 7, cy: 3, radius: 0.4 }),
      role: new Sensor({
        heroCollision: (_self: Actor, h: Actor) => { h.rigidBody!.setVelocity(h.rigidBody!.getVelocity().Scale(5)); }
      }),
    });

    // A fraction causes a slowdown
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ cx: 9, cy: 3, radius: 0.4 }, { rotationSpeed: 2 }),
      role: new Sensor({
        heroCollision: (_self: Actor, h: Actor) => { h.rigidBody!.setVelocity(h.rigidBody!.getVelocity().Scale(0.2)); }
      }),
    });
  }

  else if (level == 8) {
    // Next, let's look at Obstacles.  We've already seen the basic behavior of
    // obstacles:

    // Let's start by looking at Goodies.  Whenever a hero collides with a
    // goodie, it automatically collects it.  JetLag has four built-in "goodie
    // counters".  When you collide with a goodie, the default is that the "0"
    // goodie counter increments by one.
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Obstacle(),
    });
  }

  else if (level == 9) {
    // We can run code when an enemy collides with an obstacle.  We can also
    // disable collisions for heroes but not anything else
    let h = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new FilledBox({ width: 0.2, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 8, width: .2, height: 2 }),
      role: new Obstacle({
        disableHeroCollision: true, enemyCollision: (_o: Actor, e: Actor) => {
          if (e.extra.weak) (e.role as Enemy).defeat(true);
        }
      }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: 0.4 }, { dynamic: true }),
      movement: new ChaseMovement({ target: h, speed: 1 }),
      role: new Enemy(),
      extra: { weak: true }
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 2, radius: 0.4 }, { dynamic: true }),
      movement: new ChaseMovement({ target: h, speed: 1 }),
      role: new Enemy(),
      extra: { weak: false }
    });
  }

  else if (level == 10) {
    // We can run code when a hero collides with an obstacle, too
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
      extra: { regular: true }
    });

    Actor.Make({
      appearance: new FilledBox({ width: 0.2, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 8, width: .2, height: 2 }),
      role: new Obstacle({
        heroCollision: (_o: Actor, h: Actor) => {
          if (h.extra.regular) {
            h.resize(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, .5, .5);
            h.extra.regular = false;
          }
        }
      }),
    });
  }

  else if (level == 11) {
    // We won't explore obstacle-projectile interactions (or projectiles at
    // all!) in this tutorial.  But there's one more thing about obstacles to
    // discuss.  We can use them to decide when a hero can jump again.

    stage.world.setGravity(0, 10);

    let hero = Actor.Make({
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

    // But this one only works from the top
    Actor.Make({
      appearance: new FilledBox({ width: 2, height: 2, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 12, cy: 5, width: 2, height: 2 }),
      role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
    });
  }

  else if (level == 12) {
    // Let's do more with enemies now.  By default, heroes have "1" strength,
    // and enemies do "2" damage, so when they collide, the hero goes away
    Actor.Make({
      appearance: new ImageSprite({ width: 0.4, height: 0.4, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.2 }, { density: 2 }),
      movement: new TiltMovement(),
      role: new Hero({
        onStrengthChange: (h) =>
          h.resize(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, (h.role as Hero).strength * .4, (h.role as Hero).strength * .4)
      }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 3, radius: 0.4 }),
      role: new Enemy(),
    });

    // This goodie changes the hero's strength, which, in turn, triggers the
    // hero's strength change callback
    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8, radius: 0.4 }),
      role: new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          (h.role as Hero).strength += 3;
          return true;
        }
      }),
    });
  }

  else if (level == 13) {
    // We saw jumping in level 12.  Of course, we can also double-jump :)
    stage.world.setGravity(0, 10);

    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero({ numJumpsAllowed: 2 }),
    });

    // By default, obstacles reenable jumping upon any collision, any side, so
    // colliding with a border will re-enable jumps
    let jump_attempts = 0;
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      jump_attempts += 1;
      console.log("jump attempt " + jump_attempts);
      (hero.role as Hero).jump(0, -7.5);
    });
  }

  else if (level == 14) {
    // Since jumping is a nice way to do movement, we also have infinite jump
    stage.world.setGravity(0, 10);

    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 3, cy: 3, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero({ allowMultiJump: true }),
    });

    // By default, obstacles reenable jumping upon any collision, any side, so
    // colliding with a border will re-enable jumps
    let jump_attempts = 0;
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      jump_attempts += 1;
      console.log("jump attempt " + jump_attempts);
      (hero.role as Hero).jump(0, -7.5);
    });

  }

  else if (level == 15) {
    // Heroes can use jumping and crawling to defeat enemies.  This doesn't
    // involve the hero's strength
    //
    // You might use crawling to simulate crawling, ducking, rolling, spinning,
    // etc.

    stage.world.setGravity(0, 10);
    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 2, cy: 3, width: 0.8, height: 0.8 }, { density: 2 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8.6, radius: 0.4 }),
      role: new Enemy({ defeatByCrawl: true, }),
    });

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 14, cy: 8.6, radius: 0.4 }),
      role: new Enemy({ defeatByJump: true }),
    });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => { (hero.role as Hero).jump(0, -7.5); });

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => { (hero.role as Hero).crawlOn(Math.PI / 2); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_TAB, () => { (hero.role as Hero).crawlOff(Math.PI / 2); });
  }

  if (level == 16) {
    // We can change how much damage an enemy is capable of doing, and we can
    // require certain heroes to stay alive.  Otherwise, as long as one hero is
    // still alive, the game goes on
    for (let i = 1; i < 4; ++i) {
      Actor.Make({
        appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
        rigidBody: new BoxBody({ cx: 2 * i, cy: 3, width: 0.8, height: 0.8 }, { density: 2 }),
        movement: new TiltMovement(),
        role: new Hero({ strength: 10 - i, mustSurvive: i == 3 }),
      });
    }

    Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 12, cy: 8.6, radius: 0.4 }),
      role: new Enemy({
        damage: 8, onDefeatHero: (e: Actor) => e.resize(12, 8.5, 1, 1), onDefeated: (e: Actor) =>
          Actor.Make({
            appearance: new ImageSprite({ width: .5, height: .5, img: "blue_ball.png" }),
            rigidBody: new CircleBody({ radius: .25, cx: e.rigidBody.getCenter().x, cy: 2 }),
            role: new Goodie()
          })
      }),
    });
  }

  if (level == 17) {
    // JetLag also supports invincibility.  In this level, the goodie makes the
    // hero invincible for 15 seconds.  Some enemies can't be defeated with
    // invincibility.

    // defeat 3 enemies to win
    stage.score.setVictoryEnemyCount(3);

    let hero = Actor.Make({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 2, cy: 3, radius: 0.4 }, { density: 2 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // draw a few enemies, and make them rotate
    for (let i = 0; i < 5; ++i) {
      let cfg = { cx: i + 4, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
        role: new Enemy({ immuneToInvincibility: i == 4, instantDefeat: i == 2, disableHeroCollision: true }),
      });
    }

    // this goodie adds 15 seconds of invincibility
    Actor.Make({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 8, radius: 0.25, }, { rotationSpeed: .25 }),
      role: new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          (h.role as Hero).invincibleRemaining = ((h.role as Hero).invincibleRemaining + 15); return true;
        }
      }),
    });

    // Show how much invincibility is remaining
    Actor.Make({
      appearance: new TextSprite({ face: "Arial", size: 16, color: "#3C64BF", center: false }, () => (hero.role as Hero).invincibleRemaining.toFixed(0) + " Invincibility"),
      rigidBody: new CircleBody({ radius: .01, cx: .01, cy: 1 }, { scene: stage.hud })
    })
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);

/**
 * Report the goodie counts in a pop-up window, as a way of sanity-checking
 * scores
 */
function alertGoodies() {
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SLASH, () =>
    window.alert(`${stage.score.getGoodieCount(0)}, ${stage.score.getGoodieCount(1)}, ${stage.score.getGoodieCount(2)}, ${stage.score.getGoodieCount(3)}`));
}
