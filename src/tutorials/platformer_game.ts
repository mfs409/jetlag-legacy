import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig, Sides } from "../jetlag/Config";
import { AnimatedSprite, AppearanceComponent, FilledBox, FilledCircle, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { StandardMovement, Path, PathMovement, ProjectileMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody, RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { DIRECTION } from "../jetlag/Components/StateManager";
import { Scene } from "../jetlag/Entities/Scene";

// TODO: Climb?

// TODO: Get rid of the projectile helper?

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
  imageNames = [
    // Sprite sheets for the alien and lizard
    "alien.json", "lizard.json",
    // Layers for Parallax backgrounds
    "mid.png", "back.png",
    // Sprite sheet with the coins (and other stuff that we don't use)
    "sprites.json",
  ];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(_level: number) {
  // Draw a word that is 32x9 meters, with downward gravity
  stage.world.camera.setBounds(0, 0, 32, 9);
  stage.world.setGravity(0, 10);

  // Put a box around the world, so we can't go off the screen
  drawBoundingBox(0, 0, 32, 9, .1, { density: 10 });

  let animations = new Map();

  let remap = new Map();
  animations.set(AnimationState.WALK_W, new AnimationSequence(true)
    .to("alien_walk_l_0.png", 75).to("alien_walk_l_1.png", 75)
    .to("alien_walk_l_2.png", 75).to("alien_walk_l_3.png", 75)
    .to("alien_walk_l_4.png", 75).to("alien_walk_l_5.png", 75)
    .to("alien_walk_l_6.png", 75).to("alien_walk_l_7.png", 75)
    .to("alien_walk_l_8.png", 75));

  animations.set(AnimationState.WALK_E, new AnimationSequence(true)
    .to("alien_walk_r_0.png", 75).to("alien_walk_r_1.png", 75)
    .to("alien_walk_r_2.png", 75).to("alien_walk_r_3.png", 75)
    .to("alien_walk_r_4.png", 75).to("alien_walk_r_5.png", 75)
    .to("alien_walk_r_6.png", 75).to("alien_walk_r_7.png", 75)
    .to("alien_walk_r_8.png", 75));

  animations.set(AnimationState.JUMP_W, new AnimationSequence(true)
    .to("alien_cast_l_0.png", 75).to("alien_cast_l_1.png", 75)
    .to("alien_cast_l_2.png", 75).to("alien_cast_l_3.png", 75)
    .to("alien_cast_l_4.png", 8000).to("alien_cast_l_5.png", 75)
    .to("alien_cast_l_6.png", 75));
  remap.set(AnimationState.JUMP_IDLE_W, AnimationState.JUMP_W);

  animations.set(AnimationState.JUMP_E, new AnimationSequence(true)
    .to("alien_cast_r_0.png", 75).to("alien_cast_r_1.png", 75)
    .to("alien_cast_r_2.png", 75).to("alien_cast_r_3.png", 75)
    .to("alien_cast_r_4.png", 8000).to("alien_cast_r_5.png", 75)
    .to("alien_cast_r_6.png", 75));
  remap.set(AnimationState.JUMP_IDLE_E, AnimationState.JUMP_E);

  animations.set(AnimationState.TOSS_W, new AnimationSequence(true)
    .to("alien_thrust_l_0.png", 10).to("alien_thrust_l_1.png", 10)
    .to("alien_thrust_l_2.png", 10).to("alien_thrust_l_3.png", 10)
    .to("alien_thrust_l_4.png", 75).to("alien_thrust_l_5.png", 50)
    .to("alien_thrust_l_6.png", 50).to("alien_thrust_l_7.png", 50));
  remap.set(AnimationState.TOSS_IDLE_W, AnimationState.TOSS_W);

  animations.set(AnimationState.TOSS_E, new AnimationSequence(true)
    .to("alien_thrust_r_0.png", 10).to("alien_thrust_r_1.png", 10)
    .to("alien_thrust_r_2.png", 10).to("alien_thrust_r_3.png", 10)
    .to("alien_thrust_r_4.png", 75).to("alien_thrust_r_5.png", 50)
    .to("alien_thrust_r_6.png", 50).to("alien_thrust_r_7.png", 50));
  remap.set(AnimationState.TOSS_IDLE_E, AnimationState.TOSS_E);

  animations.set(AnimationState.IDLE_W, new AnimationSequence(true)
    .to("alien_thrust_l_0.png", 750).to("alien_thrust_l_1.png", 75));

  animations.set(AnimationState.IDLE_E, new AnimationSequence(true)
    .to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

  let h = Actor.Make({
    appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
    rigidBody: new PolygonBody({ cx: 0.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, stage.world, { density: 1, disableRotation: true }),
    movement: new StandardMovement(),
    role: new Hero()
  });
  (h.appearance as AnimatedSprite).stateSelector = AnimatedSprite.sideViewAnimationTransitions;
  // center the camera a little ahead of the hero, so we can see more of the
  // world during gameplay
  stage.world.camera.setCameraFocus(h, 6, 0);

  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as StandardMovement).updateXVelocity(0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as StandardMovement).updateXVelocity(0));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as StandardMovement).updateXVelocity(-2.5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as StandardMovement).updateXVelocity(2.5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));

  Actor.Make({
    appearance: new FilledCircle({ radius: 0.4, fillColor: "#ff7575" }),
    rigidBody: new CircleBody({ cx: 31, cy: 8.25, radius: 0.4, }, stage.world),
    role: new Destination(),
  });

  stage.score.setVictoryDestination(1);

  // set up the backgrounds
  stage.backgroundColor = "#17b4ff";
  stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1 });
  stage.background.addLayer({ cx: 0, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

  // set up a pool of projectiles, but now once the projectiles travel more
  // than 16 meters, they disappear
  let projectiles = new ActorPoolSystem();
  populateProjectilePool(projectiles, {
    size: 100, strength: 1, range: 16, immuneToCollisions: true, disappearOnCollide: true, // gravityAffectsProjectiles: false,
    bodyMaker: () => new CircleBody({ radius: 0.125, cx: -100, cy: -100 }, stage.world, { density: 0.01, elasticity: 1 }),
    appearanceMaker: () => new FilledCircle({ radius: 0.125, fillColor: "#777777", z: 0 }),
  });

  // Throw in the direction the hero is facing
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => {
    if (h.state.current.last_ew == DIRECTION.W || h.state.current.direction == DIRECTION.W || h.state.current.direction == DIRECTION.NW || h.state.current.direction == DIRECTION.SW)
      (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, -.5, .3, -5, 0);
    else
      (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .5, .3, 5, 0)
  });

  Actor.Make({
    appearance: new FilledBox({ width: 2, height: .2, fillColor: "#444444" }),
    rigidBody: new BoxBody({ width: 2, height: .2, cx: 3, cy: 7.4 }),
    role: new Obstacle(),
  })

  Actor.Make({
    appearance: new FilledBox({ width: 2, height: .2, fillColor: "#444444" }),
    rigidBody: new BoxBody({ width: 2, height: .2, cx: 7, cy: 5.4 }),
    role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
  })

  Actor.Make({
    appearance: new FilledBox({ width: 4, height: .2, fillColor: "#444444" }),
    rigidBody: new BoxBody({ width: 4, height: .2, cx: 13, cy: 3.4 }),
    role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
  })

  // Coins on the top platform
  animations = new Map();
  animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("coin0.png", 100).to("coin1.png", 100).to("coin2.png", 100).to("coin3.png", 100).to("coin4.png", 100).to("coin5.png", 100).to("coin6.png", 100).to("coin7.png", 100))
  for (let cx of [11.5, 12.5, 13.5, 14.5]) {
    Actor.Make({
      appearance: new AnimatedSprite({ width: .5, height: .5, animations }),
      rigidBody: new CircleBody({ radius: .25, cx, cy: 3.05 }),
      role: new Goodie(),
    });
  }

  // HUD Coin Counter
  Actor.Make({
    appearance: new AnimatedSprite({ width: .5, height: .5, animations }),
    rigidBody: new CircleBody({ radius: .15, cx: 14.5, cy: 0.5 }, stage.hud),
    role: new Goodie(),
  });
  Actor.Make({
    appearance: new TextSprite({ center: false, face: "Arial", size: 36, color: "#ffffff" }, () => "x " + stage.score.getGoodieCount(0)),
    rigidBody: new CircleBody({ radius: .01, cx: 15, cy: 0.25 }, stage.hud),
    role: new Goodie(),
  });


  animations = new Map();
  animations.set(AnimationState.WALK_W, new AnimationSequence(true)
    .to("lizard_walk_l_0.png", 75).to("lizard_walk_l_1.png", 75)
    .to("lizard_walk_l_2.png", 75).to("lizard_walk_l_3.png", 75)
    .to("lizard_walk_l_4.png", 75).to("lizard_walk_l_5.png", 75)
    .to("lizard_walk_l_6.png", 75).to("lizard_walk_l_7.png", 75)
    .to("lizard_walk_l_8.png", 75));

  animations.set(AnimationState.WALK_E, new AnimationSequence(true)
    .to("lizard_walk_r_0.png", 75).to("lizard_walk_r_1.png", 75)
    .to("lizard_walk_r_2.png", 75).to("lizard_walk_r_3.png", 75)
    .to("lizard_walk_r_4.png", 75).to("lizard_walk_r_5.png", 75)
    .to("lizard_walk_r_6.png", 75).to("lizard_walk_r_7.png", 75)
    .to("lizard_walk_r_8.png", 75));
  remap = new Map();
  remap.set(AnimationState.IDLE_E, AnimationState.WALK_E);
  // Enemy to defeat
  Actor.Make({
    appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
    rigidBody: new PolygonBody({ cx: 14.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, stage.world, { density: 1, disableRotation: true }),
    movement: new PathMovement(new Path().to(14.5, 8.1).to(18.5, 8.1).to(14.5, 8.1), 2.5, true),
    role: new Enemy()
  });

  stage.score.onLose = { level: 1, builder: builder };
  stage.score.onWin = { level: 1, builder: builder };

  stage.score.winSceneBuilder = (overlay: Scene, _screenshot?: ImageSprite) => {
    Actor.Make({
      appearance: _screenshot!,
      // appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
          return true;
        }
      }
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 44, color: "#FFFFFF" }, "Great Job!"),
      rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .1 }, overlay),
    });
  };

  stage.score.loseSceneBuilder = (overlay: Scene, screenshot?: ImageSprite) => {
    Actor.Make({
      appearance: screenshot!,
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
          return true;
        }
      }
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 44, color: "#FFFFFF" }, "Try Again"),
      rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .1 }, overlay),
    });
  };

}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);

/**
 * Draw a box on the scene
 *
 * Note: the box is actually four narrow rectangles
 *
 * @param x0          X coordinate of left side
 * @param y0          Y coordinate of top
 * @param x1          X coordinate of right side
 * @param y1          Y coordinate of bottom
 * @param thickness   How thick should the box be?
 * @param physicsCfg  Common extra configuration options for the walls
 */
function drawBoundingBox(x0: number, y0: number, x1: number, y1: number, thickness: number, physicsCfg: { density?: number, elasticity?: number, friction?: number, disableRotation?: boolean, collisionsEnabled?: boolean, stickySides?: Sides[], stickyDelay?: number, singleRigidSide?: Sides, passThroughId?: number, rotationSpeed?: number, dynamic?: boolean } = {}) {
  // Bottom box:
  let width = Math.abs(x0 - x1);
  let cfg = { box: true, cx: x0 + width / 2, cy: y1 + thickness / 2, width: width + 2 * thickness, height: thickness, img: "" };
  let floor = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg, stage.world, physicsCfg),
    role: new Obstacle(),
  });
  (floor.role as Obstacle).projectileCollision = () => false;


  // The top only differs by translating the Y from the bottom
  // cfg.cy -= (thickness + Math.abs(y0 - y1));// = { box: true, cx: x0 + width / 2, cy: y0 - height / 2 + .5, width, height, img: "" };
  // Actor.Make({
  //   appearance: new ImageSprite(cfg),
  //   rigidBody: new BoxBody(cfg, stage.world, physicsCfg),
  //   role: new Obstacle({ jumpReEnableSides: [] }),
  // });

  // Right box:
  let height = Math.abs(y0 - y1);
  cfg = { box: true, cx: x1 + thickness / 2, cy: y0 + height / 2, height: height + 2 * thickness, width: thickness, img: "" };
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg, stage.world, physicsCfg),
    role: new Obstacle({ jumpReEnableSides: [] }),
  });

  // The left only differs by translating the X
  cfg.cx -= (thickness + Math.abs(x0 - x1));
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg, stage.world, physicsCfg),
    role: new Obstacle({ jumpReEnableSides: [] }),
  });

    // this level introduces the idea of invincibility. Collecting the goodie
    // makes the hero invincible for a little while...
    else if (level == 21) {
    // start with a hero who is controlled via Joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });
    addJoystickControl(
      stage.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // draw a few enemies, and make them rotate
    for (let i = 0; i < 5; ++i) {
      cfg = { cx: i + 4, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
        role: new Enemy(),
      });
    }

    // this goodie makes the hero invincible
    cfg = { cx: 15, cy: 8, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { rotationSpeed: .25 }),
      movement: new PathMovement(new Path().to(15, 8).to(10, 3).to(15, 8), 5, true),
      role: new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          // Note that we *add* 15 seconds, instead of just setting it to 15, in
          // case there was already some invincibility
          (h.role as Hero).invincibleRemaining = ((h.role as Hero).invincibleRemaining + 15);
          return true;
        }
      }),
    });

    // We'll require 5 enemies to be defeated before the destination works
    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination({ onAttemptArrival: () => { return stage.score.getEnemiesDefeated() >= 5; } }),
    });
    stage.score.setVictoryDestination(1);

    // display a goodie count for type-1 goodies.  This shows that the count
    // doesn't increase, since we provided an 'onCollect' that didn't increase
    // the count.
    makeText(stage.hud,
      { cx: 0.1, cy: .5, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 16, z: 2 },
      () => stage.score.getGoodieCount(0) + " Goodies");

    // Show how much invincibility is remaining
    makeText(stage.hud,
      { cx: 0.1, cy: 1, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 16, z: 2 },
      () => (h.role as Hero).invincibleRemaining.toFixed(0) + " Invincibility");

    // put a frames-per-second display on the screen.
    makeText(stage.hud,
      { cx: 0.1, cy: 1.5, center: false, width: .1, height: .1, face: "Arial", color: "#C8C864", size: 16, z: 2 },
      () => stage.renderer.getFPS().toFixed(0) + " fps");

    welcomeMessage("The blue ball will make you invincible for 15 seconds");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level introduces a new concept: scrolling in the X dimension. We have
  // a constant force in the  Y direction, and now we say that tilt can produce
  // forces in X but not in Y. Thus we can tilt to move the hero left/right.
  // Note, too, that the hero will fall to the floor, since there is a constant
  // downward force, but there is not any mechanism to apply a Y force to make
  // it move back up.
  if (level == 31) {
    // make a long level but not a tall level, and provide a constant downward force:
    stage.world.camera.setBounds(0, 0, 3 * 16, 9);
    stage.world.setGravity(0, 10);
    // turn on tilt, but only in the X dimension
    enableTilt(10, 0);

    drawBoundingBox(0, 0, 3 * 16, 9, .1, { density: 1, friction: 1 });

    // Add a hero and destination
    let cfg = { cx: 0.25, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 47, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // This is very important: we need the camera to follow the hero, or it will
    // go off screen.
    stage.world.camera.setCameraFocus(h);

    // When you test this level, it's going to be hard to see that the ball is
    // actually moving.  If you have the "Developer Console" open, you can tap
    // the screen to see how the "world touch" coordinates are changing

    welcomeMessage("Side scroller with tilt");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // In the previous level, it was hard to see that the hero was moving.  We can
  // make a background layer to remedy this situation. Notice that the
  // background uses transparency to show the blue color for part of the screen
  else if (level == 32) {
    // Start with a repeat of the previous level
    stage.world.camera.setBounds(0, 0, 128, 9);
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    drawBoundingBox(0, 0, 128, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 7.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 127, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    stage.world.camera.setCameraFocus(h);

    // Paint the background blue
    stage.backgroundColor = "#17b4ff";

    // put in a picture that auto-tiles, and that moves with velocity "0"
    // relative to the movement of the hero (on whom the camera focuses).  This
    // will simply tile the background.  Note that background layers don't work
    // nicely with zoom.
    //
    // Note that background "layers" are all drawn *before* anything that is
    // drawn with a z index... so the background will be behind the hero
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // make an obstacle that hovers in a fixed place. Note that hovering and
    // zoom do not work together nicely.
    cfg = { cx: 8, cy: 1, radius: 0.5, width: 1, height: 1, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new HoverMovement(8, 1),
      role: new Obstacle(),
    });

    // Add some text on the HUD to show how far the hero has traveled
    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#FF00FF", size: 16, z: 2 },
      () => Math.floor(h.rigidBody?.getCenter().x ?? 0) + " m");

    // Add some text about the previous best score.  Notice that it's not on the
    // HUD, so we only see it when the hero is at the beginning of the level
    makeText(stage.world,
      { cx: 0.1, cy: 8, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 12, z: 0 },
      () => "best: " + (stage.storage.getPersistent("HighScore32") ?? "0") + "M"),

      welcomeMessage("Side Scroller with basic repeating background");
    // when this level ends, we save the best game.score. Once the score is
    // saved, it is saved permanently on the phone. Note that we could run a
    // callback on losing the level, too
    winMessage("Great Job", () => {
      // Get the hero distance at the end of the level... it's our score
      let new_score = Math.ceil(h.rigidBody?.getCenter().x ?? 0);
      // We read the previous best score, which we saved as "HighScore32".
      // Remember that "Persistent" facts never go away, even when we quit the
      // game
      let oldBest = parseInt(stage.storage.getPersistent("HighScore32") ?? "0");
      if (oldBest < new_score)
        // If our new score is higher, then save it
        stage.storage.setPersistent("HighScore32", new_score + "");
    });
    loseMessage("Try Again");
  }

  // Now let's look at how to add multiple background layers.  Also, let's add
  // jumping
  else if (level == 33) {
    // Start like in the previous level
    stage.world.camera.setBounds(0, 0, 128, 9);
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    drawBoundingBox(0, 0, 128, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero({ numJumpsAllowed: 2 }),
      sounds: new SoundEffectComponent({ jump: "flap_flap.ogg" }),
    });

    cfg = { cx: 127, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    stage.world.camera.setCameraFocus(h);

    // this says that touching makes the hero jump.  -10 is the force of the
    // jump in the y dimension (up is negative)
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // set up our background again, but add a few more layers
    stage.backgroundColor = "#17b4ff";

    // this layer has a scroll factor of 0... it won't move
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1 });
    // this layer moves at half the speed of the hero
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
    // this layer has a negative value... it moves faster than the hero
    stage.background.addLayer({ cx: 8, cy: 1, }, { imageMaker: () => new ImageSprite({ width: 16, height: 2.8, img: "front.png" }), speed: -0.5 });

    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

}

/**
 * Put some appropriately-configured projectiles into the projectile system
 *
 * @param cfg                           Configuration options for the
 *                                      projectiles
 * @param cfg.size                      The number of projectiles that can ever
 *                                      be on screen at once
 * @param cfg.bodyMaker                 Make each projectile's initial rigid
 *                                      body
 * @param cfg.appearanceMaker           Make each projectile's appearance
 * @param cfg.strength                  The amount of damage a projectile can do
 *                                      to enemies
 * @param cfg.multiplier                A multiplier on projectile speed
 * @param cfg.immuneToCollisions        Should projectiles pass through walls
 * @param cfg.gravityAffectsProjectiles Should projectiles be subject to gravity
 * @param cfg.fixedVectorVelocity       A fixed velocity for all projectiles
 * @param cfg.rotateVectorToss          Should projectiles be rotated in the
 *                                      direction they are tossed?
 * @param cfg.soundEffects              A sound to play when a projectile
 *                                      disappears
 * @param cfg.randomImageSources        A set of image names to randomly assign
 *                                      to projectiles' appearance
 * @param cfg.range                     Limit the range that projectiles can
 *                                      travel?
 * @param cfg.disappearOnCollide        Should projectiles disappear when they
 *                                      collide with each other?
 */
function populateProjectilePool(pool: ActorPoolSystem, cfg: { size: number, bodyMaker: () => RigidBodyComponent, appearanceMaker: () => AppearanceComponent, strength: number, multiplier?: number, immuneToCollisions: boolean, gravityAffectsProjectiles?: boolean, fixedVectorVelocity?: number, rotateVectorToss?: boolean, soundEffects?: SoundEffectComponent, randomImageSources?: string[], range: number, disappearOnCollide: boolean }) {
  // set up the pool of projectiles
  for (let i = 0; i < cfg.size; ++i) {
    let appearance = cfg.appearanceMaker();
    let rigidBody = cfg.bodyMaker();
    if (!!cfg.gravityAffectsProjectiles)
      rigidBody.body.SetGravityScale(0);
    else
      rigidBody.body.SetGravityScale(1);
    rigidBody.setCollisionsEnabled(cfg.immuneToCollisions);
    let reclaimer = (actor: Actor) => {
      pool.put(actor);
      actor.enabled = false;
    }
    let role = new Projectile({ damage: cfg.strength, range: cfg.range, disappearOnCollide: cfg.disappearOnCollide, reclaimer, randomImageSources: cfg.randomImageSources });
    // Put in some code for eliminating the projectile quietly if it has
    // traveled too far
    role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
      if (!actor) return;
      if (!actor.enabled) return;
      let role = actor.role as Projectile;
      let body = actor.rigidBody.body;
      let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
      let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
      if ((dx * dx + dy * dy) > (role.range * role.range)) reclaimer(actor);
    });
    let p = Actor.Make({ appearance, rigidBody, movement: new ProjectileMovement(cfg), role, sounds: cfg.soundEffects });
    pool.put(p);
  }
}
