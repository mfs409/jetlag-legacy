import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig, Sides } from "../jetlag/Config";
import { AnimatedSprite, FilledBox, FilledCircle, FilledPolygon, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { BasicChase, FlickMovement, ManualMovement, Path, PathMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle, Projectile, Sensor } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/Grid";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";
import { Scene } from "../jetlag/Entities/Scene";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { AdvancedCollisionSystem } from "../jetlag/Systems/Collisions";

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



  // This level introduces goodies. Goodies are something that we collect.  We
  // can make the collection of goodies lead to changes in the behavior of the
  // game.  In this example, the collection of goodies "enables" a destination.
  if (level == 14) {
  }

  // Sometimes, we don't want a destination, we just want to say that the player
  // wins by collecting enough goodies.  This level also shows that we can set a
  // time limit for the level, and we can pause the game.
  else if (level == 16) {
    // Set up a hero who is controlled by the joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    addJoystickControl(
      stage.hud,
      { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // draw 5 goodies
    for (let p = 0; p < 5; p++) {
      cfg = { cx: p + 1, cy: p + 4, radius: 0.125, width: 0.25, height: 0.25, img: "blue_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie(),
      });
    }

    // indicate that we win by collecting enough goodies
    stage.score.setVictoryGoodies(5, 0, 0, 0);

    // put the goodie count on the screen
    makeText(stage.hud,
      { cx: .25, cy: .25, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 14, z: 2 },
      () => stage.score.getGoodieCount(0) + "/5 Goodies");

    // put a simple countdown on the screen.  The first line says "15 seconds", the second
    // actually draws something on the screen showing remaining time
    stage.score.setLoseCountdownRemaining(15);
    makeText(stage.world,
      { cx: .25, cy: 1.25, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 32, z: 2 }, () =>
      (stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0));

    // let's also add a screen for pausing the game. In a real game, every level
    // should have a button for pausing the game, and the pause scene should
    // have a button for going back to the main menu... we'll show how to do
    // that later.
    //
    // The way this works is it says "draw a button that, when pressed, tells
    // JetLag how to draw a pause scene".  Whenever JetLag sees that it's
    // possible to draw a pause scene, it will draw it, so this will cause the
    // game to switch to a pause scene until the overlay gets dismissed
    addTapControl(stage.hud, { cx: 15, cy: 3, width: 1, height: 1, img: "pause.png" }, (): boolean => {
      stage.requestOverlay((overlay: Scene) => {
        addTapControl(
          overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000" },
          () => { stage.clearOverlay(); return true; }
        );
        makeText(overlay,
          { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 32, z: 0 },
          () => "Game Paused");
      }, true);
      return true;
    });

    welcomeMessage("Collect all blue balls to win");
    loseMessage("Time Up");
    winMessage("Great Job");
  }


  // This level shows that it is possible to give heroes and enemies different
  // strengths, so that a hero doesn't disappear after a single collision. It
  // also shows that when an enemy defeats a hero, we can customize the message
  // that prints
  else if (level == 18) {
    // set up a basic world.  Tilt will control one enemy, and also the hero
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // draw a hero and give it strength of 10. The default is for enemies to
    // have "2" units of damage, and heroes to have "1" unit of strength, so
    // that any collision defeats the hero without removing the enemy.
    cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 }),
    });

    // draw a strength meter to show this hero's strength
    makeText(stage.world,
      { cx: 0.5, cy: .5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => (h.role as Hero).strength + " Strength");

    // Make a custom lose scene, that makes use of this variable called endText.
    // The trick here is that our code can change endText to say other things
    let endText = "Try Again";
    stage.score.loseSceneBuilder = (overlay: Scene) => {
      addTapControl(
        overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000" },
        () => { stage.switchTo(builder, level); return true; }
      );
      makeText(overlay,
        { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
        () => endText);
    };

    // Each enemy will get an "onDefeatHero" callback, which will run if that
    // hero is the one who defeats the hero.  The callbacks will just change the
    // endText, so that the lose screen will display different messages.
    // Notice, too, that we are going to make it so that hero collisions with
    // enemies don't cause the hero to bounce.

    // our first enemy stands still:
    cfg = { cx: 8, cy: 8, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
      role: new Enemy({ damage: 4, onDefeatHero: () => { endText = "How did you hit me?"; }, disableHeroCollision: true }),
    });

    // our second enemy moves along a path
    cfg = { cx: 7, cy: 7, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6 }),
      movement: new PathMovement(new Path().to(7, 7).to(7, 1).to(7, 7), 2, true),
      role: new Enemy({ damage: 4, onDefeatHero: () => { endText = "Stay out of my way!"; }, disableHeroCollision: true }),
    });

    // our third enemy moves with tilt, which makes it hardest to avoid
    cfg = { cx: 15, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 15, elasticity: 0.3, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Enemy({ damage: 4, onDefeatHero: () => { endText = "You can't run away from me!"; }, disableHeroCollision: true }),
    });

    // be sure when testing this level to lose, with each enemy being the last the hero
    // collides with, so that you can see the different messages
    welcomeMessage("The hero can defeat up to two enemies...");
    winMessage("Great Job");
  }

  // This level shows that we can win a level by defeating all enemies.  It also
  // shows that we can put a time limit on a level
  else if (level == 19) {
    // start with a hero who is controlled via Joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new ManualMovement(),
      // Give the hero enough strength to beat the enemies
      role: new Hero({ strength: 5 }),
    });
    addJoystickControl(stage.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // draw two enemies.  Remember, each does 2 units of damage
    cfg = { cx: 6, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    cfg = { cx: 15, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    // Start a countdown with 10 seconds, and put a timer on the HUD
    stage.score.setLoseCountdownRemaining(10);
    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 32, z: 2 }, () =>
      (stage.score.getLoseCountdownRemaining() ?? 0).toFixed(0));

    // indicate that defeating all of the enemies is the way to win this level
    stage.score.setVictoryEnemyCount();

    welcomeMessage("You have 10 seconds to defeat the enemies");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that a goodie can change the hero's strength, and that we
  // can win by defeating a specific number of enemies, instead of all enemies.
  else if (level == 20) {
    // start with a hero who is controlled via Joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    addJoystickControl(stage.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // draw an enemy.  By default, it does 2 units of damage.  If it disappears,
    // it will make a sound
    cfg = { cx: 10, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
      sounds: new SoundEffectComponent({ defeat: "slow_down.ogg" }),
    });

    // draw another enemy.  It is too deadly for us to ever defeat.
    cfg = { cx: 7, cy: 7, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ damage: 100 }),
    });

    // this goodie gives an extra "2" units of strength:
    cfg = { cx: 14, cy: 7, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          (h.role as Hero).strength = 2 + (h.role as Hero).strength;
          return true;
        }
      }),
      sounds: new SoundEffectComponent({ disappear: "woo_woo_woo.ogg" }),
    });

    // Display the hero's strength
    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => (h.role as Hero).strength + " Strength");

    // win by defeating one enemy
    stage.score.setVictoryEnemyCount(1);

    // Change the text that appears on the scene when we win the level
    winMessage("Good enough...");
    loseMessage("Try Again");
    welcomeMessage("Collect blue balls to increase strength\n" + "Defeat one enemy to win");

  }

  // this level demonstrates crawling heroes. We can use this to simulate
  // crawling, ducking, rolling, spinning, etc. Note, too, that we can use it to
  // make the hero defeat certain enemies via crawl.
  else if (level == 38) {
    stage.world.camera.setBounds(0, 0, 48, 9);
    stage.world.setGravity(0, 10);
    drawBoundingBox(0, 0, 48, 9, .1, { density: 1, elasticity: 0.3 });
    let cfg = { cx: 47, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    let boxCfg = { cx: 0, cy: 7, width: 0.75, height: 1.5, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 5 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (h.movement as ManualMovement).addVelocity(5, 0);

    stage.world.camera.setCameraFocus(h);
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // to enable crawling, we just draw a crawl button on the screen
    // Be sure to hover over "crawlOn" and "crawlOff" to see what they do
    addToggleButton(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, () => (h.role as Hero).crawlOn(Math.PI / 2), () => (h.role as Hero).crawlOff(Math.PI / 2));

    // make an enemy who we can only defeat by colliding with it while crawling
    cfg = { cx: 40, cy: 8, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ defeatByCrawl: true }),
    });

    welcomeMessage("Press the screen\nto crawl");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // In a side-scrolling game, it is useful to be able to change the hero's
  // speed either permanently or temporarily. In JetLag, we can use a collision
  // between a hero and an obstacle to achieve this effect.
  else if (level == 40) {
    stage.world.camera.setBounds(0, 0, 160, 9);
    drawBoundingBox(0, 0, 160, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0, cy: 0, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (h.movement as ManualMovement).addVelocity(5, 0);

    stage.world.camera.setCameraFocus(h);
    cfg = { cx: 159, cy: .5, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // place a speed-up obstacle that lasts for 2 seconds
    cfg = { cx: 20, cy: .5, width: 1, height: 1, radius: 0.5, img: "right_arrow.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Sensor({ heroCollision: setSpeedBoost(5, 0, 2) }),
    });

    // place a slow-down obstacle that lasts for 3 seconds
    cfg = { cx: 60, cy: .5, width: 1, height: 1, radius: 0.5, img: "left_arrow.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Sensor({ heroCollision: setSpeedBoost(-2, 0, 3) }),
    });

    // place a permanent +3 speedup obstacle... the -1 means "forever"
    cfg = { cx: 80, cy: .5, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Sensor({ heroCollision: setSpeedBoost(3, 0) }),
    });

    // This isn't a very fun level, since there's no way to change the hero's
    // behavior...

    welcomeMessage("Speed boosters and reducers");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // We can use obstacles to defeat enemies, and we can control which enemies
  // the obstacle can defeat, by using obstacle-enemy collision callbacks
  else if (level == 55) {
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // make four enemies
    cfg = { cx: 10, cy: 2, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    cfg = { cx: 10, cy: 4, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    cfg = { cx: 10, cy: 6, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    cfg = { cx: 10, cy: 8, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let big_enemy = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });
    // We can use "extra" to put some more information onto any actor
    big_enemy.extra.size = "big";

    // win by defeating enemies
    stage.score.setVictoryEnemyCount(4);

    // put an enemy defeated count on the screen, in red with a small font
    makeText(stage.hud,
      { cx: 0.5, cy: 8, center: false, width: .1, height: .1, face: "Arial", color: "#FF0000", size: 10, z: 2 },
      () => stage.score.getEnemiesDefeated() + "/4 Enemies Defeated");

    // make a moveable obstacle.  We're going to enable it to defeat the "big"
    // enemy
    cfg = { cx: 14, cy: 2, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      // when this obstacle collides with any enemy, it checks the enemy's
      // "extra".  If it matches "big", then this obstacle defeats the enemy, and
      // the obstacle disappears.
      role: new Obstacle({
        enemyCollision: (thisActor: Actor, collideActor: Actor) => {
          if (collideActor.extra.size === "big") {
            (collideActor.role as Enemy).defeat(true, thisActor);
            thisActor.remove();
          }
        }
      }),
    });

    // make a small obstacle that can defeat the enemies that aren't "big"
    cfg = { cx: 0.5, cy: 0.5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Obstacle({
        enemyCollision: (_thisActor: Actor, collideActor: Actor) => {
          if (collideActor.extra.size !== "big") {
            (collideActor.role as Enemy).defeat(true, undefined);
          }
        }
      }),
    });

    welcomeMessage("Obstacles can defeat enemies!");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level shows how to use enemy defeat callbacks. There are five
  // ways to defeat an enemy, so we enable all mechanisms in this level,
  // to see if they all work to cause enemy callbacks to run the
  // enemy collision callback code.
  else if (level == 63) {
    welcomeMessage("There are five ways to defeat an enemy");
    winMessage("You did it!");

    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1);

    // make a hero and give it some strength, so it can defeat an enemy via
    // collision.
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 1000, repeat: true, images: ["green_ball.png"] }));
    let inv = new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100);
    for (let s of [AnimationState.INV_E, AnimationState.INV_NE, AnimationState.INV_SE, AnimationState.INV_W, AnimationState.INV_SW, AnimationState.INV_NW, AnimationState.INV_N, AnimationState.INV_S])
      animations.set(s, inv);
    for (let s of [AnimationState.INV_IDLE_E, AnimationState.INV_IDLE_NE, AnimationState.INV_IDLE_SE, AnimationState.INV_IDLE_W, AnimationState.INV_IDLE_SW, AnimationState.INV_IDLE_NW, AnimationState.INV_IDLE_N, AnimationState.INV_IDLE_S])
      animations.set(s, inv);

    let h_cfg = {
      cx: 5, cy: 5, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png", animations
    };
    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world),
      movement: new TiltMovement(),
      role: new Hero({ strength: 3 }),
    });

    // Make a goodie that will turn the hero invincible, so we can test
    // invincibility
    let cfg = { cx: 10, cy: 5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Goodie({ onCollect: (_g: Actor, h: Actor) => { (h.role as Hero).invincibleRemaining = 15; return true; } }),
    });

    // Tapping the hero will throw a projectile, which is another way to defeat
    // enemies
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 100, strength: 1,
      immuneToCollisions: true,
      range: 40,
      disappearOnCollide: true,
      bodyMaker: () => new CircleBody({ radius: 0.1, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new ImageSprite({ width: 0.2, height: 0.21, img: "grey_ball.png" })
    });
    h.gestures = { tap: () => { (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, -.75, 0, -20, 0); return true; } }

    // add an obstacle that has an enemy collision callback, so it can defeat
    // enemies by colliding with them (but only the one we mark as "weak")
    cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1000 }),
      movement: new FlickMovement(1),
      role: new Obstacle({ enemyCollision: (_thisActor: Actor, collideActor: Actor) => { if (collideActor.extra.info === "weak") (collideActor.role as Enemy).defeat(true, undefined); } }),
    });
    // We'll use flicking to move the obstacle
    createFlickZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // Here's some code to run whenever an enemy is defeated
    let onDefeatScript = () => {
      // Make a fresh pause scene
      stage.requestOverlay((overlay: Scene) => {
        makeText(overlay,
          { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#58E2A0", size: 16, z: 0 }, () => "good job, here's a prize");
        addTapControl(overlay, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, () => { stage.clearOverlay(); return true; });

        // Draw a goodie on the screen somewhat randomly as a reward... picking
        // in the range 0-8,0-15 ensures that with width and height of 1, the
        // goodie stays on screen
        cfg = { cx: getRandom(15) + .5, cy: getRandom(8) + .5, radius: 0.5, width: 1, height: 1, img: "blue_ball.png" };
        Actor.Make({
          appearance: new ImageSprite(cfg),
          rigidBody: new CircleBody(cfg, stage.world),
          role: new Goodie(),
        });
      }, false);
    };

    // now draw our enemies... we need enough to be able to test that all five
    // defeat mechanisms work.
    cfg = { cx: 1, cy: 1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ onDefeated: onDefeatScript }),
    });

    cfg = { cx: 1, cy: 3, width: .5, height: .5, radius: 0.25, img: "red_ball.png" };
    let e2 = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ onDefeated: onDefeatScript }),
    });
    e2.extra.info = "weak";

    cfg = { cx: 1, cy: 5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ onDefeated: onDefeatScript }),
    });

    cfg = { cx: 1, cy: 6.5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e4 = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ onDefeated: onDefeatScript }),
    });
    defeatOnTouch(e4.role as Enemy);

    cfg = { cx: 1, cy: 8, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ onDefeated: onDefeatScript }),
    });

    // win by defeating enemies
    stage.score.setVictoryEnemyCount(5);
  }

  // This level shows that we can resize a hero on the fly, and change its
  // image. We use a collision callback to cause the effect. Furthermore, we can
  // increment scores inside of the callback code, which lets us activate the
  // destination on an obstacle collision
  else if (level == 64) {
    enableTilt(10, 10);
    welcomeMessage("Only stars can reach the destination");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 1, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => stage.score.getGoodieCount(0) + " Goodies");

    // the destination won't work until some goodies are collected...
    cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "color_star_1.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination({
        onAttemptArrival: () => {
          return stage.score.getGoodieCount(0) >= 4 && stage.score.getGoodieCount(1) >= 1 && stage.score.getGoodieCount(2) >= 3;
        }
      }),
    });

    stage.score.setVictoryDestination(1);

    // Colliding with this star will make the hero into a star
    let boxCfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "leg_star_1.png" };
    let o = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, friction: 1 }),
      role: new Sensor(),
    });

    (o.role as Sensor).heroCollision = (thisActor: Actor, collideActor: Actor) => {
      // here's a simple way to increment a goodie count
      stage.score.addToGoodieCount(1, 1);
      // here's a way to set a goodie count
      stage.score.setGoodieCount(2, 3);
      // here's a way to read and write a goodie count
      stage.score.addToGoodieCount(0, 4);
      // get rid of the star, so we know it's been used
      thisActor.remove();
      // resize the hero, and change its image
      collideActor.resize(collideActor.rigidBody?.getCenter().x ?? 0, collideActor.rigidBody?.getCenter().y ?? 0, 0.5, 0.5);
      (collideActor.appearance as ImageSprite).setImage("leg_star_1.png");
    };
  }

  // It can be useful to make a hero stick to an obstacle. As an example, if the
  // hero should stand on a platform that moves along a path, then we will want
  // the hero to "stick" to it, even as the platform moves downward.
  else if (level == 70) {
    stage.world.setGravity(0, 10);
    welcomeMessage("Press screen borders to move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // create a destination.  Note that when you are testing this level, you
    // shouldn't just race to the destination.  You'll want to try out the
    // platforms
    cfg = { cx: 15.5, cy: 8.5, radius: .5, width: 1, height: 1, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });
    stage.score.setVictoryDestination(1);

    // This platform is sticky on top... Jump onto it and watch what happens
    let platform_cfg = { cx: 2, cy: 6, width: 2, height: 0.25, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(platform_cfg),
      rigidBody: new BoxBody(platform_cfg, stage.world, { stickySides: [Sides.TOP], density: 100, friction: 0.1 }),
      movement: new PathMovement(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true),
      role: new Obstacle(),
    });
    // Be sure to try out bottomSticky, leftSticky, and rightSticky

    // This obstacle is not sticky... The hero can slip around on it
    //
    // It's tempting to think "I'll use some friction here", but isn't the
    // sticky platform nicer?
    platform_cfg = { cx: 11, cy: 6, width: 2, height: 0.25, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(platform_cfg),
      rigidBody: new BoxBody(platform_cfg, stage.world, { density: 100, friction: 1 }),
      movement: new PathMovement(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true),
      role: new Obstacle(),
    });

    // draw some buttons for moving the hero
    addToggleButton(stage.hud, { cx: .5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ManualMovement).updateXVelocity(-5),
      () => (h.movement as ManualMovement).updateXVelocity(0)
    );
    addToggleButton(stage.hud, { cx: 15.5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ManualMovement).updateXVelocity(5),
      () => (h.movement as ManualMovement).updateXVelocity(0)
    );
  }

  // When the projectile isn't a circle we might want to rotate it in the
  // direction of travel. Also, this level shows how to do walls that can be
  // passed through in one direction.
  else if (level == 71) {
    enableTilt(10, 10);
    welcomeMessage("Press anywhere to shoot a laser beam");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6, disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15.25, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // set up a pool of projectiles with fixed velocity, and with
    // rotation
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 100, strength: 1, fixedVectorVelocity: 10, rotateVectorToss: true,
      immuneToCollisions: true, disappearOnCollide: true, range: 40,
      bodyMaker: () => new BoxBody({ width: 0.02, height: .5, cx: -100, cy: -100 }, stage.world, { collisionsEnabled: false }),
      appearanceMaker: () => new FilledBox({ width: 0.02, height: 1, fillColor: "#FF0000" }),
    });

    // draw a button for throwing projectiles in many directions. It
    // only covers half the screen, to show how such an effect would
    // behave
    addDirectionalTossButton(stage.hud,
      projectiles, { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, h, 100, 0, 0);

    // Warning!  If you make these projectiles any longer, and if you are not
    // careful about your offsets, you might find that they seem to "not shoot",
    // because you are too close to a wall, and the back of the projectile is
    // hitting the wall.

    // create a box that is easy to fall into, but hard to get out of,
    // by making its sides each "one-sided"
    // TODO: This doesn't seem to be working correctly?
    let boxCfg = { cx: 4.5, cy: 3.1, width: 3, height: 0.2, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { singleRigidSide: Sides.BOTTOM }),
      role: new Obstacle(),
    });

    boxCfg = { cx: 3.1, cy: 4.5, width: 0.2, height: 3, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { singleRigidSide: Sides.RIGHT }),
      role: new Obstacle(),
    });

    boxCfg = { cx: 5.9, cy: 4.5, width: 0.2, height: 3, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { singleRigidSide: Sides.LEFT }),
      role: new Obstacle(),
    });

    boxCfg = { cx: 4.5, cy: 7.5, width: 3, height: 0.2, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { singleRigidSide: Sides.TOP }),
      role: new Obstacle(),
    });
  }

  // this level shows passthrough objects and chase again, to help
  // get you thinking about chase and dynamic bodies
  else if (level == 73) {
    enableTilt(10, 10);
    welcomeMessage("You can walk through the wall");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { passThroughId: 7 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 14, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // the enemy chases the hero, but can't get through the wall
    let n_cfg = { cx: 14, cy: 2, width: 0.5, height: 0.5, radius: 0.25, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(n_cfg),
      rigidBody: new CircleBody(n_cfg, stage.world, { dynamic: true }),
      movement: new BasicChase(1, h, true, true),
      role: new Enemy(),
    });
    // Remember to make it dynamic, or it *will* go through the wall

    let boxCfg = { cx: 12, cy: 1, width: 0.1, height: 7, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { passThroughId: 7 }),
      role: new Obstacle(),
    });
  }

  // This level shows that we can defeat enemies by jumping on them
  else if (level == 80) {
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    stage.score.setVictoryEnemyCount(1);

    // set up a simple jumping hero
    let boxCfg = { cx: 1, cy: 8, width: 1, height: 0.5, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // This enemy can be defeated by jumping. We require that the hero is in
    // mid-jump (not falling off an obstacle) and that its center is higher than
    // the enemy's center.  If you want different conditions, you'll probably
    // want to change the Hero's onCollideWithEnemy function, in Role.ts.
    let cfg = { cx: 15, cy: 7, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy({ defeatByJump: true }),
    });
  }

  // We previously saw that we can have "sticky" actors, and also allow actors
  // to pass through other actors by making only certain sides rigid.  In this
  // example, we make sure they work together, by letting the hero jump through
  // a platform, and then stick to it.
  else if (level == 90) {
    stage.world.setGravity(0, 10);
    welcomeMessage("Press screen borders to move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");

    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 2, friction: 0.5, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    })
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // create a destination
    cfg = { cx: 14, cy: 4, radius: 1, width: 2, height: 2, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // This obstacle is sticky on top, and only rigid on its top
    let boxCfg = { cx: 2, cy: 6, width: 2, height: 0.25, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { stickySides: [Sides.TOP], singleRigidSide: Sides.TOP, density: 100, friction: 0.1 }),
      movement: new PathMovement(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true),
      role: new Obstacle(),
    });

    // This obstacle is not sticky, and it is rigid on all sides
    boxCfg = { cx: 11, cy: 6, width: 2, height: 0.25, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 100, friction: 1 }),
      movement: new PathMovement(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true),
      role: new Obstacle(),
    })

    // draw some buttons for moving the hero
    addToggleButton(stage.hud,
      { cx: .5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ManualMovement).updateXVelocity(-5),
      () => (h.movement as ManualMovement).updateXVelocity(0)
    );
    addToggleButton(stage.hud,
      { cx: 15.5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ManualMovement).updateXVelocity(5),
      () => (h.movement as ManualMovement).updateXVelocity(0)
    );
  }

  // We might want to use heroes for unusual purposes in a game.  Sometimes
  // there is a "real" hero, though, who needs to not be defeated.  This level
  // shows how to do that.
  else if (level == 85) {
    welcomeMessage("Keep both heroes alive!");
    winMessage("Great Job");
    loseMessage("Try Again");

    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // This hero must survive
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let must_survive_hero = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero({ mustSurvive: true }),
    });

    // This hero is expendable, but if it makes it to the destination, it's
    // still a win
    cfg = { cx: 2.25, cy: 5.25, width: 0.8, height: 0.8, radius: .4, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new BoxBody(cfg, stage.world),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // An enemy who chases the hero who must survive
    cfg = { cx: 15, cy: 0.1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new BasicChase(1, must_survive_hero, true, true),
      role: new Enemy(),
    });

    // A regular destination
    cfg = { cx: 15, cy: 7, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
  }

  // End Contact
  else if (level == 92) {

    // start by setting everything like in level 1
    enableTilt(10, 10);
    let cfg = { cx: 2, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // notice that when we want to change cfg, we don't put a "let" in front
    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let collisions = 0;
    let messages = ["Please leave me alone", "Why do you bother me so?", "Fine, you win."]
    let o = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Obstacle({
        heroCollision: () => {
          let t = Actor.Make({
            appearance: new TextSprite({ center: false, face: "Arial", size: 30, color: "#FF00FF" }, () => messages[collisions]),
            rigidBody: new BoxBody({ cx: 12, cy: 6, width: 1, height: 1 }, stage.world)
          });
          (stage.world.physics as AdvancedCollisionSystem).addEndContactHandler(o, h, () => {
            collisions++;
            t.remove();
            if (collisions == 3)
              stage.score.winLevel();
          });
        }
      }),
    });

    winMessage("You made it!");

    // add a bounding box so the hero can't fall off the screen.  Hover your
    // mouse over 'drawBoundingBox' to learn about what the parameters mean.
    // This really should have a box width, instead of hard-coding it
    drawBoundingBox(0, 0, 16, 9, .1);

    // In the same way that we make "win" messages, we can also make a "welcome"
    // message to show before the level starts.  Again, there is a lot of code
    // involved in making a welcome message, which we will explore later on
    welcomeMessage("Use tilt (or arrows) to reach the destination");

  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
