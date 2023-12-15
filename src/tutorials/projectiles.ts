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

  if (level == 99) {
    // Do we even need a limit on projectiles?  Probably.  Make a demo?

    // set up our projectiles.  There are only 20... throw them carefully
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 3, strength: 2,
      bodyMaker: () => new CircleBody({ radius: 0.25, cx: -100, cy: -100 }),
      disappearOnCollide: true,
      range: 40,
      immuneToCollisions: true,
      appearanceMaker: () => new ImageSprite({ img: "color_star_1.png", width: 0.5, height: 0.5, z: 0 }),
      randomImageSources: ["color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png"]
    });
    projectiles.setLimit(20);

    // make an obstacle that causes the hero to throw Projectiles when touched
    //
    // It might seem silly to use an obstacle instead of something on the HUD,
    // but it's good to realize that all these different behaviors are really
    // the same.
    cfg = { cx: 15, cy: 2, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let o = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, { collisionsEnabled: false }),
      role: new Obstacle(),
    });
    o.gestures = {
      tap: () => { (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .125, .75, 0, 15); return true; }
    };

    // show how many shots are left
    makeText(stage.hud,
      { cx: 0.5, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#FF00FF", size: 12, z: 2 },
      () => projectiles.getRemaining() + " projectiles left");

    // draw a bunch of enemies to defeat
    cfg = { cx: 4, cy: 5, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
      role: new Enemy(),
    });

    for (let i = 1; i < 20; i += 5) {
      cfg = { cx: 1 + i / 2, cy: 7, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg),
        role: new Enemy(),
      });
    }

    stage.score.setVictoryEnemyCount(5);

    // This level makes an interesting point... what do you do if you run out of
    // projectiles?  How can we say "start over"?  There are a few ways that
    // would work... what can you come up with?
  }

  // The next few levels demonstrate support for throwing projectiles. In this
  // level, we throw projectiles by touching the hero, and the projectile always
  // goes in the same direction
  else if (level == 42) {
    enableTilt(10, 10);
    // Just for fun, we'll have an auto-scrolling background, to make it look
    // like we're moving all the time
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: -5 / 1000, isAuto: true });
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero and an enemy that slowly moves toward the hero
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // This enemy will slowly move toward the hero
    cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new ChaseFixed(h, 0.1, 0.1),
      role: new Enemy(),
    });

    stage.score.setVictoryEnemyCount(1);

    // configure a pool of projectiles. We say that there can be no more than 3
    // projectiles in flight at any time.  Once a projectile hits a wall or
    // enemy, it stops being "in flight", so we can throw another.
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 3, strength: 1, disappearOnCollide: true, range: 40, immuneToCollisions: true, bodyMaker: () => new CircleBody({ radius: 0.125, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new ImageSprite({ width: 0.25, height: 0.25, img: "grey_ball.png", z: 1 }),
    });

    // Touching the hero will throw a projectile
    h.gestures = {
      tap: () => {
        // We need to say where to start the projectile, because we may want it
        // to look like it's coming out of a certain part of the hero
        // (especially if it's animated). .525 is the sum of the radii, so the
        // projectile won't overlap the hero at all. The speed will be (10,0)
        //
        // TODO: There is a lot of copy/paste of code like this, which doesn't work:
        //    (projectiles.get()?.movement as ProjectileMovement).throwFixed(projectiles, h, .525, 0, 10, 0);
        // It should be:
        (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .525, 0, 10, 0);
        return true;
      }
    };

    welcomeMessage("Press the hero to make it throw projectiles");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This is another demo of how throwing projectiles works. In this level, we
  // limit the distance that projectiles travel, and we can put a control on the
  // HUD for throwing projectiles in two directions
  else if (level == 43) {
    // Set up a scrolling background for the level
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "front.png" }), speed: -5 / 1000, isHorizontal: false, isAuto: true });
    enableTilt(1, 1, true);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 8, cy: 4.5, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6, disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // Win by defeating all enemies
    stage.score.setVictoryEnemyCount();

    // draw two enemies, on either side of the screen
    let boxCfg = { cx: .25, cy: 4.5, width: 0.5, height: 9, img: "red_ball.png" };
    let left_enemy = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Enemy(),
    });
    (left_enemy.role as Enemy).damage = 10;
    boxCfg = { cx: 15.75, cy: 4.5, width: 0.5, height: 9, img: "red_ball.png" };
    let right_enemy = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Enemy(),
    });
    (right_enemy.role as Enemy).damage = 10;

    // set up a pool of projectiles, but now once the projectiles travel more
    // than 9 meters, they disappear
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 100, strength: 1, range: 9, immuneToCollisions: true, disappearOnCollide: true,
      bodyMaker: () => new CircleBody({ radius: 0.125, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new ImageSprite({ width: 0.25, height: 0.25, img: "grey_ball.png", z: 0 }),
    });

    // Add buttons for throwing to the left and right.  Each keeps throwing for
    // as long as it is held, but only throws once every 100 milliseconds.
    // Throwing to the left flies out of the top of the hero.  Throwing to the
    // right flies out of the bottom.
    addToggleButton(stage.hud, { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, makeRepeatToss(projectiles, h, 100, 0, -.5, -30, 0), undefined);
    addToggleButton(stage.hud, { cx: 12, cy: 4.5, width: 8, height: 9, img: "" }, makeRepeatToss(projectiles, h, 100, 0, .5, 30, 0), undefined);

    welcomeMessage("Press left and right to throw projectiles");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level shows how to change the amount of damage a projectile can do
  else if (level == 44) {
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0, cy: 0, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    stage.score.setVictoryEnemyCount();

    // draw a few enemies.  The damage of an enemy determines how many
    // projectiles are needed to defeat it
    for (let i = 1; i <= 6; i++) {
      cfg = { cx: 2 * i, cy: 7 - i, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
      let e = Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6 }),
        role: new Enemy(),
      });
      (e.role as Enemy).damage = 2 * i;
    }

    // set up our projectiles... note that now projectiles each do 2 units of
    // damage.  Note that we make our projectiles immune to collisions.  This is
    // important if we don't want them colliding with the hero.
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 3, strength: 2, immuneToCollisions: true, disappearOnCollide: true, range: 40,
      bodyMaker: () => new BoxBody({ width: .1, height: .4, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new ImageSprite({ width: 0.1, height: 0.4, img: "grey_ball.png", z: 0 })
    });

    // this button only throws one projectile per press...
    addTapControl(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      () => { (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, 0, 0, 0, -10); return true; });

    welcomeMessage("Defeat all enemies to win");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows how to throw projectiles in a variety of directions, based
  // on touch. The velocity of the projectile will depend on the distance
  // between the hero and the touch point
  else if (level == 45) {
    stage.world.setGravity(0, 3);

    // Note: the height of the bounding box is set so that enemies can be drawn off screen
    // and then fall downward
    drawBoundingBox(0, -2, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 8.5, cy: 0.5, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Hero(),
    });

    stage.score.setVictoryEnemyCount(20);

    // Set up our pool of projectiles.  With this throwing mechanism, the farther from the
    // hero we press, the faster the projectile goes, so we multiply the velocity by .8 to
    // slow it down a bit
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      disappearOnCollide: true,
      size: 100, bodyMaker: () => new CircleBody({ radius: 0.125, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new ImageSprite({ width: 0.25, height: 0.25, img: "grey_ball.png", z: 0 }), strength: 2, multiplier: 0.8, range: 10, immuneToCollisions: true
    });

    // Draw a button for throwing projectiles in many directions.  Again, note
    // that if we hold the button, it keeps throwing
    addDirectionalTossButton(stage.hud, projectiles, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, h, 50, 0, 0);

    // We'll set up a timer, so that enemies keep falling from the sky
    stage.world.timer.addEvent(new TimedEvent(1, true, () => {
      // get a random number between 0.0 and 15.0
      let x = getRandom(151) / 10;
      cfg = { cx: x, cy: -1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        movement: new GravityMovement(),
        role: new Enemy(),
      });
    }));

    welcomeMessage("Press anywhere to throw a ball");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // Continuing our exploration of projectiles, this level shows how projectiles
  // can be affected by gravity.  It also shows that projectiles do not have to
  // disappear when they collide with obstacles.
  else if (level == 46) {
    // In this level, there is no way to move the hero left and right, but it can jump
    stage.world.setGravity(0, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: .4, cy: 0.4, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 1 }),
      role: new Hero(),
    });

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // draw a bucket, as three rectangles
    let boxCfg = { cx: 8.95, cy: 3.95, width: 0.1, height: 1, fillColor: "#FF0000" };
    let leftBucket = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Obstacle(),
    });

    boxCfg = { cx: 10.05, cy: 3.95, width: 0.1, height: 1, fillColor: "#FF0000" };
    let rightBucket = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Obstacle(),
    });

    boxCfg = { cx: 9.5, cy: 4.4, width: 1.2, height: 0.1, fillColor: "#FF0000" };
    let bottomBucket = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Obstacle(),
    });

    // Place an enemy in the bucket, and require that it be defeated
    cfg = { cx: 9.5, cy: 3.9, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new GravityMovement(),
      role: new Enemy({ damage: 4 }),
    });

    stage.score.setVictoryEnemyCount();

    // Set up a projectile pool with 5 projectiles
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 5,
      bodyMaker: () => new CircleBody({ radius: 0.25, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new ImageSprite({ width: 0.5, height: 0.5, img: "grey_ball.png", z: 0 }),
      strength: 1,
      multiplier: 2,
      disappearOnCollide: true,
      range: 40,
      gravityAffectsProjectiles: true,
      immuneToCollisions: false,
    });

    // cover "most" of the screen with a button for throwing projectiles.  This
    // ensures that we can still tap the hero to make it jump
    addTapControl(stage.hud, { cx: 8.5, cy: 4.5, width: 15, height: 9, img: "" },
      TossDirectionalAction(stage.hud, projectiles, h, 0, 0)
    );


    // We want to make it so that when the ball hits the obstacle (the
    // backboard), it doesn't disappear. The only time a projectile does not
    // disappear when hitting an obstacle is when you provide custom code to run
    // on a projectile/obstacle collision, and that code returns false. In that
    // case, you are responsible for removing the projectile (or for not
    // removing it).  That being the case, we can set a "callback" to run custom
    // code when the projectile and obstacle collide, and then just have the
    // custom code do nothing.
    (leftBucket.role as Obstacle).projectileCollision = () => false;

    // we can make a CollisionCallback object, and connect it to several obstacles
    let c = () => false;
    (rightBucket.role as Obstacle).projectileCollision = c;
    (bottomBucket.role as Obstacle).projectileCollision = c;

    // put a hint on the screen after 15 seconds to show where to click to ensure that
    // projectiles hit the enemy
    stage.world.timer.addEvent(new TimedEvent(15, false, () => {
      cfg = { cx: 2.75, cy: 2.4, width: 0.2, height: 0.2, radius: 0.1, img: "purple_ball.png" };
      let hint = Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world, { collisionsEnabled: false }),
        role: new Obstacle(),
      });
      // Make sure that when projectiles hit the obstacle, nothing happens
      (hint.role as Obstacle).projectileCollision = () => false
    }));

    welcomeMessage("Press anywhere to throw a projectile");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

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
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
